import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Generate a cryptographically secure random token
const generateCsrfToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

interface CsrfContextType {
  csrfToken: string;
  refreshToken: () => void;
  validateToken: (token: string) => boolean;
}

const CsrfContext = createContext<CsrfContextType | undefined>(undefined);

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_TOKEN_EXPIRY_KEY = 'csrf_token_expiry';
const TOKEN_VALIDITY_MS = 30 * 60 * 1000; // 30 minutes

export const CsrfProvider = ({ children }: { children: ReactNode }) => {
  const [csrfToken, setCsrfToken] = useState<string>('');

  const generateAndStoreToken = () => {
    const token = generateCsrfToken();
    const expiry = Date.now() + TOKEN_VALIDITY_MS;
    
    try {
      sessionStorage.setItem(CSRF_TOKEN_KEY, token);
      sessionStorage.setItem(CSRF_TOKEN_EXPIRY_KEY, expiry.toString());
    } catch {
      // Session storage unavailable, token will only live in memory
    }
    
    setCsrfToken(token);
    return token;
  };

  const getStoredToken = (): string | null => {
    try {
      const token = sessionStorage.getItem(CSRF_TOKEN_KEY);
      const expiry = sessionStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);
      
      if (token && expiry && Date.now() < parseInt(expiry, 10)) {
        return token;
      }
    } catch {
      // Session storage unavailable
    }
    return null;
  };

  useEffect(() => {
    const storedToken = getStoredToken();
    if (storedToken) {
      setCsrfToken(storedToken);
    } else {
      generateAndStoreToken();
    }
  }, []);

  const refreshToken = () => {
    generateAndStoreToken();
  };

  const validateToken = (token: string): boolean => {
    if (!token || !csrfToken) return false;
    
    // Constant-time comparison to prevent timing attacks
    if (token.length !== csrfToken.length) return false;
    
    let result = 0;
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ csrfToken.charCodeAt(i);
    }
    return result === 0;
  };

  return (
    <CsrfContext.Provider value={{ csrfToken, refreshToken, validateToken }}>
      {children}
    </CsrfContext.Provider>
  );
};

export const useCsrfToken = (): CsrfContextType => {
  const context = useContext(CsrfContext);
  if (context === undefined) {
    throw new Error('useCsrfToken must be used within a CsrfProvider');
  }
  return context;
};

// HOC for forms that need CSRF protection
export const withCsrfProtection = <P extends object>(
  WrappedComponent: React.ComponentType<P & { csrfToken: string }>
) => {
  return function WithCsrfProtection(props: P) {
    const { csrfToken } = useCsrfToken();
    return <WrappedComponent {...props} csrfToken={csrfToken} />;
  };
};
