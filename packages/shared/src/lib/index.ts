// Barrel export for clean imports across packages, 'cuz I love my sanity

// Firebase instances
export { auth, db } from './firebase';

// Progress tracking functions
export { markViewed, markCompleted, getProgress } from './progress';
export type { Progress } from './progress';

// Stores
export { userStore, logout, saveProfile } from './stores/user';
export type { UserProfile, UserState } from './stores/user';

export { curriculumStore, loadCurriculum, buildLessonMap } from './stores/curriculum';
export type { CurriculumState, Topic, Lesson } from './stores/curriculum';