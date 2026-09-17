import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useProfile } from "@/lib/useAuth";
import { usePresence } from "@/lib/usePresence";
import { AppShell } from "@/components/AppShell";
import { PresenceStack } from "@/components/PresenceStack";
import { CollabEditor } from "@/components/CollabEditor";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/workspace/$docId")({
  head: () => ({
    meta: [
      { title: "Editing — SynDoc 2.0" },
      { name: "description", content: "Collaborative document editing with live cursors." },
      { property: "og:title", content: "Editing — SynDoc 2.0" },
      { property: "og:description", content: "Collaborative document editing with live cursors." },
    ],
  }),
  component: DocPage,
});

function DocPage() {
  const { docId } = Route.useParams();
  const { user } = useSession();
  const { profile } = useProfile(user);
  const peers = usePresence(`doc-presence-${docId}`, profile);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting");

  useEffect(() => {
    void supabase
      .from("documents")
      .select("title")
      .eq("id", docId)
      .maybeSingle()
      .then(({ data }) => setTitle(data?.title ?? "Untitled document"));
  }, [docId]);

  const handleStatus = useCallback((s: "connecting" | "live" | "offline") => setStatus(s), []);

  async function saveTitle(next: string) {
    setTitle(next);
    await supabase.from("documents").update({ title: next }).eq("id", docId);
  }

  return (
    <AppShell profile={profile} right={<PresenceStack peers={peers} label="here" />}>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Link
          to="/workspace"
          className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> ALL DOCUMENTS
        </Link>

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <Input
            value={title}
            onChange={(e) => void saveTitle(e.target.value)}
            className="min-w-0 border-none bg-transparent px-0 text-xl font-bold shadow-none focus-visible:ring-0 sm:text-2xl"
            placeholder="Untitled document"
          />
          <span className="shrink-0 font-mono text-[11px] uppercase text-muted-foreground">
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
              style={{ background: status === "live" ? "var(--live)" : "var(--muted-foreground)" }}
            />
            {status}
          </span>
        </div>

        <div className="mt-4">
          {profile && <CollabEditor docId={docId} profile={profile} onStatus={handleStatus} />}
        </div>
      </main>
    </AppShell>
  );
}
