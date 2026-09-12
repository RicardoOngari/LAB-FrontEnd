import { KpiCard } from './KpiCard';
import { EventLog } from './EventLog';
import { dependencias } from '../dados';

function dependencyId(tipo) {
  return (dependencias[tipo] || dependencias.default).id;
}

export function Dashboard({ dados, statusLinks, metrics, events }) {
  const totalLinks = dados.infraestrutura.length;
  const onlineLinks = dados.infraestrutura.filter((item) => statusLinks[item.id]).length;
  const totalFleet = dados.frotaTotal ?? dados.frota.length;
  const sampleFleetTotal = dados.frota.length;
  const offlineLinks = dados.infraestrutura.filter((item) => !statusLinks[item.id]);
  const estimatedOfflineFleet = offlineLinks.length
    ? dados.frota.filter((vehicle) => !statusLinks[dependencyId(vehicle.tipo)]).length
    : 0;
  const fleetOnline = Math.max(0, totalFleet - estimatedOfflineFleet * (totalFleet / Math.max(sampleFleetTotal, 1)));
  const fleetOnlineDisplay = Math.round(fleetOnline);
  const alerts = events.filter((event) => ['critical', 'warning'].includes(event.severidade)).length;
  const availability = totalLinks ? ((onlineLinks / totalLinks) * 100).toFixed(1) : '0.0';
  const onlineInfra = dados.infraestrutura.filter((item) => statusLinks[item.id]);
  const avgLatency = onlineInfra.length
    ? Math.round(onlineInfra.reduce((sum, item) => sum + (metrics[item.id]?.latency || 0), 0) / onlineInfra.length)
    : 0;

  return (
    <main className="page-container">
      <div className="page-heading hero-heading">
        <div>
          <span className="eyebrow">NOC / VISÃO OPERACIONAL</span>
          <h1>Command Center</h1>
          <p>Visão consolidada de conectividade, telemetria, disponibilidade e incidentes.</p>
        </div>
        <div className="live-clock"><span className="live-dot">LIVE</span><strong>{new Date().toLocaleDateString('pt-BR')}</strong></div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3"><KpiCard icon="🚦" label="Links operacionais" value={`${onlineLinks}/${totalLinks}`} detail={`${availability}% disponibilidade`} tone={onlineLinks === totalLinks ? 'success' : 'warning'} /></div>
        <div className="col-12 col-sm-6 col-xl-3"><KpiCard icon="🚗" label="Frota conectada" value={`${fleetOnlineDisplay}/${totalFleet}`} detail={`${totalFleet ? ((fleetOnlineDisplay / totalFleet) * 100).toFixed(0) : 0}% com telemetria`} tone={fleetOnlineDisplay === totalFleet ? 'success' : 'warning'} /></div>
        <div className="col-12 col-sm-6 col-xl-3"><KpiCard icon="📡" label="Latência média" value={`${avgLatency} ms`} detail="medição dinâmica" tone={avgLatency > 300 ? 'warning' : 'success'} /></div>
        <div className="col-12 col-sm-6 col-xl-3"><KpiCard icon="🚨" label="Alertas ativos" value={alerts} detail="eventos recentes" tone={alerts ? 'danger' : 'success'} /></div>
      </div>

      <div className="dashboard-grid">
        <section className="panel-card topology-card">
          <div className="panel-header"><div><span className="eyebrow">DEPENDÊNCIAS</span><h2>Mapa lógico do NOC</h2></div></div>
          <div className="topology">
            <div className="topology-node core"><b>CORE NOC</b><small>SQLite + API REST</small></div>
            <div className="topology-lines"><span /><span /><span /></div>
            <div className="topology-services">
              {dados.infraestrutura.map((link) => (
                <div key={link.id} className={`topology-service ${statusLinks[link.id] ? 'online' : 'offline'}`}>
                  <i /> <b>{link.tipo}</b><small>{statusLinks[link.id] ? `${metrics[link.id]?.latency || 0} ms` : 'OFFLINE'}</small>
                </div>
              ))}
            </div>
          </div>
        </section>
        <EventLog events={events} compact />
      </div>

      <div className="dashboard-note panel-card">
        <span>💡</span>
        <div><b>Falha em cascata / OSPF como fallback</b><p>Carro e Caminhonete dependem do VSAT Principal; Caminhão do BGAN; Ônibus do BGP; Moto do LTE; demais categorias usam o OSPF. Se o link de dependência estiver offline, o ativo também perde comunicação.</p></div>
      </div>
    </main>
  );
}
