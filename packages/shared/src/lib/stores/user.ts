import { writable } from 'svelte/store';
import {
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    type User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface UserProfile {
    fullName: string;
    studentNo: string;
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
}

const { subscribe, set, update } = writable<UserState>(initialState);
export const userStore = { subscribe };

// Email and password login
export async function loginWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
}

// Email/password registration
export async function registerUser(email: string, password: string): Promise<void> {
    if (password.length < 6) throw new Error('Password must be at least 6 characters');

    const { createUserWithEmailAndPassword } = await import ('firebase/auth');
    await createUserWithEmailAndPassword(auth, email, password);
}

onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userDocRef);

        let profile: UserProfile | null = null;
        let needsProfileSetup = false;

        if (userSnap.exists()) {
            profile = userSnap.data() as UserProfile;
        } else {
            needsProfileSetup = true;
        }

        set ({ firebaseUser, profile, loading: false, needsProfileSetup });
    } else {
        set({
            firebaseUser: null,
            profile: null,
            loading: false,
            needsProfileSetup: false
        });
    }
});

export async function saveProfile(profile: UserProfile): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User must be authenticated to save profile');

    await setDoc(doc(db, 'users', user.uid), profile);

    update(state => ({
        ...state,
        profile,
        needsProfileSetup: false
    }));
}

export async function logout(): Promise<void> {
    await signOut(auth);
}