import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { categoriasVeiculos } from '../dados';

const modelos = {
  Ônibus: '🚌', Caminhão: '🚚', Moto: '🏍️', Carro: '🚗', Caminhonete: '🛻',
  Van: '🚐', SUV: '🚙', Esportivo: '🏎️', Trator: '🚜', Ambulância: '🚑'
};

const vazio = {
  id: '',
  modelo: '🚛',
  tipo: 'Caminhão',
  vel: '0',
  latitude: '-23.5500',
  longitude: '-46.6333'
};

function FormField({ label, ...props }) {
  return (
    <label className="crud-field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

export function BancoDadosCRUD({ addEvent }) {
  const [veiculos, setVeiculos] = useState([]);
  const [totalBanco, setTotalBanco] = useState(0);
  const [form, setForm] = useState(vazio);
  const [edicao, setEdicao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('');
  const [logs, setLogs] = useState([]);
  const terminalRef = useRef(null);

  const pushLog = useCallback((level, message) => {
    const time = new Date().toLocaleTimeString('pt-BR');
    setLogs((prev) => [...prev.slice(-79), { id: `${Date.now()}-${Math.random()}`, time, level, message }]);
    addEvent?.(level === 'ERROR' ? 'critical' : level === 'WARN' ? 'warning' : 'info', message, 'CRUD');
  }, [addEvent]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const [lista, dados] = await Promise.all([api.getFrota(), api.getDados()]);
      setVeiculos(Array.isArray(lista) ? lista : []);
      setTotalBanco(Number(dados?.frotaTotal || 0));
      pushLog('INFO', `SELECT executado: ${lista?.length || 0} veículos retornados pela API.`);
    } catch (error) {
      const detalhe = error?.message || 'Falha ao consultar a API.';
      setErro(detalhe);
      pushLog('ERROR', `Falha no SELECT /api/frota: ${detalhe}`);
    } finally {
      setLoading(false);
    }
  }, [pushLog]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [logs]);

  const filtrados = useMemo(() => {
    const termo = filtro.trim().toLowerCase();
    if (!termo) return veiculos;
    return veiculos.filter((item) => `${item.id} ${item.tipo} ${item.modelo}`.toLowerCase().includes(termo));
  }, [veiculos, filtro]);

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'tipo' ? { modelo: modelos[value] || '🚛' } : {})
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setMensagem('');
    setErro('');
    try {
      const created = await api.createFrota({ ...form });
      setVeiculos((prev) => [created, ...prev].slice(0, 500));
      setTotalBanco((prev) => prev + 1);
      setMensagem(`Veículo ${created.id} criado com sucesso.`);
      pushLog('INFO', `INSERT INTO frota: ${created.id} (${created.tipo}).`);
      setForm(vazio);
    } catch (error) {
      const detalhe = error?.message || 'Falha ao criar veículo.';
      setErro(detalhe);
      pushLog('ERROR', `INSERT falhou: ${detalhe}`);
    } finally {
      setSaving(false);
    }
  }

  function iniciarEdicao(veiculo) {
    setEdicao({ ...veiculo });
    setMensagem('');
    setErro('');
    pushLog('INFO', `PUT preparado para ${veiculo.id}.`);
  }

  async function salvarEdicao() {
    if (!edicao) return;
    setSaving(true);
    setMensagem('');
    setErro('');
    try {
      await api.updateFrota(edicao.id, {
        vel: edicao.vel,
        latitude: edicao.latitude,
        longitude: edicao.longitude
      });
      setVeiculos((prev) => prev.map((item) => item.id === edicao.id ? { ...item, ...edicao } : item));
      setMensagem(`Telemetria de ${edicao.id} atualizada.`);
      pushLog('INFO', `UPDATE frota: ${edicao.id} → ${edicao.latitude}, ${edicao.longitude} · ${edicao.vel} km/h.`);
      setEdicao(null);
    } catch (error) {
      const detalhe = error?.message || 'Falha ao atualizar veículo.';
      setErro(detalhe);
      pushLog('ERROR', `UPDATE falhou para ${edicao.id}: ${detalhe}`);
    } finally {
      setSaving(false);
    }
  }

  async function removerVeiculo(id) {
    const confirmar = window.confirm(`Excluir o veículo ${id} do banco de dados?`);
    if (!confirmar) return;

    setSaving(true);
    setMensagem('');
    setErro('');
    try {
      await api.deleteFrota(id);
      setVeiculos((prev) => prev.filter((item) => item.id !== id));
      setTotalBanco((prev) => Math.max(0, prev - 1));
      if (edicao?.id === id) setEdicao(null);
      setMensagem(`Veículo ${id} excluído.`);
      pushLog('WARN', `DELETE FROM frota: ${id}.`);
    } catch (error) {
      const detalhe = error?.message || 'Falha ao excluir veículo.';
      setErro(detalhe);
      pushLog('ERROR', `DELETE falhou para ${id}: ${detalhe}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page-container crud-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ADMINISTRAÇÃO · SQL / REST</span>
          <h1>Banco de Dados <strong>(CRUD)</strong></h1>
          <p>Operações POST, GET, PUT e DELETE sobre a frota do NOC.</p>
        </div>
        <div className="heading-stat">
          <strong>{totalBanco.toLocaleString('pt-BR')}</strong>
          <span>registros no SQLite</span>
        </div>
      </div>

      {(mensagem || erro) && (
        <div className={`crud-feedback ${erro ? 'error' : 'success'}`}>
          <span>{erro || mensagem}</span>
          <button type="button" onClick={() => { setMensagem(''); setErro(''); }}>×</button>
        </div>
      )}

      <div className="crud-layout">
        <section className="panel-card crud-create-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">POST /api/frota</span>
              <h2>Novo veículo</h2>
            </div>
            <span className="status-pill success">INSERT</span>
          </div>

          <form className="crud-form" onSubmit={handleCreate}>
            <FormField label="ID" name="id" value={form.id} onChange={handleFormChange} placeholder="V-100001" required />
            <label className="crud-field">
              <span>Categoria</span>
              <select name="tipo" value={form.tipo} onChange={handleFormChange}>
                {categoriasVeiculos.map((categoria) => <option key={categoria}>{categoria}</option>)}
              </select>
            </label>
            <FormField label="Modelo / ícone" name="modelo" value={form.modelo} onChange={handleFormChange} required />
            <FormField label="Velocidade (km/h)" name="vel" type="number" min="0" max="300" value={form.vel} onChange={handleFormChange} required />
            <div className="crud-grid-2">
              <FormField label="Latitude" name="latitude" value={form.latitude} onChange={handleFormChange} required />
              <FormField label="Longitude" name="longitude" value={form.longitude} onChange={handleFormChange} required />
            </div>
            <button className="crud-primary-btn" type="submit" disabled={saving}>
              {saving ? 'Executando SQL…' : '＋ Cadastrar veículo'}
            </button>
          </form>

          <div className="crud-help">
            <b>CREATE</b>
            <span>O formulário dispara um <code>POST</code> e registra o evento no SQLite.</span>
          </div>
        </section>

        <section className="panel-card crud-list-panel">
          <div className="panel-header crud-list-header">
            <div>
              <span className="eyebrow">GET /api/frota</span>
              <h2>Lista de veículos</h2>
            </div>
            <div className="crud-header-actions">
              <span className="status-pill success">AMOSTRA 500</span>
              <button type="button" className="crud-refresh-btn" onClick={carregar} disabled={loading}>↻ Atualizar</button>
            </div>
          </div>

          <div className="crud-toolbar">
            <input value={filtro} onChange={(event) => setFiltro(event.target.value)} placeholder="Pesquisar ID, categoria ou modelo…" />
            <span>{filtrados.length} exibidos · {totalBanco.toLocaleString('pt-BR')} no banco</span>
          </div>

          <div className="crud-table-wrap">
            <table className="crud-table">
              <thead>
                <tr><th>ID</th><th>Tipo</th><th>Vel.</th><th>Latitude</th><th>Longitude</th><th>Última atualização</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="crud-empty">Consultando SQLite…</td></tr>
                ) : filtrados.length === 0 ? (
                  <tr><td colSpan="7" className="crud-empty">Nenhum veículo encontrado.</td></tr>
                ) : filtrados.map((veiculo) => (
                  <tr key={veiculo.id}>
                    {edicao?.id === veiculo.id ? (
                      <>
                        <td><b className="crud-id">{veiculo.id}</b></td>
                        <td><span className="crud-type">{veiculo.modelo} {veiculo.tipo}</span></td>
                        <td><input className="crud-mini-input" type="number" min="0" max="300" value={edicao.vel} onChange={(e) => setEdicao({ ...edicao, vel: e.target.value })} /></td>
                        <td><input className="crud-mini-input" value={edicao.latitude} onChange={(e) => setEdicao({ ...edicao, latitude: e.target.value })} /></td>
                        <td><input className="crud-mini-input" value={edicao.longitude} onChange={(e) => setEdicao({ ...edicao, longitude: e.target.value })} /></td>
                        <td className="crud-date">agora</td>
                        <td>
                          <div className="crud-actions">
                            <button type="button" className="crud-action save" onClick={salvarEdicao} disabled={saving}>Salvar</button>
                            <button type="button" className="crud-action cancel" onClick={() => setEdicao(null)}>Cancelar</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td><b className="crud-id">{veiculo.id}</b></td>
                        <td><span className="crud-type">{veiculo.modelo} {veiculo.tipo}</span></td>
                        <td>{veiculo.vel} <small>km/h</small></td>
                        <td className="crud-mono">{veiculo.latitude}</td>
                        <td className="crud-mono">{veiculo.longitude}</td>
                        <td className="crud-date">{veiculo.ultima_atualizacao || '—'}</td>
                        <td>
                          <div className="crud-actions">
                            <button type="button" className="crud-action edit" onClick={() => iniciarEdicao(veiculo)}>PUT</button>
                            <button type="button" className="crud-action delete" onClick={() => removerVeiculo(veiculo.id)} disabled={saving}>DELETE</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="panel-card crud-terminal-panel">
          <div className="crud-terminal-topbar">
            <div className="terminal-dots"><i /><i /><i /></div>
            <div className="terminal-title">NODE.JS · CRUD LOGGER</div>
            <span className="terminal-status"><i /> LIVE</span>
          </div>
          <div className="crud-terminal-body" ref={terminalRef}>
            <div className="terminal-line dim">NOC CRUD Console v4.0</div>
            <div className="terminal-line dim">API: http://localhost:3000</div>
            <div className="terminal-line dim">DATABASE: SQLite / frota</div>
            <div className="terminal-separator" />
            {logs.length === 0 ? (
              <div className="terminal-line dim">Aguardando eventos…</div>
            ) : logs.map((log) => (
              <div className={`terminal-line ${log.level.toLowerCase()}`} key={log.id}>
                <span>[{log.time}]</span> <b>{log.level}</b> {log.message}
              </div>
            ))}
          </div>
          <div className="crud-terminal-footer">
            <span>● sqlite3</span>
            <span>{logs.length} eventos</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
