// Barrel export for clean imports across packages, 'cuz I love my sanity

// Firebase instances
export { auth, db } from './firebase';

// Progress tracking functions
export { markViewed, markCompleted, getProgress } from './progress';
export type { Progress } from './progress';