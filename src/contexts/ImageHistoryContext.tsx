import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface HistoryItem {
  id: string;
  featureName: string;
  processedImageUrl: string; // data URL
  timestamp: string;
}

interface ImageHistoryContextType {
  history: HistoryItem[];
  addToHistory: (featureName: string, processedImageUrl: string) => void;
  removeFromHistory: (id: string) => void;
}

const ImageHistoryContext = createContext<ImageHistoryContextType>({} as ImageHistoryContextType);

export function ImageHistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const loadFromStorage = (): HistoryItem[] => {
    try {
      const stored = localStorage.getItem('visionpro_history');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  };

  const [history, setHistory] = useState<HistoryItem[]>(loadFromStorage);

  const saveToStorage = (items: HistoryItem[]) => {
    try {
      // Only keep last 30 items to avoid localStorage limits
      const trimmed = items.slice(0, 30);
      localStorage.setItem('visionpro_history', JSON.stringify(trimmed));
    } catch { /* storage full */ }
  };

  const addToHistory = useCallback((featureName: string, processedImageUrl: string) => {
    const item: HistoryItem = {
      id: crypto.randomUUID(),
      featureName,
      processedImageUrl,
      timestamp: new Date().toISOString(),
    };
    setHistory(prev => {
      const next = [item, ...prev];
      saveToStorage(next);
      return next;
    });

    // Also save to DB if user is logged in
    if (user) {
      supabase.from('image_history').insert({
        user_id: user.id,
        operations_applied: [featureName],
        processed_image_url: processedImageUrl.substring(0, 500), // truncate data url for DB
      }).then(() => {
        // Increment images_processed count
        supabase.rpc('increment_images_processed' as never, { uid: user.id } as never).then(() => {});
      });
    }
  }, [user]);

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => {
      const next = prev.filter(h => h.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  return (
    <ImageHistoryContext.Provider value={{ history, addToHistory, removeFromHistory }}>
      {children}
    </ImageHistoryContext.Provider>
  );
}

export const useImageHistory = () => useContext(ImageHistoryContext);
