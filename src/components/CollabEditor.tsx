import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Profile } from "@/lib/useAuth";
import { cursorCss, fontCss } from "@/lib/personalization";

function toBase64(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function fromBase64(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Character-level diff of the previous and next textarea value. */
function applyDiff(ytext: Y.Text, prev: string, next: string) {
  if (prev === next) return;
  let start = 0;
  const max = Math.min(prev.length, next.length);
  while (start < max && prev[start] === next[start]) start++;
  let endPrev = prev.length;
  let endNext = next.length;
  while (endPrev > start && endNext > start && prev[endPrev - 1] === next[endNext - 1]) {
    endPrev--;
    endNext--;
  }
  if (endPrev > start) ytext.delete(start, endPrev - start);
  if (endNext > start) ytext.insert(start, next.slice(start, endNext));
}

export interface RemoteCaret {
  user_id: string;
  display_name: string;
  accent_color: string;
  index: number;
  at: number;
}

export function CollabEditor({
  docId,
  profile,
  onStatus,
  onRemoteCarets,
}: {
  docId: string;
  profile: Profile;
  onStatus?: (s: "connecting" | "live" | "offline") => void;
  onRemoteCarets?: (n: number) => void;
}) {
  const [text, setText] = useState("");
  const [ready, setReady] = useState(false);
  const [carets, setCarets] = useState<Record<string, RemoteCaret>>({});
  const [saving, setSaving] = useState(false);

  const ydocRef = useRef<Y.Doc | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const localValue = useRef("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const font = fontCss(profile.editor_font);

  // Persist the full CRDT state (debounced) so refreshes and reconnects recover.
  const persist = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const ydoc = ydocRef.current;
      if (!ydoc) return;
      setSaving(true);
      const state = toBase64(Y.encodeStateAsUpdate(ydoc));
      await supabase
        .from("documents")
        .update({
          ydoc_state: state,
          plain_text: ydoc.getText("content").toString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", docId);
      setSaving(false);
    }, 700);
  }, [docId]);

  useEffect(() => {
    let cancelled = false;
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const ytext = ydoc.getText("content");
    onStatus?.("connecting");

    ytext.observe(() => {
      const v = ytext.toString();
      localValue.current = v;
      setText(v);
    });

    ydoc.on("update", (update: Uint8Array, origin: unknown) => {
      if (origin !== "remote") {
        channelRef.current?.send({
          type: "broadcast",
          event: "y-update",
          payload: { u: toBase64(update) },
        });
        persist();
      }
    });

    const channel = supabase.channel(`doc-${docId}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "y-update" }, ({ payload }) => {
        Y.applyUpdate(ydoc, fromBase64(payload.u as string), "remote");
      })
      .on("broadcast", { event: "sync-request" }, () => {
        channel.send({
          type: "broadcast",
          event: "y-update",
          payload: { u: toBase64(Y.encodeStateAsUpdate(ydoc)) },
        });
      })
      .on("broadcast", { event: "caret" }, ({ payload }) => {
        const c = payload as RemoteCaret;
        if (c.user_id === profile.id) return;
        setCarets((prev) => ({ ...prev, [c.user_id]: { ...c, at: Date.now() } }));
      })
      .on("broadcast", { event: "left" }, ({ payload }) => {
        setCarets((prev) => {
          const next = { ...prev };
          delete next[(payload as { user_id: string }).user_id];
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          onStatus?.("live");
          channel.send({ type: "broadcast", event: "sync-request", payload: {} });
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          onStatus?.("offline");
        }
      });

    // Load persisted state from the database.
    void (async () => {
      const { data } = await supabase
        .from("documents")
        .select("ydoc_state")
        .eq("id", docId)
        .maybeSingle();
      if (cancelled) return;
      if (data?.ydoc_state) Y.applyUpdate(ydoc, fromBase64(data.ydoc_state), "remote");
      setReady(true);
    })();

    return () => {
      cancelled = true;
      channel.send({ type: "broadcast", event: "left", payload: { user_id: profile.id } });
      void supabase.removeChannel(channel);
      ydoc.destroy();
      ydocRef.current = null;
      channelRef.current = null;
    };
  }, [docId, profile.id, persist, onStatus]);

  // Expire stale carets.
  useEffect(() => {
    const t = setInterval(() => {
      setCarets((prev) => {
        const now = Date.now();
        const next: Record<string, RemoteCaret> = {};
        for (const [k, v] of Object.entries(prev)) if (now - v.at < 15000) next[k] = v;
        return next;
      });
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const remoteList = useMemo(() => Object.values(carets), [carets]);
  useEffect(() => onRemoteCarets?.(remoteList.length), [remoteList.length, onRemoteCarets]);

  function broadcastCaret() {
    const el = textareaRef.current;
    if (!el) return;
    channelRef.current?.send({
      type: "broadcast",
      event: "caret",
      payload: {
        user_id: profile.id,
        display_name: profile.display_name,
        accent_color: profile.accent_color,
        index: el.selectionStart,
        at: Date.now(),
      },
    });
  }

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const ydoc = ydocRef.current;
    if (!ydoc) return;
    const next = e.target.value;
    const ytext = ydoc.getText("content");
    ydoc.transact(() => applyDiff(ytext, localValue.current, next));
    broadcastCaret();
  }

  // Measure a caret position using a mirror element with identical typography.
  function caretPoint(index: number) {
    const mirror = mirrorRef.current;
    const ta = textareaRef.current;
    if (!mirror || !ta) return null;
    mirror.textContent = text.slice(0, Math.min(index, text.length));
    const marker = document.createElement("span");
    marker.textContent = "\u200b";
    mirror.appendChild(marker);
    const point = { left: marker.offsetLeft, top: marker.offsetTop - ta.scrollTop };
    mirror.removeChild(marker);
    return point;
  }

  const caretShape =
    profile.caret_style === "block"
      ? { width: "0.55em", height: "1.4em", opacity: 0.45 }
      : profile.caret_style === "underline"
        ? { width: "0.55em", height: "2px", marginTop: "1.25em" }
        : { width: "2px", height: "1.4em" };

  return (
    <div className="relative">
      <div
        className="panel relative overflow-hidden"
        style={{ cursor: cursorCss(profile.cursor_style) }}
      >
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={onChange}
            onKeyUp={broadcastCaret}
            onClick={broadcastCaret}
            onSelect={broadcastCaret}
            spellCheck={false}
            placeholder={ready ? "Start typing — everyone sees it instantly…" : "Loading document…"}
            className="relative z-10 min-h-[55vh] w-full resize-none bg-transparent p-5 text-[15px] leading-7 outline-none placeholder:text-muted-foreground sm:min-h-[60vh] sm:p-7 sm:text-base"
            style={{
              fontFamily: font,
              caretColor: profile.accent_color,
              cursor: cursorCss(profile.cursor_style),
            }}
          />

          {/* Mirror used only for caret measurement — visually hidden. */}
          <div
            ref={mirrorRef}
            aria-hidden
            className="pointer-events-none invisible absolute left-0 top-0 w-full whitespace-pre-wrap break-words p-5 text-[15px] leading-7 sm:p-7 sm:text-base"
            style={{ fontFamily: font }}
          />

          {/* Remote collaborator carets */}
          <div className="pointer-events-none absolute inset-0 z-20">
            {remoteList.map((c) => {
              const p = caretPoint(c.index);
              if (!p) return null;
              return (
                <div
                  key={c.user_id}
                  className="absolute transition-all duration-100"
                  style={{ left: p.left, top: p.top }}
                >
                  <div
                    className="caret-blink rounded-sm"
                    style={{ width: 2, height: "1.4em", background: c.accent_color }}
                  />
                  <span
                    className="absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold text-black"
                    style={{ background: c.accent_color }}
                  >
                    {c.display_name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 font-mono text-[11px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <span
            className="caret-blink inline-block rounded-[1px] align-middle"
            style={{ ...caretShape, background: profile.accent_color }}
          />
          your caret · {profile.caret_style}
        </span>
        <span>
          {text.length} chars · {saving ? "saving…" : "saved"}
        </span>
      </div>
    </div>
  );
}
