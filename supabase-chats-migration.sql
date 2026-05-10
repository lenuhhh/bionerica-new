-- ==================== CONVERSATIONS & MESSAGES ====================

-- Conversations table (чаты)
CREATE TABLE IF NOT EXISTS public.conversations (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_email text,
  guest_name text,
  subject text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  conversation_id bigint NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'guest', 'admin', 'ai')),
  sender_name text,
  content text NOT NULL,
  is_ai_response boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- ==================== RLS POLICIES ====================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Safe rerun: drop existing policies before creating them again
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Guests can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Guests can view own conversations by token" ON public.conversations;
DROP POLICY IF EXISTS "Admins can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
DROP POLICY IF EXISTS "Guests can view messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;

-- Conversations: Users can see only their own conversations
CREATE POLICY "Users can view own conversations" 
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Conversations: Admins can see all
CREATE POLICY "Admins can view all conversations"
  ON public.conversations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Conversations: Users can create
CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Conversations: Guests can create (no auth needed, guest_email required)
CREATE POLICY "Guests can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (guest_email IS NOT NULL);

-- Conversations: Guests can view their own conversation immediately after insert
-- (needed so createConversation().select() works for anon users)
CREATE POLICY "Guests can view own conversations by token"
  ON public.conversations FOR SELECT
  USING (auth.uid() IS NULL AND guest_email IS NOT NULL);

-- Conversations: Admins can update
CREATE POLICY "Admins can update conversations"
  ON public.conversations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Messages: Users can see messages from their conversations
CREATE POLICY "Users can view messages"
  ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Messages: Guests (unauthenticated) can view messages in guest conversations
CREATE POLICY "Guests can view messages"
  ON public.messages FOR SELECT
  USING (
    auth.uid() IS NULL AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.guest_email IS NOT NULL
    )
  );

-- Messages: Anyone can insert messages
CREATE POLICY "Users can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    (sender_type = 'user' AND sender_id = auth.uid()) OR
    (sender_type = 'guest') OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================== INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_guest_email ON public.conversations(guest_email);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
