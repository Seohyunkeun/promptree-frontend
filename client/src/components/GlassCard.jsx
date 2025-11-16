// client/src/components/GlassCard.jsx
export default function GlassCard({ className = "", children, header, footer }) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/10",
        "bg-white/5 backdrop-blur-xl",
        "bg-[linear-gradient(180deg,rgba(255,255,255,.10)_0%,rgba(255,255,255,.04)_100%)]",
        "shadow-[0_10px_30px_-10px_rgba(0,0,0,.5)]",
        className,
      ].join(" ")}
    >
      {header ? (
        <div className="px-4 py-3 border-b border-white/10 text-sm text-zinc-200/80">
          {header}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
      {footer ? (
        <div className="px-4 py-3 border-t border-white/10">{footer}</div>
      ) : null}
    </div>
  );
}
