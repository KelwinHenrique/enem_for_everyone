import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  AuthError,
  getIdToken
} from 'firebase/auth';
import { auth } from '../firebase/config';
import Loading from '../components/Loading/Loading';
import { useNotification } from './NotificationContext';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      // If user is logged in, get and store the token
      if (user) {
        try {
          const token = await getIdToken(user);
          localStorage.setItem('authToken', token);
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
      } else {
        // Remove token when user logs out
        localStorage.removeItem('authToken');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Get and store the token after successful login
      const token = await getIdToken(result.user);
      localStorage.setItem('authToken', token);
      
      showNotification('success', `Bem-vindo, ${result.user.displayName || 'Usuário'}!`);
    } catch (error) {
      const authError = error as AuthError;
      console.error('Error signing in with Google:', authError);
      
      let errorMessage = 'Erro ao fazer login com Google. Tente novamente.';
      if (authError.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login cancelado. A janela foi fechada.';
      } else if (authError.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Requisição cancelada. Tente novamente.';
      } else if (authError.code === 'auth/network-request-failed') {
        errorMessage = 'Erro de conexão. Verifique sua internet.';
      }
      
      showNotification('error', errorMessage);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Remove token when user logs out
      localStorage.removeItem('authToken');
      showNotification('info', 'Você saiu da sua conta.');
    } catch (error) {
      console.error('Error signing out:', error);
      showNotification('error', 'Erro ao sair da conta. Tente novamente.');
    }
  };

  // Function to get the current token
  const getToken = async (): Promise<string | null> => {
    if (currentUser) {
      try {
        const token = await getIdToken(currentUser, true); // Force refresh
        localStorage.setItem('authToken', token);
        return token;
      } catch (error) {
        console.error('Error refreshing token:', error);
        return localStorage.getItem('authToken');
      }
    }
    return localStorage.getItem('authToken');
  };

  const value = {
    currentUser,
    loading,
    signInWithGoogle,
    logout,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <Loading /> : children}
    </AuthContext.Provider>
  );
};
