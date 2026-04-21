// packages/shared/src/lib/stores/progress-monitor.ts
import { writable } from 'svelte/store';
import { collection, onSnapshot } from 'firebase/firestore';
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
 * Subscribes to the progress collection and filters client-side by UID.
 * This is the dashboard's "mirror" of progress data - it reacts to writes
 * made by lesson modules via markViewed()/markCompleted().
 * 
 * Safe for classroom-scale apps. For enterprise scale, add a `userId` field 
 * to progress docs and use `where('userId', '==', uid)` for server-side filtering.
 */
export function startProgressMonitor(uid: string) {
  if (unsubscribe) unsubscribe();

  set({ ...initialState, loading: true });

  const progressRef = collection(db, 'progress');

  unsubscribe = onSnapshot(
    progressRef,
    (snapshot) => {
      const newMap = new Map<string, Progress>();
      
      for (const docSnap of snapshot.docs) {
        if (docSnap.id.startsWith(`${uid}_`)) {
          const data = docSnap.data() as Progress;
          newMap.set(data.lessonId, data);
        }
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