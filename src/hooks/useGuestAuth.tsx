import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createGuest, getGuestBySessionId, updateGuestActivity } from '@/lib/database';

interface GuestAuthContextType {
  isGuest: boolean;
  guestName: string | null;
  guestId: string | null;
  sessionId: string | null;
  loginAsGuest: (name?: string) => Promise<void>;
  logoutGuest: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextType | undefined>(undefined);

export const GuestAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const initializeGuestSession = async () => {
      const storedGuest = localStorage.getItem('guest_session');
      if (storedGuest) {
        const guestData = JSON.parse(storedGuest);
        setSessionId(guestData.id);
        
        // Check if guest exists in database
        const existingGuest = await getGuestBySessionId(guestData.id);
        if (existingGuest) {
          setIsGuest(true);
          setGuestName(existingGuest.name);
          setGuestId(existingGuest.id);
          
          // Update activity
          await updateGuestActivity(guestData.id);
        } else {
          // Create guest in database
          const newGuest = await createGuest(guestData.name || 'Guest User', guestData.id);
          if (newGuest) {
            setIsGuest(true);
            setGuestName(newGuest.name);
            setGuestId(newGuest.id);
          }
        }
      }
    };

    initializeGuestSession();
  }, []);

  const loginAsGuest = async (name = 'Guest User') => {
    const newSessionId = `guest_${Date.now()}`;
    const guestData = { 
      name, 
      loginTime: Date.now(),
      id: newSessionId
    };
    
    localStorage.setItem('guest_session', JSON.stringify(guestData));
    setSessionId(newSessionId);
    
    // Create guest in database
    const newGuest = await createGuest(name, newSessionId);
    if (newGuest) {
      setIsGuest(true);
      setGuestName(name);
      setGuestId(newGuest.id);
    }
  };

  const logoutGuest = () => {
    localStorage.removeItem('guest_session');
    setIsGuest(false);
    setGuestName(null);
    setGuestId(null);
    setSessionId(null);
  };

  return (
    <GuestAuthContext.Provider value={{
      isGuest,
      guestName,
      guestId,
      sessionId,
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