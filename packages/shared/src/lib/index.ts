// Barrel export for @vertex/shared

// Firebase instances (singleton, safe for multi-iframe)
export { auth, db } from './firebase';

// Progress Monitor (READ/SUBSCRIBE only — dashboard uses this)
export {
  progressMonitorStore,
  startProgressMonitor,
  stopProgressMonitor,
} from './stores/progress-monitor';
export type { ProgressMonitorState, Progress } from './stores/progress-monitor';

// Progress write helpers (used by modules)
export { markInteracted } from './stores/progress-trigger';

// User and auth
export {
  userStore,
  logout,
  saveProfile,
  loginWithEmail,
  registerUser,
} from './stores/user';
export type { UserProfile, UserState } from './stores/user';

// Curriculum
export { curriculumStore, loadCurriculum, buildLessonMap } from './stores/curriculum';
export type { CurriculumState, Topic, Lesson } from './stores/curriculum';

// Firestore helpers (re-exported for convenience in modules)
export { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
export { onAuthStateChanged, type User } from 'firebase/auth';

// Audio
export { createAudio } from './audio';
export type { ToneConfig, SoundSchema, DefaultSoundName } from './audio';