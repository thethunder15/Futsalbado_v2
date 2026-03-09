-- Allow users to insert their own profile
CREATE POLICY "Allow users to insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
