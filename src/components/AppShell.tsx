import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UserChip } from "@/components/PresenceStack";
import type { Profile } from "@/lib/useAuth";
import { LogOut, Settings } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({
  profile,
  children,
  right,
}: {
  profile: Profile | null;
  children: ReactNode;
  right?: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:flex sm:justify-between">
          <Link to="/workspace" className="min-w-0 truncate font-mono text-xs font-bold tracking-[0.3em] text-primary">
            SYNDOC 2.0
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {right}
            <Button asChild size="icon" variant="ghost" aria-label="Personalization">
              <Link to="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="icon" variant="ghost" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
            {profile && (
              <UserChip
                name={profile.display_name}
                seed={profile.avatar_seed}
                color={profile.accent_color}
              />
            )}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
