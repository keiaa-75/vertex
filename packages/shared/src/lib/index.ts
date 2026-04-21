// Barrel export for clean imports across packages, 'cuz I love my sanity

// Firebase instances
export { auth, db } from './firebase';

// Progress Tracker (WRITE operations - used by lesson modules)
export { markViewed, markCompleted, getProgress } from './progress-tracker';
export type { Progress } from './progress-tracker';

// Progress Monitor (READ/SUBSCRIBE - used by dashboard)
export { 
  progressMonitorStore, 
  startProgressMonitor, 
  stopProgressMonitor 
} from './stores/progress-monitor';
export type { ProgressMonitorState } from './stores/progress-monitor';;

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