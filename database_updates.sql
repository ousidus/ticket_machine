-- Add new columns to tickets table for enhanced functionality
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS attachments TEXT[]; -- Array of file URLs
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create user_roles table for role management
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'reviewer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create ticket_comments table for detailed ticket discussions
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Policies for user_roles
CREATE POLICY "Users can view all roles" ON user_roles FOR SELECT USING (true);
CREATE POLICY "Only admins can manage roles" ON user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Policies for ticket_comments
CREATE POLICY "Users can view comments on accessible tickets" ON ticket_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tickets t 
      WHERE t.id = ticket_comments.ticket_id 
      AND (t.user_id = auth.uid() OR t.assigned_to = auth.uid() OR 
           EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('reviewer', 'admin')))
    )
  );

CREATE POLICY "Users can insert comments on accessible tickets" ON ticket_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM tickets t 
      WHERE t.id = ticket_comments.ticket_id 
      AND (t.user_id = auth.uid() OR t.assigned_to = auth.uid() OR 
           EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('reviewer', 'admin')))
    )
  );

-- Update ticket policies for reviewers and admins
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
CREATE POLICY "Users can view accessible tickets" ON tickets
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('reviewer', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can update their own tickets" ON tickets;
CREATE POLICY "Users can update accessible tickets" ON tickets
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('reviewer', 'admin')
    )
  );

-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ticket-attachments', 'ticket-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload ticket attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ticket-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view ticket attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'ticket-attachments');

CREATE POLICY "Users can delete their attachments" ON storage.objects
  FOR DELETE USING (bucket_id = 'ticket-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS tickets_assigned_to_idx ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS tickets_status_idx ON tickets(status);
CREATE INDEX IF NOT EXISTS ticket_comments_ticket_id_idx ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON user_roles(role);
