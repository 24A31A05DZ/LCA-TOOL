// Firebase client configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAXXqNMx33oBXiefHCt01Ov6Jif88FjSFw",
  authDomain: "lca-metallurgy-tool.firebaseapp.com",
  projectId: "lca-metallurgy-tool",
  storageBucket: "lca-metallurgy-tool.appspot.com",
  messagingSenderId: "887821634604",
  appId: "1:887821634604:web:c927a7df9cdb8af24e5589"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export default app;

