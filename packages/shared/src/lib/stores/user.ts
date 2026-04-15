import { writable } from 'svelte/store';
import { 
    onAuthStateChanged,
    signOut,
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult,
    type User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface UserProfile {
    studentNo: string;
    fullName: string;
    section: string;
}

export interface UserState {
    firebaseUser: User | null;
    profile: UserProfile | null;
    loading: boolean;
    needsProfileSetup: boolean;
}

const initialState: UserState = {
    firebaseUser: null,
    profile: null,
    loading: true,
    needsProfileSetup: false
};

const { subscribe, set, update } = writable<UserState>(initialState);

export const userStore = { subscribe };

/**
 * Listens to Firebase auth state changes.
 * Automatically restores session on iframe reload.
 */
onAuthStateChanged(auth, async (firebaseUser) => {
    console.log('Auth state changed:', firebaseUser?.uid ?? 'null');

    if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userDocRef);

        console.log('User doc exists:', userSnap.exists());

        let profile: UserProfile | null = null;
        let needsProfileSetup = false;

        if (userSnap.exists()) {
            profile = userSnap.data() as UserProfile;
        } else {
            needsProfileSetup = true;
        }

        set({ firebaseUser, profile, loading: false, needsProfileSetup });
    } else {
        console.log('No user, setting initialState');
        set(initialState);
    }
});

// Triggers Google OAuth redirect
export async function loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
}

// Checks for OAuth completion/error after redirect
export async function handleRedirectResult(): Promise<void> {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            // onAuthStateChanged will fire automatically next
            // automatically updates userStore
            console.log('Auth redirect completed successfully');
        }
    } catch (error) {
        console.error('Redirect sign-in failed:', error);
    }
}

/**
 * Saves the onboarding profile to Firestore.
 */
export async function saveProfile(profile: UserProfile): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User must be authenticated to save profile');

    await setDoc(doc(db, 'users', user.uid), profile);

    // Update local store state without triggering re-fetch
    update(state => ({
        ...state,
        profile,
        needsProfileSetup: false
    }));
}

/**
 * Clears Firebase session and resets store.
 */
export async function logout(): Promise<void> {
    await signOut(auth);
}