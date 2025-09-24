-- Enable RLS on tickets table
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can insert their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view accessible tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update accessible tickets" ON public.tickets;

-- Create simple, working policies
CREATE POLICY "Enable read access for users based on user_id" ON public.tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users only" ON public.tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON public.tickets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON public.tickets
    FOR DELETE USING (auth.uid() = user_id);

-- Test the connection by creating a simple function
CREATE OR REPLACE FUNCTION public.test_user_access()
RETURNS TABLE(user_id uuid, email text, ticket_count bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    auth.uid() as user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as email,
    (SELECT count(*) FROM public.tickets WHERE user_id = auth.uid()) as ticket_count;
$$;
