import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useProfile } from "@/lib/useAuth";
import { usePresence } from "@/lib/usePresence";
import { AppShell } from "@/components/AppShell";
import { PresenceStack } from "@/components/PresenceStack";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/workspace/")({
  head: () => ({
    meta: [
      { title: "Workspace — SynDoc 2.0" },
      { name: "description", content: "Your live collaborative documents in SynDoc 2.0." },
      { property: "og:title", content: "Workspace — SynDoc 2.0" },
      { property: "og:description", content: "Your live collaborative documents in SynDoc 2.0." },
    ],
  }),
  component: Workspace,
});

interface DocRow {
  id: string;
  title: string;
  plain_text: string;
  updated_at: string;
  owner_id: string;
}

function Workspace() {
  const { user } = useSession();
  const { profile } = useProfile(user);
  const peers = usePresence("syndoc-lobby", profile);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const navigate = useNavigate();

  async function load() {
    const { data } = await supabase
      .from("documents")
      .select("id,title,plain_text,updated_at,owner_id")
      .order("updated_at", { ascending: false });
    setDocs((data as DocRow[]) ?? []);
  }

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("documents-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  async function createDoc() {
    if (!user) return;
    const { data, error } = await supabase
      .from("documents")
      .insert({ title: "Untitled document", owner_id: user.id })
      .select()
      .single();
    if (error || !data) {
      toast.error("Could not create the document");
      return;
    }
    navigate({ to: "/workspace/$docId", params: { docId: data.id } });
  }

  return (
    <AppShell profile={profile} right={<PresenceStack peers={peers} />}>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold sm:text-3xl">Documents</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Open one on any device — edits merge live.
            </p>
          </div>
          <Button onClick={createDoc} className="shrink-0">
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <Link
              key={d.id}
              to="/workspace/$docId"
              params={{ docId: d.id }}
              className="panel group flex flex-col gap-2 p-5 transition-colors hover:border-primary"
            >
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="truncate font-semibold">{d.title}</h2>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {d.plain_text?.slice(0, 120) || "Empty document"}
              </p>
              <span className="mt-1 font-mono text-[11px] text-muted-foreground">
                {new Date(d.updated_at).toLocaleString()}
              </span>
            </Link>
          ))}
          {docs.length === 0 && (
            <div className="panel p-8 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
              No documents yet. Create the first one.
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
