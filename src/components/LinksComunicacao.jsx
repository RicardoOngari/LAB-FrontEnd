import { useMemo } from 'react';

function trafficTone(value) {
  if (value >= 85) return 'danger';
  if (value >= 65) return 'warning';
  return 'info';
}

export function LinksComunicacao({ dados, statusLinks, metrics, toggleLink }) {
  const summary = useMemo(() => {
    const online = dados.filter((item) => statusLinks[item.id]).length;
    return { online, total: dados.length, critical: dados.length - online };
  }, [dados, statusLinks]);

  return (
    <main className="page-container">
      <div className="page-heading">
        <div><span className="eyebrow">INFRAESTRUTURA / TELECOM</span><h1>Monitoramento de Conectividade</h1><p>Telemetria dinâmica de links, latência, jitter, perda e utilização.</p></div>
        <div className="heading-stat"><strong>{summary.online}/{summary.total}</strong><span>links operacionais</span></div>
      </div>

      {summary.critical > 0 && <div className="critical-banner">🔴 <b>{summary.critical} link(s) indisponível(is)</b> — ativos dependentes podem perder comunicação.</div>}

      <div className="row g-3 g-xl-4">
        {dados.map((item) => {
          const online = !!statusLinks[item.id];
          const metric = metrics[item.id] || { latency: 0, jitter: 0, loss: 0, traffic: 0, download: 0, upload: 0, uptime: 0 };
          const tone = trafficTone(metric.traffic);

          return (
            <div className="col-12 col-md-6 col-xl-4" key={item.id}>
              <article className={`panel-card link-card signal-flow ${online ? 'is-online' : 'is-offline'}`}>
                <div className="link-top">
                  <div><div className="service-title"><span className={`led ${online ? 'led-online' : 'led-offline'}`} />{item.tipo}</div><div className="small-label">Alvo: {item.target}</div></div>
                  <span className={`status-pill ${online ? 'success' : 'danger'}`}>{online ? 'ONLINE' : 'OFFLINE'}</span>
                </div>

                <div className="metric-grid">
                  <div><span>LATÊNCIA</span><strong className={metric.latency > 500 ? 'text-warning' : ''}>{online ? `${metric.latency} ms` : 'TIMEOUT'}</strong></div>
                  <div><span>JITTER</span><strong>{online ? `${metric.jitter} ms` : '--'}</strong></div>
                  <div><span>PERDA</span><strong>{online ? `${metric.loss}%` : '--'}</strong></div>
                  <div><span>UPTIME</span><strong>{online ? `${metric.uptime}%` : '--'}</strong></div>
                </div>

                <div className="traffic-block">
                  <div className="traffic-line"><span>UTILIZAÇÃO</span><b>{online ? `${metric.traffic}%` : '0%'}</b></div>
                  <div className="progress-tech"><div className={`traffic-${tone}`} style={{ width: `${online ? metric.traffic : 0}%` }} /></div>
                  <div className="traffic-line throughput"><span>↓ {online ? `${metric.download} Mbps` : '0 Mbps'}</span><span>↑ {online ? `${metric.upload} Mbps` : '0 Mbps'}</span></div>
                </div>

                <div className="link-footer"><span>Target: <code>{item.target}</code></span><button type="button" className={`btn btn-sm ${online ? 'btn-outline-danger' : 'btn-success'}`} onClick={() => toggleLink(item.id)}>{online ? '⚠ Simular Queda' : '↻ Restaurar Conexão'}</button></div>
              </article>
            </div>
          );
        })}
      </div>
    </main>
  );
}
