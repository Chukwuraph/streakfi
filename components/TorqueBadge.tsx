import clsx from "clsx";

type Size = "inline" | "card" | "floating";

export function TorqueBadge({
  size = "inline",
  label = "Verified by Torque",
  className,
}: {
  size?: Size;
  label?: string;
  className?: string;
}) {
  if (size === "floating") {
    return (
      <div
        className={clsx(
          "fixed bottom-14 right-4 md:right-6 z-50 pointer-events-none",
          className,
        )}
      >
        <div className="bg-surface-container-highest/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 flex items-center gap-2 shadow-2xl torque-glow">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">
            Powered by Torque
          </span>
          <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
            bolt
          </span>
        </div>
      </div>
    );
  }
  if (size === "card") {
    return (
      <div
        className={clsx(
          "bg-secondary-container text-on-secondary-container px-4 py-2 rounded-xl inline-flex items-center gap-2 font-black text-xs uppercase tracking-[0.2em]",
          className,
        )}
      >
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
          bolt
        </span>
        {label}
      </div>
    );
  }
  return (
    <span
      className={clsx(
        "text-[10px] font-bold text-secondary uppercase tracking-[0.2em] bg-secondary-container/20 px-2 py-1 rounded inline-flex items-center gap-1",
        className,
      )}
    >
      {label} <span aria-hidden>⚡</span>
    </span>
  );
}
