CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);

CREATE POLICY "Users can delete own history" ON public.image_history FOR DELETE USING (auth.uid() = user_id);