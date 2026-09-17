import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/useAuth";
import { MousePointer2, Users, Zap, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SynDoc 2.0 — Real-time collaborative editing" },
      {
        name: "description",
        content:
          "SynDoc 2.0 is a conflict-free collaborative document editor with live cursors, presence and per-user personalization.",
      },
      { property: "og:title", content: "SynDoc 2.0 — Real-time collaborative editing" },
      {
        property: "og:description",
        content: "Edit together from any device with live cursors and per-user personalization.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useSession();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <span className="font-mono text-sm font-bold tracking-[0.3em] text-primary">SYNDOC 2.0</span>
        <Button asChild size="sm" variant={user ? "default" : "outline"}>
          <Link to={user ? "/workspace" : "/auth"}>
            {loading ? "…" : user ? "Open workspace" : "Sign in"}
          </Link>
        </Button>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 pb-24 pt-10 sm:pt-20">
        <p className="font-mono text-xs tracking-[0.25em] text-muted-foreground">
          TRACK 3 · FULL STACK ENGINEERING
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
          Write together.
          <span className="block text-primary">Never lose a keystroke.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          A conflict-free collaborative editor: simultaneous multi-user typing, live cursors and
          presence, and a workspace that follows you across every device.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to={user ? "/workspace" : "/auth"}>
              {user ? "Go to your documents" : "Create your account"}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">See live presence</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Zap, title: "CRDT core", body: "Yjs merges concurrent edits — no last-write-wins." },
            { icon: Users, title: "Live presence", body: "See who is in the document and their avatars." },
            { icon: MousePointer2, title: "Your cursor", body: "Pick your pointer, caret shape and color." },
            { icon: ShieldCheck, title: "Recoverable", body: "State persists and resyncs after a reconnect." },
          ].map((f) => (
            <div key={f.title} className="panel p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
