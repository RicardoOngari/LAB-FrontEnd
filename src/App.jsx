import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { LinksComunicacao } from './components/LinksComunicacao';
import { FrotaCategoria } from './components/FrotaCategoria';
import { EventLog } from './components/EventLog';
import { BancoDadosCRUD } from './components/BancoDadosCRUD';
import { categoriasVeiculos, fallbackDados } from './dados';
import { api } from './services/api';

const telas = ['/dashboard', '/links', '/banco-dados', ...categoriasVeiculos.map((categoria) => `/frota/${encodeURIComponent(categoria)}`)];

const baseLatency = { 1: 580, 2: 850, 3: 2, 4: 12, 5: 45 };

function makeMetrics(infra) {
  return Object.fromEntries(infra.map((item) => {
    const latency = baseLatency[item.id] || Number.parseInt(item.latencia, 10) || 20;
    return [item.id, {
      latency,
      jitter: Math.max(1, Math.round(latency * 0.05)),
      loss: latency > 500 ? 1.2 : 0.1,
      traffic: Math.min(92, 35 + item.id * 7),
      download: 40 + item.id * 6,
      upload: 10 + item.id * 2,
      uptime: 99.8
    }];
  }));
}

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dados, setDados] = useState({ infraestrutura: [], frota: [], frotaTotal: 0, frotaPorCategoria: [], noc: {} });
  const [statusLinks, setStatusLinks] = useState({ 1: true, 2: true, 3: true, 4: true, 5: true });
  const [metrics, setMetrics] = useState({});
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);
  const [autoSwap, setAutoSwap] = useState(true);
  const [tempo, setTempo] = useState(5);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [pageKey, setPageKey] = useState(0);
  const audioRef = useRef(null);

  const addEvent = useCallback((severidade, mensagem, origem = 'NOC') => {
    setEvents((previous) => [{
      id: `${Date.now()}-${Math.random()}`,
      severidade,
      mensagem,
      origem,
      hora: new Date().toLocaleTimeString('pt-BR')
    }, ...previous].slice(0, 30));
  }, []);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    try {
      const data = await api.getDados();
      setDados(data);
      setMetrics(makeMetrics(data.infraestrutura));
      setApiOnline(true);
      setLoading(false);
      return data;
    } catch (error) {
      setApiOnline(false);
      setDados(fallbackDados);
      setMetrics(makeMetrics(fallbackDados.infraestrutura));
      setLoading(false);
      if (!silent) addEvent('warning', 'API indisponível: modo de demonstração ativado.', 'API');
      return fallbackDados;
    }
  }, [addEvent]);

  const loadEvents = useCallback(async () => {
    try {
      const remote = await api.getEventos();
      if (!Array.isArray(remote)) return;
      const normalized = remote.map((event) => ({
        id: `db-${event.id}`,
        severidade: event.severidade || 'info',
        mensagem: event.mensagem,
        origem: event.origem || 'API',
        hora: event.criado_em || '--:--:--'
      }));
      setEvents((previous) => [...previous, ...normalized].reduce((acc, event) => {
        if (!acc.some((item) => item.id === event.id)) acc.push(event);
        return acc;
      }, []).slice(0, 30));
    } catch (_) {
      // A interface continua funcionando mesmo se o endpoint de eventos estiver indisponível.
    }
  }, []);

  useEffect(() => {
    loadData().then(() => loadEvents());
  }, [loadData, loadEvents]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((previous) => Object.fromEntries(Object.entries(previous).map(([id, metric]) => {
        if (!statusLinks[id]) return [id, { ...metric, latency: 0, jitter: 0, loss: 100, traffic: 0, download: 0, upload: 0 }];
        const factor = 0.92 + Math.random() * 0.16;
        const latency = Math.max(1, Math.round(metric.latency * factor));
        return [id, {
          ...metric,
          latency,
          jitter: Math.max(1, Math.round(latency * (0.035 + Math.random() * 0.045))),
          loss: Number(Math.max(0, metric.loss + (Math.random() - 0.5) * 0.15).toFixed(2)),
          traffic: Math.min(98, Math.max(12, Math.round(metric.traffic + (Math.random() - 0.5) * 8))),
          download: Math.max(1, Math.round(metric.download * (0.92 + Math.random() * 0.16))),
          upload: Math.max(1, Math.round(metric.upload * (0.90 + Math.random() * 0.20))),
          uptime: Number(Math.max(98, Math.min(99.99, metric.uptime + (Math.random() - 0.4) * 0.01)).toFixed(2))
        }];
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, [statusLinks]);

  useEffect(() => {
    if (!autoSwap) return undefined;
    const interval = setInterval(() => {
      setTempo((previous) => {
        if (previous > 1) return previous - 1;
        const current = telas.indexOf(location.pathname);
        const next = telas[(current >= 0 ? current + 1 : 0) % telas.length];
        navigate(next);
        return 5;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoSwap, location.pathname, navigate]);

  useEffect(() => {
    setTempo(5);
    setPageKey((previous) => previous + 1);
  }, [location.pathname]);

  const unlockAudio = useCallback(() => {
    setAudioUnlocked(true);
    try {
      if (!audioRef.current) audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
      if (audioRef.current.state === 'suspended') audioRef.current.resume();
    } catch (_) {
      // Web Audio pode não existir em navegadores muito antigos.
    }
  }, []);

  useEffect(() => {
    const ambulancePath = location.pathname === '/frota/Ambulância';
    const ospfOffline = !statusLinks[3];
    if (!ambulancePath || !audioUnlocked || !ospfOffline) return undefined;

    let oscillator;
    let gain;
    let interval;
    try {
      const ctx = audioRef.current || new (window.AudioContext || window.webkitAudioContext)();
      audioRef.current = ctx;
      oscillator = ctx.createOscillator();
      gain = ctx.createGain();
      gain.gain.value = 0.08;
      oscillator.type = 'sine';
      oscillator.frequency.value = 700;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      let high = false;
      interval = setInterval(() => {
        high = !high;
        oscillator.frequency.setValueAtTime(high ? 960 : 700, ctx.currentTime);
      }, 500);
    } catch (_) {
      return undefined;
    }

    return () => {
      clearInterval(interval);
      try { oscillator.stop(); oscillator.disconnect(); gain.disconnect(); } catch (_) {}
    };
  }, [location.pathname, statusLinks, audioUnlocked]);

  const toggleLink = useCallback((id) => {
    setStatusLinks((previous) => {
      const next = !previous[id];
      const link = dados.infraestrutura.find((item) => item.id === id);
      addEvent(next ? 'info' : 'critical', next ? `${link?.tipo || `Link ${id}`} restaurado.` : `${link?.tipo || `Link ${id}`} ficou OFFLINE.`, 'SIMULAÇÃO');
      return { ...previous, [id]: next };
    });
  }, [addEvent, dados.infraestrutura]);

  const totalAlertas = useMemo(() => events.filter((event) => ['critical', 'warning'].includes(event.severidade)).length, [events]);

  const refreshTelemetry = useCallback(async () => {
    const data = await loadData({ silent: true });
    if (data) addEvent('info', 'Telemetria atualizada pelo endpoint REST/SQLite.', 'TELEMETRIA');
  }, [loadData, addEvent]);

  if (loading) return <div className="loading-screen"><div className="loading-orb" /><h1>Inicializando NOC</h1><p>Consultando SQLite via API REST…</p></div>;

  return (
    <div onClick={unlockAudio}>
      <Navbar noc={dados.noc} tempo={tempo} autoSwap={autoSwap} onToggleAutoSwap={() => setAutoSwap((value) => !value)} apiOnline={apiOnline} totalAlertas={totalAlertas} />
      <div key={pageKey} className="page-transition">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard dados={dados} statusLinks={statusLinks} metrics={metrics} events={events} />} />
          <Route path="/links" element={<LinksComunicacao dados={dados.infraestrutura} statusLinks={statusLinks} metrics={metrics} toggleLink={toggleLink} />} />
          <Route path="/banco-dados" element={<BancoDadosCRUD addEvent={addEvent} />} />
          <Route path="/frota/:categoria" element={<FrotaCategoria frota={dados.frota} statusLinks={statusLinks} onTelemetry={refreshTelemetry} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
      <div className="container-fluid px-3 px-lg-4 pb-2"><EventLog events={events} /></div>
      <footer className="noc-footer">NOC COMMAND CENTER PRO · React + Vite · Express + SQLite · {apiOnline ? 'FULL-STACK ONLINE' : 'DEMO MODE'}</footer>
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppShell /></BrowserRouter>;
}
