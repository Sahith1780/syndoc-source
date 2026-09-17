import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { randomSeed, ACCENT_COLORS } from "@/lib/personalization";

export interface Profile {
  id: string;
  display_name: string;
  avatar_seed: string;
  accent_color: string;
  cursor_style: string;
  caret_style: string;
  editor_font: string;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export async function ensureProfile(user: User): Promise<Profile> {
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (data) return data as Profile;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fallbackName =
    (typeof meta["full_name"] === "string" ? meta["full_name"] : "") ||
    (typeof meta["name"] === "string" ? meta["name"] : "") ||
    user.email?.split("@")[0] ||
    "Collaborator";

  const seeded: Profile = {
    id: user.id,
    display_name: fallbackName,
    avatar_seed: randomSeed(),
    accent_color:
      ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)] ?? ACCENT_COLORS[0],
    cursor_style: "arrow",
    caret_style: "bar",
    editor_font: "sans",
  };
  const { data: created } = await supabase.from("profiles").insert(seeded).select().single();
  return (created as Profile) ?? seeded;
}

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<Profile | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return setProfile(null);
    setProfile(await ensureProfile(user));
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profile, setProfile, refresh };
}
