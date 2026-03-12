import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook that saves processed images to the database history.
 * Stores base64 data URLs directly (original + processed) so they can be
 * re-downloaded from the History page.
 */
export function useSaveHistory() {
  const { user } = useAuth();

  const saveToHistory = useCallback(
    async (
      originalImageUrl: string | null,
      processedImageUrl: string | null,
      operations: string[]
    ) => {
      if (!user) return;

      try {
        await supabase.from('image_history').insert({
          user_id: user.id,
          original_image_url: originalImageUrl,
          processed_image_url: processedImageUrl,
          operations_applied: operations,
        });

        // Increment images_processed count
        const { data: profile } = await supabase
          .from('profiles')
          .select('images_processed')
          .eq('id', user.id)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ images_processed: (profile.images_processed ?? 0) + 1 })
            .eq('id', user.id);
        }
      } catch (err) {
        console.error('Failed to save history:', err);
      }
    },
    [user]
  );

  return { saveToHistory };
}
