import { useAuth as useAuthContext } from '../contexts/AuthContext';

// This is a simple wrapper around the useAuth function from the context
// It makes it easier to import and use in components
export const useAuth = () => {
  return useAuthContext();
};
