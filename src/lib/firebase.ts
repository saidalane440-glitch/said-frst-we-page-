import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  
  if (credential?.accessToken) {
    localStorage.setItem('google_drive_token', credential.accessToken);
    localStorage.setItem('google_drive_token_expiry', (Date.now() + 3500 * 1000).toString()); // ~1 hour
  }
  return result;
};

export const getDriveToken = () => {
  const token = localStorage.getItem('google_drive_token');
  const expiry = localStorage.getItem('google_drive_token_expiry');
  if (!token || !expiry || Date.now() > parseInt(expiry)) {
    return null;
  }
  return token;
};

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection successful");
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}

if (process.env.NODE_ENV !== 'production') {
  testConnection();
}
