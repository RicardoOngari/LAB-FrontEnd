import { Link, useLocation } from 'react-router-dom';
import { categoriasVeiculos } from '../dados';

const icons = {
  'Moto': '🏍️', 'Carro': '🚗', 'Caminhonete': '🛻',
  'SUV': '🚙', 'Esportivo': '🏎️', 'Ônibus': '🚌',
  'Van': '🚐', 'Ambulância': '🚑', 'Trator': '🚜', 'Caminhão': '🚚'
};

export function Navbar({ noc, tempo, autoSwap, onToggleAutoSwap, apiOnline, totalAlertas }) {
  const location = useLocation();
  const mapsUrl = noc?.latitude && noc?.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${noc.latitude},${noc.longitude}`
    : 'https://www.google.com/maps/search/?api=1&query=SENAI+SP+VILA+LEOPOLDINA';

  return (
    <nav className="navbar navbar-dark noc-navbar sticky-top">
      <div className="container-fluid px-3 px-lg-4 py-2">
        <div className="nav-shell">
          <div className="brand-line">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" title="Abrir Base NOC (SENAI Vila Leopoldina)" className="brand-link">
              <span className="globo" aria-label="Globo do NOC" />
            </a>
            <Link to="/dashboard" className="brand-name">NOC COMMAND CENTER <span>PRO</span></Link>
            <span className={`api-status ${apiOnline ? 'ok' : 'down'}`}><i /> API {apiOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          <div className="nav-meta">
            <span className="alert-counter">⚠ {totalAlertas} alertas</span>
            <button type="button" className={`swap-toggle ${autoSwap ? 'active' : ''}`} onClick={onToggleAutoSwap}>
              {autoSwap ? '⏸ AUTO-SWAP' : '▶ AUTO-SWAP'} <b>00:0{tempo}</b>
            </button>
          </div>
        </div>

        <div className="nav-scroll w-100 mt-2">
          <Link to="/dashboard" className={`nav-btn ${location.pathname === '/dashboard' ? 'active-main' : ''}`}>📊 Dashboard</Link>
          <Link to="/links" className={`nav-btn ${location.pathname === '/links' ? 'active-main' : ''}`}>📡 Links Comunicação</Link>
          
          {categoriasVeiculos.map((categoria) => (
            <Link
              key={categoria}
              to={`/frota/${encodeURIComponent(categoria)}`}
              className={`nav-btn ${decodeURIComponent(location.pathname) === `/frota/${categoria}` ? 'active-fleet' : ''}`}
            >
              {icons[categoria] || '🚛'} {categoria}
            </Link>
          ))}
          <Link to="/banco-dados" className={`nav-btn ${location.pathname === '/banco-dados' ? 'active-main' : ''}`}>🗄️ Banco de Dados (CRUD)</Link>
        </div>
      </div>
    </nav>
  );
}
