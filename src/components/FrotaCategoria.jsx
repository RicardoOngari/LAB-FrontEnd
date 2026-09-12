import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { dependencias } from '../dados';

function mapsUrl(vehicle) {
  return `https://www.google.com/maps/search/?api=1&query=${vehicle.latitude},${vehicle.longitude}`;
}

function formatSync(value) {
  if (!value) return '--:--:--';
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString('pt-BR');
}

export function FrotaCategoria({ frota, statusLinks, onTelemetry }) {
  const { categoria } = useParams();
  const [enviando, setEnviando] = useState(null);
  const [erro, setErro] = useState('');
  const dependency = dependencias[categoria] || dependencias.default;
  const linkOnline = !!statusLinks[dependency.id];
  const vehicles = useMemo(() => frota.filter((vehicle) => vehicle.tipo === categoria), [frota, categoria]);

  const simulateTelemetry = async (vehicle) => {
    setErro('');
    setEnviando(vehicle.id);
    const latitude = Number(vehicle.latitude) + (Math.random() - 0.5) * 0.08;
    const longitude = Number(vehicle.longitude) + (Math.random() - 0.5) * 0.08;
    const vel = Math.max(0, Math.round(Number(vehicle.vel) + (Math.random() - 0.5) * 20));

    try {
      await api.updateFrota(vehicle.id, {
        latitude: latitude.toFixed(4),
        longitude: longitude.toFixed(4),
        vel: String(vel)
      });
      await onTelemetry();
    } catch (error) {
      setErro('Não foi possível enviar a telemetria. Verifique se a API está ligada.');
    } finally {
      setEnviando(null);
    }
  };

  return (
    <main className="page-container">
      <div className="page-heading">
        <div><span className="eyebrow">FROTA / TELEMETRIA TÁTICA</span><h1>{categoria}</h1><p>Dependência: <b>{dependency.nome}</b> · posição e velocidade sincronizadas pelo SQLite.</p></div>
        <span className={`status-pill ${linkOnline ? 'success' : 'danger'} large`}>{linkOnline ? 'COMUNICAÇÃO OK' : `COMUNICAÇÃO PERDIDA · ${dependency.nome}`}</span>
      </div>

      {categoria === 'Ambulância' && (
        <div className="audio-note">🔊 <b>Web Audio API:</b> a sirene alternada é ativada quando a Ambulância perde a comunicação pelo OSPF. Clique em qualquer ponto da página uma vez para liberar o áudio do navegador.</div>
      )}
      {erro && <div className="critical-banner">{erro}</div>}

      <div className="row g-3 g-xl-4">
        {vehicles.map((vehicle, index) => {
          const online = linkOnline;
          const fuel = Math.max(25, 100 - index * 15);
          const url = mapsUrl(vehicle);
          const duration = Math.max(2.8, Math.min(8, 9 - Number(vehicle.vel || 0) / 25));

          return (
            <div className="col-12 col-md-6 col-xl-4" key={vehicle.id}>
              <article className={`panel-card fleet-card ${online ? '' : 'is-offline'}`}>
                <div className={`vehicle-scene ${online ? '' : 'offline'}`}>
                  <div className="sky-grid" />
                  <div className="mountains" />
                  <div className="road"><div className="road-lines" /></div>
                  {online && <div className="wind"><span /><span /><span /></div>}
                  <a
                    href={online ? url : '#'}
                    onClick={(event) => { if (!online) event.preventDefault(); }}
                    target={online ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    title={online ? 'Rastrear no Google Maps' : 'Veículo offline'}
                    className={`vehicle ${online ? '' : 'disabled'}`}
                    style={{ '--drive-duration': `${duration}s` }}
                  ><span className="vehicle-icon">{vehicle.modelo}</span></a>
                  <div className="scene-label">{vehicle.id} · {vehicle.tipo}</div>
                </div>

                <div className="card-body fleet-body">
                  <div className="link-top"><div><div className="vehicle-id">{vehicle.id}</div><div className="small-label">{vehicle.tipo}</div></div><span className={`status-pill ${online ? 'success' : 'danger'}`}>{online ? 'SINAL OK' : 'LINK PERDIDO'}</span></div>

                  <div className="fuel-block"><div className="traffic-line"><span>BATERIA / COMBUSTÍVEL</span><b>{fuel}%</b></div><div className="progress-tech"><div className={fuel < 30 ? 'traffic-danger' : 'traffic-info'} style={{ width: `${fuel}%` }} /></div></div>

                  <div className="vehicle-metrics">
                    <div><span>VELOCIDADE</span><strong>{online ? `${vehicle.vel} km/h` : '0 km/h'}</strong></div>
                    <div><span>SYNC SQL</span><strong>{online ? formatSync(vehicle.ultima_atualizacao) : '--:--:--'}</strong></div>
                  </div>

                  <div className="gps-row">
                    <div><span>POSIÇÃO SQL</span><a href={online ? url : '#'} onClick={(event) => { if (!online) event.preventDefault(); }} target={online ? '_blank' : undefined} rel="noopener noreferrer">{online ? `${vehicle.latitude}, ${vehicle.longitude}` : 'OFFLINE'}</a></div>
                    <button type="button" disabled={!online || enviando === vehicle.id} className="btn btn-sm btn-outline-info" onClick={() => simulateTelemetry(vehicle)}>{enviando === vehicle.id ? 'Enviando…' : '↻ Simular telemetria'}</button>
                  </div>
                </div>
              </article>
            </div>
          );
        })}
      </div>

      {vehicles.length === 0 && <div className="panel-card empty-state mt-3">Nenhum veículo encontrado para esta categoria.</div>}
    </main>
  );
}
