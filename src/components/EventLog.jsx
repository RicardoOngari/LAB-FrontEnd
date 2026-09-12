export function EventLog({ events = [], compact = false }) {
  const visible = events.slice(0, compact ? 7 : 15);

  return (
    <section className={`panel-card event-panel ${compact ? 'compact' : ''}`}>
      <div className="panel-header">
        <div><span className="eyebrow">NOC / EVENTOS</span><h2>Central de Eventos</h2></div>
        <span className="live-dot">LIVE</span>
      </div>
      <div className="event-list">
        {visible.length === 0 ? (
          <div className="empty-state">Nenhum evento registrado.</div>
        ) : visible.map((event) => (
          <div className="event-row" key={event.id}>
            <span className={`event-severity severity-${event.severidade || 'info'}`} />
            <span className="event-time">{event.hora || event.criado_em || '--:--:--'}</span>
            <span className="event-message">{event.mensagem}</span>
            <span className="event-tag">{event.origem || 'NOC'}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
