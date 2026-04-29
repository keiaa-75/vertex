# pipeline

Server-side assessment pipeline built on Google Apps Script. Handles pre-test and post-test form submissions, resolves student emails to Firebase UIDs, and writes scored progress to Firestore. No third-party libraries; all Firestore access goes through the REST API via `UrlFetchApp`.

## Files

- **`vertex-pipeline.gs`** is the main script. It exposes a `handle(e)` entry point and contains all the logic for token minting, Firestore reads and writes, score calculation, and routing between pre-test and post-test flows.
- **`form-trigger.gs`** is a thin trigger shim. It is the file you attach the `onFormSubmit` installable trigger to in the Apps Script editor. It delegates immediately to `VertexPipeline.handle(e)`.

## How it works

When a student submits a Google Form, the `onFormSubmit` trigger fires and the pipeline runs the following steps.

1. Resolves the respondent's email to a Firebase UID by querying the `users` Firestore collection.
2. Extracts `lessonId` and `formType` (`pre` or `post`) from hidden form fields.
3. Writes an immediate acknowledgement to the progress document with `status: processing` so the dashboard can show a pending state without waiting for scoring to complete.
4. Opens the form, fetches the graded response, and calculates a percentage score from point values. If the form has no point values, score is recorded as `null`.
5. Writes the final result based on form type.

For a pre-test, it sets `viewed: true`, `viewedAt`, and `pretestScore`.

For a post-test that passes the 75% threshold, it sets `completed: true`, `completedAt`, and `quizScore`. For a post-test that falls below the threshold, it records `quizScore` without advancing `completed`, so the dashboard can still display the score and mastery level.

If anything fails after the acknowledgement write, a `pipelineError` object is written to the progress document so the dashboard can surface it to the student.

## Setup

The script requires a service account key stored in Apps Script Script Properties under the key `FIREBASE_SA_KEY`. The value should be the full JSON credential object for a service account with Firestore read/write access.

OAuth2 tokens are minted from this key using a manually constructed JWT, then cached in Script Properties for up to one hour to avoid minting a new token on every submission.

## Form requirements

Each form must include two hidden or pre-filled fields that the pipeline reads by title:

| Field title | Expected value |
|---|---|
| `lessonId` | The lesson identifier, e.g. `parabola-intro` |
| `formType` | `pre` or `post` |

The form must also collect the respondent's email. Enable "Collect email addresses" in the form settings.

## Progress document structure

Documents are written to `progress/{uid}_{lessonId}`. The pipeline only patches the fields it is responsible for using `updateMask`, so it never overwrites fields it did not set.