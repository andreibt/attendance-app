import Constants from 'expo-constants';

export type FirebaseExtraConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
};

type FirebaseConfig = Required<Pick<FirebaseExtraConfig, 'apiKey' | 'projectId' | 'appId'>> & FirebaseExtraConfig;

let firebaseAppPromise: Promise<any | null> | null = null;
let firestorePromise: Promise<any | null> | null = null;

const hasRequiredFirebaseValues = (config: FirebaseExtraConfig | undefined | null): config is FirebaseConfig => {
  if (!config) return false;
  return Boolean(config.apiKey && config.projectId && config.appId);
};

const getFirebaseConfig = (): FirebaseConfig | null => {
  const firebaseConfig = Constants.expoConfig?.extra?.firebase as FirebaseExtraConfig | undefined;

  if (!hasRequiredFirebaseValues(firebaseConfig)) {
    return null;
  }

  return firebaseConfig;
};

const loadFirebaseApp = async () => {
  const config = getFirebaseConfig();
  if (!config) {
    return null;
  }

  try {
    // @ts-expect-error -- The Firebase SDK is optional and resolved at runtime when installed.
    const { getApps, initializeApp } = await import('firebase/app');
    const apps = getApps();
    return apps.length > 0 ? apps[0] : initializeApp(config);
  } catch (error) {
    console.warn('Firebase SDK could not be loaded. Have you installed the "firebase" package?', error);
    return null;
  }
};

export const getFirebaseApp = async () => {
  if (!firebaseAppPromise) {
    firebaseAppPromise = loadFirebaseApp();
  }

  return firebaseAppPromise;
};

export const getFirebaseAuth = async () => {
  const app = await getFirebaseApp();
  if (!app) {
    return null;
  }

  try {
    // @ts-expect-error -- The Firebase Auth SDK is optional and resolved at runtime when installed.
    const { getAuth } = await import('firebase/auth');
    return getAuth(app);
  } catch (error) {
    console.warn('Firebase Auth module could not be loaded. Install the "firebase" package to enable it.', error);
    return null;
  }
};

const loadFirestore = async () => {
  const app = await getFirebaseApp();
  if (!app) {
    return null;
  }

  try {
    // @ts-expect-error -- The Firebase Firestore SDK is optional and resolved at runtime when installed.
    const { getFirestore } = await import('firebase/firestore');
    return getFirestore(app);
  } catch (error) {
    console.warn('Firebase Firestore module could not be loaded. Install the "firebase" package to enable it.', error);
    return null;
  }
};

export const getFirebaseFirestore = async () => {
  if (!firestorePromise) {
    firestorePromise = loadFirestore();
  }

  return firestorePromise;
};

export const signInWithEmailAndPasswordFromFirebase = async (email: string, password: string) => {
  const auth = await getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Provide Firebase credentials to enable sign-in.');
  }

  try {
    // @ts-expect-error -- The Firebase Auth SDK is optional and resolved at runtime when installed.
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.warn('Firebase sign-in failed. Verify your Firebase configuration.', error);
    throw error;
  }
};

type FirestoreUserRecord = {
  displayName?: string;
  role?: string;
};

export const fetchUserRecord = async (uid: string): Promise<FirestoreUserRecord | null> => {
  const firestore = await getFirebaseFirestore();
  if (!firestore) {
    throw new Error('Firebase Firestore is not configured. Provide Firebase credentials to enable user profiles.');
  }

  try {
    // @ts-expect-error -- The Firebase Firestore SDK is optional and resolved at runtime when installed.
    const { doc, getDoc } = await import('firebase/firestore');
    const snapshot = await getDoc(doc(firestore, 'users', uid));
    if (!snapshot.exists()) {
      return null;
    }
    return snapshot.data() as FirestoreUserRecord;
  } catch (error) {
    console.warn('Failed to load user profile from Firestore. Verify your Firebase configuration.', error);
    throw error;
  }
};

export const signOutFromFirebase = async () => {
  const auth = await getFirebaseAuth();
  if (!auth) {
    return false;
  }

  try {
    // @ts-expect-error -- The Firebase Auth SDK is optional and resolved at runtime when installed.
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    return true;
  } catch (error) {
    console.warn('Firebase sign-out failed. Verify your Firebase configuration.', error);
    throw error;
  }
};

export const firebaseConfigSummary = () => {
  const config = getFirebaseConfig();
  if (!config) {
    return 'Firebase is not configured. Provide values in your environment variables to enable it.';
  }

  const populatedKeys = Object.entries(config)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key)
    .sort();

  return `Firebase configured with keys: ${populatedKeys.join(', ')}`;
};
