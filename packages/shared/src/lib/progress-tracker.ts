import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

export interface Progress {
    lessonId: string;
    viewed: boolean;
    viewedAt: Timestamp | null;
    completed: boolean;
    completedAt: Timestamp | null;
    quizScore: number | null;
}

/**
 * Constructs the Firestore document ID for progress
 */
function buildProgressDocId(uid: string, lessonId: string): string {
    return `${uid}_${lessonId}`;
}

/**
 * Marks a lesson as viewed (idempotent).
 * Only writes if not already viewed.
 */
export async function markViewed(lessonId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User must be authenticated to track progress');

    const docId = buildProgressDocId(user.uid, lessonId);
    const progressRef = doc(db, 'progress', docId);

    // Check current state first to avoid unnecessary writes
    const snap = await getDoc(progressRef);
    if (snap.exists() && snap.data().viewed) return;

    await setDoc(progressRef, {
        lessonId,
        viewed: true,
        viewedAt: serverTimestamp(),
        completed: false,
        completedAt: null,
        quizScore: null
    }, { merge: true });
}

/**
 * Marks a lesson as completed with a quiz score.
 * Only writes if not already completed OR if score improved.
 */
export async function markCompleted(lessonId: string, score:number): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User must be authenticated to track progress');

    const docId = buildProgressDocId(user.uid, lessonId);
    const progressRef = doc(db, 'progress', docId);

    const snap = await getDoc(progressRef);
    const existing = snap.data() as Progress | undefined;

    // Only update if not complete, or if new score is higher
    if (existing?.completed && (existing.quizScore ?? 0) >= score) return;

    await setDoc(progressRef, {
        lessonId,
        viewed: true,
        viewedAt: existing?.viewedAt ?? serverTimestamp(),
        completed: true,
        completedAt: serverTimestamp(),
        quizScore: score
    }, { merge: true });
}

/**
 * Retrieves progress for a specific lesson.
 * Returns null if no record exists.
 */
export async function getProgress(lessonId: string): Promise<Progress | null> {
    const user = auth.currentUser;
    if (!user) return null;

    const docId = buildProgressDocId(user.uid, lessonId);
    const snap = await getDoc(doc(db, 'progress', docId));

    if (!snap.exists()) return null;
    return snap.data() as Progress;
}