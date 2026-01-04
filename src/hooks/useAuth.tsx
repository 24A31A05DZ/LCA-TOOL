import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from '@/integrations/firebase/client';

interface AuthContextType {
  user: FirebaseUser | null;
  session: FirebaseUser | null; // Firebase doesn't have separate Session, using User for compatibility
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, companyName: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error: any) {
      // Map Firebase error codes to user-friendly messages
      let errorMessage = error.message;
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        errorMessage = 'Invalid login credentials';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      return { error: new Error(errorMessage) };
    }
  };

  const signUp = async (email: string, password: string, companyName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update user profile with company name
      await updateProfile(userCredential.user, {
        displayName: companyName,
      });
      return { error: null };
    } catch (error: any) {
      // Map Firebase error codes to user-friendly messages
      let errorMessage = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      }
      return { error: new Error(errorMessage) };
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      return { error: null };
    } catch (error: any) {
      // Log full error for debugging
      console.error('Google sign-in failed:', error);

      // Map common Firebase auth errors to friendlier messages
      let message = 'An unexpected error occurred during Google sign-in.';
      if (error && error.code) {
        switch (error.code) {
          case 'auth/network-request-failed':
            message = 'Network error — please check your internet connection.';
            break;
          case 'auth/unauthorized-domain':
            message = 'This domain is not authorized for OAuth sign-in. Add this domain in the Firebase Console under Authentication → Authorized domains.';
            break;
          case 'auth/popup-closed-by-user':
            message = 'Sign-in popup was closed before completing. Please try again.';
            break;
          case 'auth/popup-blocked':
            message = 'Popup was blocked — allow popups for this site or try using a different browser.';
            break;
          case 'auth/cors-unsupported':
            message = 'This browser does not support CORS for OAuth flows. Try signing in using a different browser.';
            break;
          default:
            message = error.message || message;
        }
      }

      return { error: new Error(message) };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, session: user, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
