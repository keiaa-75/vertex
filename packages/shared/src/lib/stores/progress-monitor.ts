import { writable } from 'svelte/store';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface LastSubmission {
  formType: 'pre' | 'post' | 'unknown';
  submittedAt: string;
  score: number | null;
  status: 'ok' | 'below_threshold' | 'processing';
}

export interface PipelineError {
  message: string;
  occurredAt: string;
}

export interface Progress {
  lessonId: string;
  userId: string;
  viewed: boolean;
  viewedAt: Timestamp | null;
  interacted: boolean;
  interactedAt: Timestamp | null;
  completed: boolean;
  completedAt: Timestamp | null;
  /** Percentage score (0–100) from the pre-test form, or null if the form
   *  was ungraded or the student hasn't submitted yet. */
  pretestScore: number | null;
  /** Percentage score (0–100) from the post-test form. */
  quizScore: number | null;
  lastSubmission: LastSubmission | null;
  pipelineError: PipelineError | null;
}

export interface ProgressMonitorState {
  map: Map<string, Progress>;
  loading: boolean;
  error: string | null;
}

const initialState: ProgressMonitorState = {
  map: new Map(),
  loading: false,
  error: null
};

const { subscribe, set } = writable<ProgressMonitorState>(initialState);
export const progressMonitorStore = { subscribe };

let unsubscribe: (() => void) | null = null;

export function startProgressMonitor(uid: string) {
  if (unsubscribe) unsubscribe();

  set({ ...initialState, loading: true });

  const progressRef = collection(db, 'progress');
  const q = query(progressRef, where('userId', '==', uid));

  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const newMap = new Map<string, Progress>();

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as Progress;
        newMap.set(data.lessonId, data);
      }

      set({ map: newMap, loading: false, error: null });
    },
    (err) => {
      console.error('Progress monitor error:', err);
      set({ ...initialState, loading: false, error: 'Failed to sync progress.' });
    }
  );
}

export function stopProgressMonitor() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}