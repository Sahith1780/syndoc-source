import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Profile } from "@/lib/useAuth";

export interface Peer {
  user_id: string;
  display_name: string;
  avatar_seed: string;
  accent_color: string;
  cursor_style: string;
  online_at: string;
}

/** Tracks who is currently connected on a realtime channel. */
export function usePresence(channelName: string, profile: Profile | null) {
  const [peers, setPeers] = useState<Peer[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!profile) return;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: profile.id } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<Peer>();
        const list = Object.values(state)
          .map((entries) => entries[0])
          .filter(Boolean) as Peer[];
        setPeers(list);
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        await channel.track({
          user_id: profile.id,
          display_name: profile.display_name,
          avatar_seed: profile.avatar_seed,
          accent_color: profile.accent_color,
          cursor_style: profile.cursor_style,
          online_at: new Date().toISOString(),
        });
      });

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [
    channelName,
    profile?.id,
    profile?.display_name,
    profile?.avatar_seed,
    profile?.accent_color,
    profile?.cursor_style,
    profile,
  ]);

  return peers;
}
