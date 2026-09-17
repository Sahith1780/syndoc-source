import { avatarUrl, initials } from "@/lib/personalization";
import type { Peer } from "@/lib/usePresence";

export function UserChip({
  name,
  seed,
  color,
  size = 32,
}: {
  name: string;
  seed: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      title={name}
      className="inline-grid shrink-0 place-items-center overflow-hidden rounded-full border-2 bg-surface text-[10px] font-bold"
      style={{ width: size, height: size, borderColor: color }}
    >
      <img
        src={avatarUrl(seed, color)}
        alt={name}
        width={size}
        height={size}
        className="h-full w-full object-cover"
        onError={(e) => ((e.currentTarget.style.display = "none"))}
      />
      <span className="sr-only">{initials(name)}</span>
    </span>
  );
}

export function PresenceStack({ peers, label = "online" }: { peers: Peer[]; label?: string }) {
  const shown = peers.slice(0, 5);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex -space-x-2">
        {shown.map((p) => (
          <UserChip key={p.user_id} name={p.display_name} seed={p.avatar_seed} color={p.accent_color} />
        ))}
        {peers.length > shown.length && (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-border bg-surface text-[10px] font-bold">
            +{peers.length - shown.length}
          </span>
        )}
      </div>
      <span className="flex shrink-0 items-center gap-1.5 font-mono text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-live" />
        {peers.length} {label}
      </span>
    </div>
  );
}
