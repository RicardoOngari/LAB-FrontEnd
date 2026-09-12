export function KpiCard({ icon, label, value, detail, tone = 'info' }) {
  return (
    <article className={`kpi-card kpi-${tone}`}>
      <div className="kpi-icon">{icon}</div>
      <div>
        <div className="kpi-label">{label}</div>
        <strong className="kpi-value">{value}</strong>
        <div className="kpi-detail">{detail}</div>
      </div>
    </article>
  );
}
