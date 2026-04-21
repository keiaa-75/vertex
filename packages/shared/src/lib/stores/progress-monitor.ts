import { writable } from 'svelte/store';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import type { Progress } from '../progress-tracker';

export interface ProgressMonitorState {
    map: Map<string, Progress>;
    loading: boolean;
    error: string | null;
}

const initialState: ProgressMonitorState = {
    map: new Map(),
    loading: true,
    error: null
};

const { subscribe, set } = writable<ProgressMonitorState>(initialState);
export const progressMonitorStore = { subscribe };

let unsubscribe: (() => void) | null = null;

/**
 * Subscribes to the progress collection filtered by the current user's ID.
 * This query satisfies Firestore security rules and allows real-time sync.
 */
export function startProgressMonitor(uid: string) {
    if (unsubscribe) unsubscribe();

    set({ ...initialState, loading: true });

    const progressRef = collection(db, 'progress');
    
    // Query only documents belonging to this user
    const q = query(progressRef, where('userId', '==', uid));

    unsubscribe = onSnapshot(
        q,
        (snapshot) => {
            const newMap = new Map<string, Progress>();
            
            for (const docSnap of snapshot.docs) {
                const data = docSnap.data() as Progress;
                newMap.set(data.lessonId, data);
            }

            set({
                map: newMap,
                loading: false,
                error: null
            });
        },
        (err) => {
            console.error('Progress monitor error:', err);
            set({ ...initialState, loading: false, error: 'Failed to sync progress.' });
        }
    );
}

/**
 * Cleans up the Firestore listener to prevent memory leaks.
 */
export function stopProgressMonitor() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
}