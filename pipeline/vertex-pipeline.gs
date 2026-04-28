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
 * Scope: cloud-platform (covers Firestore read/write)
 */
function getAccessToken_() {
  const saJson = PropertiesService.getScriptProperties().getProperty('FIREBASE_SA_KEY');
  if (!saJson) throw new Error('FIREBASE_SA_KEY missing in Script Properties.');

  const sa = JSON.parse(saJson);
  const now = Math.floor(Date.now() / 1000);

  const header = Utilities.base64EncodeWebSafe(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim  = Utilities.base64EncodeWebSafe(JSON.stringify({
    iss: sa.client_email,
    scope:'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }));

  const signature = Utilities.base64EncodeWebSafe(
    Utilities.computeRsaSha256Signature(`${header}.${claim}`, sa.private_key)
  );

  const jwt = `${header}.${claim}.${signature}`;

  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });

  const token = JSON.parse(res.getContentText()).access_token;
  if (!token) throw new Error('Failed to obtain access token from OAuth2 endpoint.');
  return token;
}

function authHeaders_() {
  return {
    Authorization: `Bearer ${getAccessToken_()}`,
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
  // Fallback for unhandled types — write as null rather than silently drop
  return { nullValue: 'NULL_VALUE' };
}

/**
 * Converts a plain JS object into Firestore's typed field format.
 * Handles: string, number, boolean, null, nested objects (→ mapValue).
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
 * Top-level keys in `data` are the field names added to the updateMask;
 * nested objects are serialised as mapValue and replace the entire map.
 *
 * @param {string} docPath  - e.g. 'progress/uid_lessonId'
 * @param {Object} data     - Plain JS object of fields to write
 */
function patchDocument_(docPath, data) {
  const fields = toFirestoreFields_(data);
  const mask = Object.keys(fields)
    .map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`)
    .join('&');
  const url = `${FIRESTORE_BASE}/${docPath}?${mask}`;

  const res = UrlFetchApp.fetch(url, {
    method: 'patch',
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
 *
 * @param  {string} collectionId
 * @param  {string} fieldPath
 * @param  {string} op            Firestore operator string e.g. 'EQUAL'
 * @param  {Object} value         Typed Firestore value e.g. { stringValue: 'foo' }
 * @param  {number} [limit=1]
 * @returns {Array}               Array of Firestore query result objects
 */
function runQuery_(collectionId, fieldPath, op, value, limit) {
  const url = `${FIRESTORE_BASE}:runQuery`;

  const body = {
    structuredQuery: {
      from: [{ collectionId }],
      where: {
        fieldFilter: {
          field: { fieldPath },
          op,
          value
        }
      },
      limit: limit || 1
    }
  };

  const res = UrlFetchApp.fetch(url, {
    method: 'post',
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
 *
 * @param  {GoogleAppsScript.Forms.Form}         form
 * @param  {GoogleAppsScript.Forms.FormResponse} freshResponse
 * @returns {{ score: number, maxScore: number }}
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
    maxScore: maxScore || 1 // fallback to 1 to avoid division by zero
  };
}

function onFormSubmit(e) {
  const response = e.response;
  const respondentEmail = response.getRespondentEmail();

  // 1. Resolve UID — if this fails we have nowhere to write, so bail early
  const uid = resolveUidFromEmail(respondentEmail);
  if (!uid) {
    Logger.log('SKIPPED: Email not found in users collection. Student must complete profile setup first.');
    return;
  }

  // 2. Extract lessonId and formType
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

  // 3. From here we have uid + lessonId, so all errors can be written to Firestore
  const docPath = `progress/${uid}_${lessonId}`;

  try {
    if (formType === 'post') {
      const form = FormApp.openById(e.source.getId());
      const freshResponse = form.getResponse(response.getId());
      const { score, maxScore } = calculateQuizScore_(form, freshResponse);
      const percentage = (score / maxScore) * 100;
      const passed = percentage >= 75;

      const lastSubmission = {
        formType: 'post',
        submittedAt: new Date().toISOString(),
        score: percentage,
        status: passed ? 'ok' : 'below_threshold'
      };

      if (passed) {
        patchDocument_(docPath, {
          userId:      uid,
          lessonId:    lessonId,
          completed:   true,
          completedAt: new Date().toISOString(),
          quizScore:   percentage,
          viewed:      true,
          lastSubmission,
          pipelineError: null  // clear any prior error now that we have a clean result
        });
        Logger.log(`SUCCESS: Post-test passed (${percentage.toFixed(1)}%). Marked completed.`);
      } else {
        // Score recorded but not passed — write lastSubmission so navigator can surface the score
        patchDocument_(docPath, {
          userId:    uid,
          lessonId:  lessonId,
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
    Logger.log(`ERROR in write phase: ${err.message}`);

    // Surface the error to the student via the navigator's status line.
    // Best-effort — if this also fails we can only log.
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

    throw err;  // re-throw so GAS marks the trigger execution as failed
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