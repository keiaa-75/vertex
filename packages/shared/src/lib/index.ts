// Barrel export for @vertex/shared

// Firebase instances (singleton, safe for multi-iframe)
export { auth, db } from './firebase';

// Progress Monitor (READ/SUBSCRIBE only - dashboard uses this)
export { 
  progressMonitorStore, 
  startProgressMonitor, 
  stopProgressMonitor 
} from './stores/progress-monitor';
export type { ProgressMonitorState } from './stores/progress-monitor';

// User and auth
export {
    userStore,
    logout,
    saveProfile,
    loginWithEmail,
    registerUser
} from './stores/user';
export type { UserProfile, UserState } from './stores/user';

// Curriculum
export { curriculumStore, loadCurriculum, buildLessonMap } from './stores/curriculum';
export type { CurriculumState, Topic, Lesson } from './stores/curriculum';