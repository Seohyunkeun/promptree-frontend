// client/src/components/HoloCard.jsx
export default function HoloCard({ className = "", header, footer, children }) {
  return (
    <section className={`holo-card ${className}`}>
      {header ? <div className="px-4 py-3 border-b border-white/10 mono text-zinc-300">{header}</div> : null}
      <div className="card-body">{children}</div>
      {footer ? <div className="px-4 py-3 border-t border-white/10">{footer}</div> : null}
    </section>
  );
}
