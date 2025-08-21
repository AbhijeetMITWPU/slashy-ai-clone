import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GuestAuthContextType {
  isGuest: boolean;
  guestName: string | null;
  loginAsGuest: (name?: string) => void;
  logoutGuest: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextType | undefined>(undefined);

export const GuestAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState<string | null>(null);

  useEffect(() => {
    const storedGuest = localStorage.getItem('guest_session');
    if (storedGuest) {
      const guestData = JSON.parse(storedGuest);
      setIsGuest(true);
      setGuestName(guestData.name || 'Guest User');
    }
  }, []);

  const loginAsGuest = (name = 'Guest User') => {
    const guestData = { 
      name, 
      loginTime: Date.now(),
      id: `guest_${Date.now()}`
    };
    localStorage.setItem('guest_session', JSON.stringify(guestData));
    setIsGuest(true);
    setGuestName(name);
  };

  const logoutGuest = () => {
    localStorage.removeItem('guest_session');
    setIsGuest(false);
    setGuestName(null);
  };

  return (
    <GuestAuthContext.Provider value={{
      isGuest,
      guestName,
      loginAsGuest,
      logoutGuest
    }}>
      {children}
    </GuestAuthContext.Provider>
  );
};

export const useGuestAuth = () => {
  const context = useContext(GuestAuthContext);
  if (context === undefined) {
    throw new Error('useGuestAuth must be used within a GuestAuthProvider');
  }
  return context;
};