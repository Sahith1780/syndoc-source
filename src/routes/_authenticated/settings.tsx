import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useProfile, type Profile } from "@/lib/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ACCENT_COLORS,
  CARET_STYLES,
  CURSOR_STYLES,
  EDITOR_FONTS,
  avatarUrl,
  cursorCss,
  fontCss,
  randomSeed,
} from "@/lib/personalization";
import { Shuffle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Personalization — SynDoc 2.0" },
      { name: "description", content: "Choose your avatar, color, cursor and typing bar style." },
      { property: "og:title", content: "Personalization — SynDoc 2.0" },
      {
        property: "og:description",
        content: "Choose your avatar, color, cursor and typing bar style.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useSession();
  const { profile } = useProfile(user);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(profile), [profile]);

  if (!draft) {
    return <AppShell profile={profile}><main className="p-8 text-sm text-muted-foreground">Loading…</main></AppShell>;
  }

  const set = (patch: Partial<Profile>) => setDraft({ ...draft, ...patch });

  async function save() {
    if (!draft) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: draft.display_name,
        avatar_seed: draft.avatar_seed,
        accent_color: draft.accent_color,
        cursor_style: draft.cursor_style,
        caret_style: draft.caret_style,
        editor_font: draft.editor_font,
        updated_at: new Date().toISOString(),
      })
      .eq("id", draft.id);
    setSaving(false);
    if (error) toast.error("Could not save");
    else toast.success("Personalization saved");
  }

  const caretPreview =
    draft.caret_style === "block"
      ? { width: "0.6em", height: "1.4em", opacity: 0.45 }
      : draft.caret_style === "underline"
        ? { width: "0.6em", height: "2px", alignSelf: "flex-end" }
        : { width: "2px", height: "1.4em" };

  return (
    <AppShell profile={profile}>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Personalization</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything here is yours only — other collaborators keep their own setup.
        </p>

        <section className="panel mt-6 p-5">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
            <img
              src={avatarUrl(draft.avatar_seed, draft.accent_color)}
              alt="Your avatar"
              className="h-16 w-16 shrink-0 rounded-full border-2"
              style={{ borderColor: draft.accent_color }}
            />
            <div className="min-w-0">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                value={draft.display_name}
                onChange={(e) => set({ display_name: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => set({ avatar_seed: randomSeed() })}
          >
            <Shuffle className="mr-1 h-3.5 w-3.5" /> New avatar
          </Button>
        </section>

        <section className="panel mt-4 p-5">
          <h2 className="font-semibold">Your color</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => set({ accent_color: c })}
                aria-label={c}
                className="h-9 w-9 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  background: c,
                  borderColor: draft.accent_color === c ? "white" : "transparent",
                }}
              />
            ))}
          </div>
        </section>

        <section className="panel mt-4 p-5">
          <h2 className="font-semibold">Mouse cursor</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {CURSOR_STYLES.map((c) => (
              <button
                key={c.value}
                onClick={() => set({ cursor_style: c.value })}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  draft.cursor_style === c.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent"
                }`}
                style={{ cursor: cursorCss(c.value) }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        <section className="panel mt-4 p-5">
          <h2 className="font-semibold">Typing bar (caret)</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {CARET_STYLES.map((c) => (
              <button
                key={c.value}
                onClick={() => set({ caret_style: c.value })}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  draft.caret_style === c.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div
            className="mt-4 flex items-center gap-1 rounded-lg border border-border bg-background px-4 py-3 text-base"
            style={{ fontFamily: fontCss(draft.editor_font) }}
          >
            <span>The quick brown fox</span>
            <span
              className="caret-blink inline-block rounded-[1px]"
              style={{ ...caretPreview, background: draft.accent_color }}
            />
          </div>
        </section>

        <section className="panel mt-4 p-5">
          <h2 className="font-semibold">Editor font</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {EDITOR_FONTS.map((f) => (
              <button
                key={f.value}
                onClick={() => set({ editor_font: f.value })}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  draft.editor_font === f.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent"
                }`}
                style={{ fontFamily: f.css }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        <Button className="mt-6 w-full sm:w-auto" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save personalization"}
        </Button>
      </main>
    </AppShell>
  );
}
