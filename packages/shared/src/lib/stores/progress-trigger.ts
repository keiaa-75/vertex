import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Writes `interacted: true` to the progress document for the current user
 * and the given lessonId. Safe to call multiple times — uses merge so it
 * never overwrites `viewed`, `completed`, or any other field.
 *
 * Silently no-ops if no authenticated user is present.
 *
 * @param lessonId  The lesson identifier. Pass via URL query param in the
 *                  module's iframe src: `?lessonId=parabola-intro`
 */
export async function markInteracted(lessonId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !lessonId) return;

    const ref = doc(db, 'progress', `${user.uid}_${lessonId}`);

    await setDoc(ref, {
        userId: user.uid,
        lessonId: lessonId,
        interacted: true,
        interactedAt: serverTimestamp(),
    }, { merge: true });
}