/**
 * VERTEX PIPELINE
 * Handles pre-test (viewed) and post-test (completed) submissions
 * from Google Forms, resolves email-to-UID, and writes to Firestore.
 *
 * No third-party libraries. Uses Firestore REST API directly via UrlFetchApp.
 */

const PROJECT_ID = 'vertex-dd7e4';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/**
 * Mints a short-lived OAuth2 access token from the service account credentials.
 * Caches the token in Script Properties for up to 1 hour (with a 90s safety margin)
 * to avoid re-fetching on every execution. The cache lives server-side only —
 * Script Properties are never exposed to clients, so the risk profile is flat
 * relative to the SA key already stored there.
 */
function getAccessToken_() {
  const props  = PropertiesService.getScriptProperties();
  const cached = props.getProperty('CACHED_TOKEN');
  const expiry = parseInt(props.getProperty('TOKEN_EXPIRY') || '0', 10);

  if (cached && Math.floor(Date.now() / 1000) < expiry - 90) {
    return cached;
  }

  const saJson = props.getProperty('FIREBASE_SA_KEY');
  if (!saJson) throw new Error('FIREBASE_SA_KEY missing in Script Properties.');

  const sa  = JSON.parse(saJson);
  const now = Math.floor(Date.now() / 1000);

  const header = Utilities.base64EncodeWebSafe(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim  = Utilities.base64EncodeWebSafe(JSON.stringify({
    iss:   sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud:   'https://oauth2.googleapis.com/token',
    exp:   now + 3600,
    iat:   now
  }));

  const signature = Utilities.base64EncodeWebSafe(
    Utilities.computeRsaSha256Signature(`${header}.${claim}`, sa.private_key)
  );

  const jwt = `${header}.${claim}.${signature}`;

  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method:      'post',
    contentType: 'application/x-www-form-urlencoded',
    payload:     `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });

  const token = JSON.parse(res.getContentText()).access_token;
  if (!token) throw new Error('Failed to obtain access token from OAuth2 endpoint.');

  props.setProperty('CACHED_TOKEN', token);
  props.setProperty('TOKEN_EXPIRY', String(now + 3600));

  return token;
}

function authHeaders_() {
  return {
    Authorization:  `Bearer ${getAccessToken_()}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Converts a single JS value to a Firestore typed value object.
 * Handles: string, number, boolean, null, plain object (→ mapValue).
 */
function toFirestoreValue_(value) {
  if (typeof value === 'string')  return { stringValue: value };
  if (typeof value === 'number')  return { doubleValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (value === null)             return { nullValue: 'NULL_VALUE' };
  if (typeof value === 'object' && !Array.isArray(value)) {
    return { mapValue: { fields: toFirestoreFields_(value) } };
  }
  return { nullValue: 'NULL_VALUE' };
}

/**
 * Converts a plain JS object into Firestore's typed field format.
 */
function toFirestoreFields_(obj) {
  const fields = {};
  for (const key of Object.keys(obj)) {
    fields[key] = toFirestoreValue_(obj[key]);
  }
  return fields;
}

/**
 * Writes (patch/merge) a Firestore document at the given path.
 * Uses PATCH with updateMask so existing fields not in `data` are preserved.
 *
 * @param {string} docPath  - e.g. 'progress/uid_lessonId'
 * @param {Object} data     - Plain JS object of fields to write
 */
function patchDocument_(docPath, data) {
  const fields = toFirestoreFields_(data);
  const mask   = Object.keys(fields)
    .map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`)
    .join('&');
  const url = `${FIRESTORE_BASE}/${docPath}?${mask}`;

  const res    = UrlFetchApp.fetch(url, {
    method:  'patch',
    headers: authHeaders_(),
    payload: JSON.stringify({ fields })
  });

  const status = res.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error(`Firestore PATCH failed (${status}): ${res.getContentText()}`);
  }
}

/**
 * Runs a structured query against a collection and returns matching documents.
 */
function runQuery_(collectionId, fieldPath, op, value, limit) {
  const url  = `${FIRESTORE_BASE}:runQuery`;
  const body = {
    structuredQuery: {
      from:  [{ collectionId }],
      where: { fieldFilter: { field: { fieldPath }, op, value } },
      limit: limit || 1
    }
  };

  const res    = UrlFetchApp.fetch(url, {
    method:  'post',
    headers: authHeaders_(),
    payload: JSON.stringify(body)
  });

  const status = res.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error(`Firestore runQuery failed (${status}): ${res.getContentText()}`);
  }

  return JSON.parse(res.getContentText());
}

/**
 * Queries the 'users' collection for a document whose 'email' field matches.
 * Returns the Firestore document ID (Firebase Auth UID), or null if not found.
 */
function resolveUidFromEmail(email) {
  if (!email) {
    Logger.log('No email provided.');
    return null;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const results = runQuery_('users', 'email', 'EQUAL', { stringValue: normalizedEmail });

  if (results && results[0] && results[0].document) {
    const uid = results[0].document.name.split('/').pop();
    Logger.log(`Resolved UID '${uid}' for '${normalizedEmail}'`);
    return uid;
  }

  Logger.log(`No user found for email '${normalizedEmail}'`);
  return null;
}

/**
 * Calculates quiz score manually from item-level responses.
 * getScore()/getMaxScore() are unreliable on FormResponse objects
 * in library execution contexts — this is the stable alternative.
 */
function calculateQuizScore_(form, freshResponse) {
  let score = 0;
  for (const item of freshResponse.getGradableItemResponses()) {
    score += item.getScore() || 0;
  }

  const gradableTypes = {
    [FormApp.ItemType.MULTIPLE_CHOICE]: i => i.asMultipleChoiceItem().getPoints(),
    [FormApp.ItemType.CHECKBOX]:        i => i.asCheckboxItem().getPoints(),
    [FormApp.ItemType.LIST]:            i => i.asListItem().getPoints(),
    [FormApp.ItemType.PARAGRAPH_TEXT]:  i => i.asParagraphTextItem().getPoints(),
    [FormApp.ItemType.TEXT]:            i => i.asTextItem().getPoints(),
    [FormApp.ItemType.SCALE]:           i => i.asScaleItem().getPoints(),
    [FormApp.ItemType.GRID]:            i => i.asGridItem().getPoints(),
    [FormApp.ItemType.DATE]:            i => i.asDateItem().getPoints(),
    [FormApp.ItemType.TIME]:            i => i.asTimeItem().getPoints(),
  };

  let maxScore = 0;
  for (const item of form.getItems()) {
    const getter = gradableTypes[item.getType()];
    if (getter) {
      try { maxScore += getter(item) || 0; } catch (_) {}
    }
  }

  return {
    score,
    maxScore: maxScore || 1
  };
}

function onFormSubmit(e) {
  const response        = e.response;
  const respondentEmail = response.getRespondentEmail();

  // ── Resolve UID — if this fails we have nowhere to write, bail early ──
  const uid = resolveUidFromEmail(respondentEmail);
  if (!uid) {
    Logger.log('SKIPPED: Email not found in users collection. Student must complete profile setup first.');
    return;
  }

  const lessonId = extractLessonId_(response);
  if (!lessonId) {
    Logger.log('SKIPPED: Could not determine lessonId from form.');
    return;
  }

  const formType = extractFormType_(response);
  if (!formType || (formType !== 'pre' && formType !== 'post')) {
    Logger.log(`SKIPPED: Invalid formType '${formType}'. Expected 'pre' or 'post'.`);
    return;
  }

  const docPath = `progress/${uid}_${lessonId}`;

  // ── Phase 1: Acknowledge immediately ─────────────────────────────────
  // Written before any fallible processing. Navigator reads this sentinel
  // and shows "Submission received — processing…" rather than staying
  // silently locked if the processing phase fails.
  try {
    patchDocument_(docPath, {
      userId:   uid,
      lessonId: lessonId,
      lastSubmission: {
        formType:    formType,
        submittedAt: new Date().toISOString(),
        score:       null,
        status:      'processing'
      },
      pipelineError: null
    });
    Logger.log(`Phase 1 ACK written for ${uid}_${lessonId} (${formType})`);
  } catch (ackErr) {
    // If even the acknowledgment write fails, something is fundamentally wrong
    // with the Firestore connection or service account. Log and bail — there
    // is nothing safe to do from here.
    Logger.log(`FATAL: Phase 1 ACK write failed: ${ackErr.message}`);
    throw ackErr;
  }

  // ── Phase 2: Process and write final state ────────────────────────────
  try {
    if (formType === 'post') {
      const form          = FormApp.openById(e.source.getId());
      const freshResponse = form.getResponse(response.getId());
      const { score, maxScore } = calculateQuizScore_(form, freshResponse);
      const percentage    = (score / maxScore) * 100;
      const passed        = percentage >= 75;

      const lastSubmission = {
        formType:    'post',
        submittedAt: new Date().toISOString(),
        score:       percentage,
        status:      passed ? 'ok' : 'below_threshold'
      };

      if (passed) {
        patchDocument_(docPath, {
          userId:        uid,
          lessonId:      lessonId,
          completed:     true,
          completedAt:   new Date().toISOString(),
          quizScore:     percentage,
          viewed:        true,
          lastSubmission,
          pipelineError: null
        });
        Logger.log(`SUCCESS: Post-test passed (${percentage.toFixed(1)}%). Marked completed.`);
      } else {
        patchDocument_(docPath, {
          userId:        uid,
          lessonId:      lessonId,
          lastSubmission,
          pipelineError: null
        });
        Logger.log(`RECORDED: Score ${percentage.toFixed(1)}% — below threshold. lastSubmission written, progress not advanced.`);
      }

    } else {
      // pre-test
      patchDocument_(docPath, {
        userId:   uid,
        lessonId: lessonId,
        viewed:   true,
        viewedAt: new Date().toISOString(),
        lastSubmission: {
          formType:    'pre',
          submittedAt: new Date().toISOString(),
          score:       null,
          status:      'ok'
        },
        pipelineError: null
      });
      Logger.log('SUCCESS: Pre-test submitted. Marked viewed.');
    }

  } catch (err) {
    Logger.log(`ERROR in Phase 2 processing: ${err.message}`);

    // Best-effort: surface the error to the student via navigator's status line.
    try {
      patchDocument_(docPath, {
        userId:   uid,
        lessonId: lessonId,
        pipelineError: {
          message:    err.message,
          occurredAt: new Date().toISOString()
        }
      });
      Logger.log('pipelineError written to progress document.');
    } catch (writeErr) {
      Logger.log(`Failed to write pipelineError: ${writeErr.message}`);
    }

    throw err;
  }
}

function extractLessonId_(response) {
  for (const item of response.getItemResponses()) {
    const title = item.getItem().getTitle().toLowerCase();
    if (title === 'lesson id' || title === 'lessonid') {
      return item.getResponse().trim();
    }
  }
  return null;
}

function extractFormType_(response) {
  for (const item of response.getItemResponses()) {
    const title = item.getItem().getTitle().toLowerCase();
    if (title === 'form type' || title === 'formtype' || title === 'type') {
      return item.getResponse().trim().toLowerCase();
    }
  }
  return null;
}

function handle(e) {
  return onFormSubmit(e);
}