-- Promote a user to admin role
-- Replace 'user@example.com' with the actual email address of the user you want to promote

-- First, find the user ID (replace the email)
SELECT id, email FROM auth.users WHERE email = 'user@example.com';

-- Then, insert or update the user role (replace the user_id with the actual ID from above)
INSERT INTO public.user_roles (user_id, role) 
VALUES ('your-user-id-here', 'admin')
ON CONFLICT (user_id, role) 
DO UPDATE SET role = 'admin';

-- Alternative: If you want to update an existing user role
-- UPDATE public.user_roles 
-- SET role = 'admin' 
-- WHERE user_id = 'your-user-id-here';

-- To promote the first user in the system to admin (useful for initial setup):
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin' FROM auth.users 
-- ORDER BY created_at ASC 
-- LIMIT 1
-- ON CONFLICT (user_id, role) DO NOTHING;
