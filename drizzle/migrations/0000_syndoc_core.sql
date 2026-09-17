CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT 'Anonymous',
  avatar_seed text NOT NULL DEFAULT 'syndoc',
  accent_color text NOT NULL DEFAULT '#ff3b3b',
  cursor_style text NOT NULL DEFAULT 'arrow',
  caret_style text NOT NULL DEFAULT 'bar',
  editor_font text NOT NULL DEFAULT 'sans',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles readable by signed-in users" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled document',
  owner_id uuid NOT NULL,
  ydoc_state text,
  plain_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documents readable by signed-in users" ON public.documents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in users create documents" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Signed-in users edit documents" ON public.documents
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Owners delete documents" ON public.documents
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;