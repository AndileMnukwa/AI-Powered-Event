import { createContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    status: false,
    id: 0,
    username: "",
    isAdmin: false
  });
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthState({
          status: true,
          id: user.uid,
          username: user.displayName || user.email,
          isAdmin: user.claims?.admin || false // Requires custom claims setup
        });
      } else {
        setAuthState({
          status: false,
          id: 0,
          username: "",
          isAdmin: false
        });
      }
      setAuthLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ authState, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
