'use client';

import { useState, useEffect } from 'react';
import { Bell, Settings, LogOut, Plus, X, Mail, Phone, Calendar, Clock, Search, Edit, Send, MessageSquare, Trash2, Play, Check, Zap } from 'lucide-react';

// ========== TIPOS ==========
interface Config {
  id: string;
  nombreSistema: string;
  horaEjecucion: string;
  gmailEmail: string;
  gmailActivo: boolean;
  gmailConfigurado: boolean;
  telegramActivo: boolean;
  telegramConfigurado: boolean;
  smsActivo: boolean;
  smsConfigurado: boolean;
  twilioPhoneNumber: string;
}

interface Recordatorio {
  id: string;
  nombre: string;
  correo: string;
  fechaRecordatorio: string;
  asunto: string;
  mensaje: string;
  telegramId: string | null;
  numeroTelefono: string | null;
  estado: string;
  enviarEmail: boolean;
  enviarTelegram: boolean;
  enviarSMS: boolean;
  envios?: Envio[];
}

interface Envio {
  id: string;
  canal: string;
  destinatario: string;
  estado: string;
  error: string | null;
  enviadoAt: string;
}

// ========== HELPERS ==========
const setToken = (t: string) => { try { localStorage.setItem('token', t); } catch {} };
const getToken = () => { try { return localStorage.getItem('token'); } catch { return null; } };
const removeToken = () => { try { localStorage.removeItem('token'); } catch {} };

const formatearFecha = (f: string) => new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
const esHoy = (f: string) => new Date().toDateString() === new Date(f).toDateString();

// ========== APP ==========
export default function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<'login' | 'dashboard'>('login');
  const [seccion, setSeccion] = useState<'recordatorios' | 'historial' | 'config'>('recordatorios');

  const cargar = async () => {
    try {
      const [c, r] = await Promise.all([fetch('/api/configuracion'), fetch('/api/recordatorios')]);
      setConfig(await c.json());
      setRecordatorios(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (getToken()) { setVista('dashboard'); cargar(); } else setLoading(false); }, []);
  useEffect(() => { if (vista === 'dashboard') cargar(); }, [seccion]);

  if (loading) return <LoadingScreen />;
  if (vista === 'login') return <Login onLogin={() => { setVista('dashboard'); cargar(); }} />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Recordatorios</h1>
                <p className="text-xs text-neutral-500">Multicanal</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {[
                { id: 'recordatorios' as const, label: 'Recordatorios', icon: Bell },
                { id: 'historial' as const, label: 'Historial', icon: Clock },
                { id: 'config' as const, label: 'Config', icon: Settings }
              ].map(item => (
                <button key={item.id} onClick={() => setSeccion(item.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${seccion === item.id ? 'bg-amber-500/10 text-amber-400' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}>
                  <item.icon className="w-4 h-4" /><span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
            <button onClick={() => { removeToken(); setVista('login'); }} className="flex items-center gap-2 px-4 py-2 text-neutral-500 hover:text-red-400 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" /><span className="text-sm hidden sm:block">Salir</span>
            </button>
          </div>
          <div className="flex md:hidden items-center gap-2 mt-4 overflow-x-auto pb-2">
            {[
              { id: 'recordatorios' as const, label: 'Recordatorios', icon: Bell },
              { id: 'historial' as const, label: 'Historial', icon: Clock },
              { id: 'config' as const, label: 'Config', icon: Settings }
            ].map(item => (
              <button key={item.id} onClick={() => setSeccion(item.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${seccion === item.id ? 'bg-amber-500 text-black font-medium' : 'bg-neutral-800 text-neutral-400'}`}>
                <item.icon className="w-4 h-4" /><span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {seccion === 'recordatorios' && <RecordatoriosSection recordatorios={recordatorios} cargar={cargar} />}
        {seccion === 'historial' && <HistorialSection />}
        {seccion === 'config' && <ConfigSection config={config} cargar={cargar} />}
      </main>
    </div>
  );
}

function LoadingScreen() {
  return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="text-center"><div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 animate-pulse"><Bell className="w-8 h-8 text-white" /></div><p className="text-neutral-400">Cargando...</p></div></div>;
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user, password: pass }) });
      const d = await res.json();
      if (d.success) { setToken(d.token); onLogin(); }
      else setErr(d.error || 'Error');
    } catch { setErr('Error de conexión'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-amber-500/20"><Bell className="w-8 h-8 text-white" /></div>
          <h1 className="text-2xl font-bold mb-1">Recordatorios</h1>
          <p className="text-neutral-500 text-sm">Sistema Multicanal</p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div><label className="block text-sm text-neutral-400 mb-2">Usuario</label><input required value={user} onChange={e => setUser(e.target.value)} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-amber-500/50 outline-none" placeholder="admin" /></div>
          <div><label className="block text-sm text-neutral-400 mb-2">Contraseña</label><input type="password" required value={pass} onChange={e => setPass(e.target.value)} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl focus:border-amber-500/50 outline-none" placeholder="••••••••" /></div>
          {err && <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center text-sm">{err}</div>}
          <button disabled={loading} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl disabled:opacity-50">{loading ? 'Verificando...' : 'Iniciar Sesión'}</button>
        </form>
        <p className="text-center text-neutral-600 text-xs mt-8">Usuario: admin • Contraseña: admin123</p>
      </div>
    </div>
  );
}

function RecordatoriosSection({ recordatorios, cargar }: { recordatorios: Recordatorio[]; cargar: () => void }) {
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Recordatorio | null>(null);
  const [filtro, setFiltro] = useState('');
  const [ejecutando, setEjecutando] = useState(false);

  const filtrados = recordatorios.filter(r => r.nombre.toLowerCase().includes(filtro.toLowerCase()) || r.correo.toLowerCase().includes(filtro.toLowerCase()) || r.asunto.toLowerCase().includes(filtro.toLowerCase()));

  const ejecutarDiario = async () => {
    if (!confirm('¿Ejecutar envío de recordatorios de hoy?')) return;
    setEjecutando(true);
    try {
      const res = await fetch('/api/enviar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: 'ejecutarDiario' }) });
      const d = await res.json();
      alert(d.success ? `✅ Procesados ${d.procesados} recordatorios` : `❌ Error: ${d.error}`);
      cargar();
    } catch { alert('Error'); }
    finally { setEjecutando(false); }
  };

  const enviarUno = async (id: string) => {
    try {
      const res = await fetch('/api/enviar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: 'enviar', recordatorioId: id }) });
      const d = await res.json();
      alert(d.success ? '✅ Enviado' : `❌ Error: ${JSON.stringify(d.resultados)}`);
      cargar();
    } catch { alert('Error'); }
  };

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar?')) return;
    await fetch(`/api/recordatorios/${id}`, { method: 'DELETE' });
    cargar();
  };

  const stats = { total: recordatorios.length, pendientes: recordatorios.filter(r => r.estado === 'pendiente').length, enviados: recordatorios.filter(r => r.estado === 'enviado').length, hoy: recordatorios.filter(r => esHoy(r.fechaRecordatorio)).length };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-2xl font-bold">Recordatorios</h2><p className="text-neutral-500 text-sm mt-1">Gestiona tus recordatorios</p></div>
        <div className="flex gap-3">
          <button onClick={ejecutarDiario} disabled={ejecutando} className="flex items-center gap-2 px-5 py-2.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl hover:bg-green-500/20 disabled:opacity-50"><Play className="w-4 h-4" /><span className="text-sm font-medium">{ejecutando ? 'Ejecutando...' : 'Ejecutar Hoy'}</span></button>
          <button onClick={() => { setEdit(null); setModal(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl shadow-lg shadow-amber-500/20"><Plus className="w-4 h-4" /><span className="text-sm">Nuevo</span></button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900/50 rounded-xl p-5 border border-neutral-800"><p className="text-3xl font-bold">{stats.total}</p><p className="text-sm text-neutral-500 mt-1">Total</p></div>
        <div className="bg-amber-500/5 rounded-xl p-5 border border-amber-500/20"><p className="text-3xl font-bold text-amber-400">{stats.pendientes}</p><p className="text-sm text-neutral-500 mt-1">Pendientes</p></div>
        <div className="bg-green-500/5 rounded-xl p-5 border border-green-500/20"><p className="text-3xl font-bold text-green-400">{stats.enviados}</p><p className="text-sm text-neutral-500 mt-1">Enviados</p></div>
        <div className="bg-blue-500/5 rounded-xl p-5 border border-blue-500/20"><p className="text-3xl font-bold text-blue-400">{stats.hoy}</p><p className="text-sm text-neutral-500 mt-1">Para Hoy</p></div>
      </div>
      <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" /><input placeholder="Buscar..." value={filtro} onChange={e => setFiltro(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl focus:border-amber-500/50 outline-none" /></div>
      <div className="space-y-3">
        {filtrados.length === 0 ? <div className="text-center py-16 bg-neutral-900/30 rounded-2xl border border-neutral-800"><Bell className="w-12 h-12 text-neutral-700 mx-auto mb-4" /><p className="text-neutral-500">No hay recordatorios</p></div> : filtrados.map(r => (
          <div key={r.id} className="bg-neutral-900/30 rounded-xl p-5 border border-neutral-800 hover:border-neutral-700 transition-colors">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{r.nombre}</h3>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${r.estado === 'pendiente' ? 'bg-amber-500/10 text-amber-400' : r.estado === 'enviado' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{r.estado}</span>
                  {esHoy(r.fechaRecordatorio) && <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400">Hoy</span>}
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-400">
                  <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{r.correo}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatearFecha(r.fechaRecordatorio)}</span>
                  <span className="flex items-center gap-2">{r.enviarEmail && <Mail className="w-4 h-4 text-blue-400" title="Email" />}{r.enviarTelegram && <MessageSquare className="w-4 h-4 text-cyan-400" title="Telegram" />}{r.enviarSMS && <Phone className="w-4 h-4 text-green-400" title="SMS" />}</span>
                </div>
                <p className="text-sm text-neutral-500 mt-2 truncate">{r.asunto}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => enviarUno(r.id)} className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20"><Send className="w-4 h-4" /><span className="text-sm font-medium">Enviar</span></button>
                <button onClick={() => { setEdit(r); setModal(true); }} className="p-2.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-lg"><Edit className="w-4 h-4" /></button>
                <button onClick={() => eliminar(r.id)} className="p-2.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {modal && <ModalRecordatorio recordatorio={edit} cerrar={() => { setModal(false); setEdit(null); }} cargar={cargar} />}
    </div>
  );
}

function ModalRecordatorio({ recordatorio, cerrar, cargar }: { recordatorio: Recordatorio | null; cerrar: () => void; cargar: () => void }) {
  const [data, setData] = useState({ nombre: recordatorio?.nombre || '', correo: recordatorio?.correo || '', fechaRecordatorio: recordatorio?.fechaRecordatorio?.split('T')[0] || '', asunto: recordatorio?.asunto || '', mensaje: recordatorio?.mensaje || '', telegramId: recordatorio?.telegramId || '', numeroTelefono: recordatorio?.numeroTelefono || '', enviarEmail: recordatorio?.enviarEmail ?? true, enviarTelegram: recordatorio?.enviarTelegram ?? false, enviarSMS: recordatorio?.enviarSMS ?? false });
  const [saving, setSaving] = useState(false);

  const guardar = async () => {
    if (!data.nombre || !data.correo || !data.fechaRecordatorio || !data.asunto || !data.mensaje) { alert('Completa los campos obligatorios'); return; }
    setSaving(true);
    try {
      await fetch(recordatorio ? `/api/recordatorios/${recordatorio.id}` : '/api/recordatorios', { method: recordatorio ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      cerrar(); cargar();
    } catch { alert('Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={cerrar}>
      <div className="w-full max-w-xl bg-[#0f0f0f] rounded-2xl border border-neutral-800 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">{recordatorio ? 'Editar' : 'Nuevo'} Recordatorio</h2><button onClick={cerrar} className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg"><X className="w-5 h-5" /></button></div>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm text-neutral-400 mb-2">Nombre *</label><input value={data.nombre} onChange={e => setData({ ...data, nombre: e.target.value })} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl outline-none focus:border-amber-500/50" placeholder="Juan Pérez" /></div>
              <div><label className="block text-sm text-neutral-400 mb-2">Correo *</label><input type="email" value={data.correo} onChange={e => setData({ ...data, correo: e.target.value })} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl outline-none focus:border-amber-500/50" placeholder="correo@ejemplo.com" /></div>
            </div>
            <div><label className="block text-sm text-neutral-400 mb-2">Fecha *</label><input type="date" value={data.fechaRecordatorio} onChange={e => setData({ ...data, fechaRecordatorio: e.target.value })} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl outline-none focus:border-amber-500/50" /></div>
            <div><label className="block text-sm text-neutral-400 mb-2">Asunto *</label><input value={data.asunto} onChange={e => setData({ ...data, asunto: e.target.value })} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl outline-none focus:border-amber-500/50" placeholder="Recordatorio" /></div>
            <div><label className="block text-sm text-neutral-400 mb-2">Mensaje *</label><textarea value={data.mensaje} onChange={e => setData({ ...data, mensaje: e.target.value })} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl outline-none focus:border-amber-500/50 resize-none" rows={4} placeholder="Escribe el mensaje..." /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm text-neutral-400 mb-2">Telegram ID</label><input value={data.telegramId} onChange={e => setData({ ...data, telegramId: e.target.value })} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl outline-none focus:border-amber-500/50" placeholder="123456789" /></div>
              <div><label className="block text-sm text-neutral-400 mb-2">Teléfono SMS</label><input value={data.numeroTelefono} onChange={e => setData({ ...data, numeroTelefono: e.target.value })} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl outline-none focus:border-amber-500/50" placeholder="+521234567890" /></div>
            </div>
            <div><label className="block text-sm text-neutral-400 mb-3">Canales</label><div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-3 cursor-pointer px-4 py-3 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-blue-500/30"><input type="checkbox" checked={data.enviarEmail} onChange={e => setData({ ...data, enviarEmail: e.target.checked })} className="w-5 h-5 accent-amber-500 rounded" /><Mail className="w-5 h-5 text-blue-400" /><span>Email</span></label>
              <label className="flex items-center gap-3 cursor-pointer px-4 py-3 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-cyan-500/30"><input type="checkbox" checked={data.enviarTelegram} onChange={e => setData({ ...data, enviarTelegram: e.target.checked })} className="w-5 h-5 accent-amber-500 rounded" /><MessageSquare className="w-5 h-5 text-cyan-400" /><span>Telegram</span></label>
              <label className="flex items-center gap-3 cursor-pointer px-4 py-3 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-green-500/30"><input type="checkbox" checked={data.enviarSMS} onChange={e => setData({ ...data, enviarSMS: e.target.checked })} className="w-5 h-5 accent-amber-500 rounded" /><Phone className="w-5 h-5 text-green-400" /><span>SMS</span></label>
            </div></div>
            <div className="flex gap-3 pt-4"><button onClick={cerrar} className="flex-1 py-3 bg-neutral-800 rounded-xl font-medium hover:bg-neutral-700">Cancelar</button><button onClick={guardar} disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistorialSection() {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarEnvios = async () => {
      try {
        const res = await fetch('/api/recordatorios');
        const recs = await res.json();
        const todos: any[] = [];
        for (const r of recs) { if (r.envios) todos.push(...r.envios.map((e: any) => ({ ...e, recordatorioNombre: r.nombre }))); }
        setEnvios(todos.sort((a, b) => new Date(b.enviadoAt).getTime() - new Date(a.enviadoAt).getTime()));
      } catch { }
      finally { setLoading(false); }
    };
    cargarEnvios();
  }, []);

  return (
    <div className="space-y-8">
      <div><h2 className="text-2xl font-bold">Historial</h2><p className="text-neutral-500 text-sm mt-1">Registro de envíos</p></div>
      {loading ? <div className="text-center py-16 text-neutral-400">Cargando...</div> : envios.length === 0 ? <div className="text-center py-16 bg-neutral-900/30 rounded-2xl border border-neutral-800"><Clock className="w-12 h-12 text-neutral-700 mx-auto mb-4" /><p className="text-neutral-500">No hay envíos</p></div> : (
        <div className="space-y-3">
          {envios.map(e => (
            <div key={e.id} className="bg-neutral-900/30 rounded-xl p-5 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${e.canal === 'email' ? 'bg-blue-500/10' : e.canal === 'telegram' ? 'bg-cyan-500/10' : 'bg-green-500/10'}`}>{e.canal === 'email' ? <Mail className="w-5 h-5 text-blue-400" /> : e.canal === 'telegram' ? <MessageSquare className="w-5 h-5 text-cyan-400" /> : <Phone className="w-5 h-5 text-green-400" />}</div>
                <div><p className="font-medium">{(e as any).recordatorioNombre || 'N/A'}</p><p className="text-sm text-neutral-500">{e.destinatario}</p></div>
              </div>
              <div className="text-left sm:text-right"><p className={`text-sm font-medium ${e.estado === 'enviado' ? 'text-green-400' : 'text-red-400'}`}>{e.estado === 'enviado' ? '✓ Enviado' : '✗ Error'}</p><p className="text-xs text-neutral-500">{new Date(e.enviadoAt).toLocaleString('es-ES')}</p>{e.error && <p className="text-xs text-red-400 mt-1">{e.error}</p>}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfigSection({ config, cargar }: { config: Config | null; cargar: () => void }) {
  const [data, setData] = useState({ gmailEmail: '', gmailPassword: '', gmailActivo: false, telegramBotToken: '', telegramActivo: false, twilioAccountSid: '', twilioAuthToken: '', twilioPhoneNumber: '', smsActivo: false, horaEjecucion: '09:00' });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setData({ gmailEmail: config.gmailEmail || '', gmailPassword: '', gmailActivo: config.gmailActivo, telegramBotToken: '', telegramActivo: config.telegramActivo, twilioAccountSid: '', twilioAuthToken: '', twilioPhoneNumber: config.twilioPhoneNumber || '', smsActivo: config.smsActivo, horaEjecucion: config.horaEjecucion || '09:00' });
    }
  }, [config]);

  const guardar = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/configuracion', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const d = await res.json();
      alert(d.success ? '✅ Guardado' : `❌ Error: ${d.error}`);
      if (d.success) cargar();
    } catch { alert('Error'); }
    finally { setSaving(false); }
  };

  const probarEmail = async () => {
    const email = prompt('Email de prueba:'); if (!email) return;
    setTesting('email');
    try {
      const res = await fetch('/api/enviar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: 'testEmail', testEmail: email }) });
      const d = await res.json();
      alert(d.success ? '✅ Enviado' : `❌ Error: ${d.error}`);
    } catch { alert('Error'); }
    finally { setTesting(null); }
  };

  const probarTelegram = async () => {
    const chatId = prompt('Chat ID:'); if (!chatId) return;
    setTesting('telegram');
    try {
      const res = await fetch('/api/enviar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: 'testTelegram', testTelegram: chatId }) });
      const d = await res.json();
      alert(d.success ? '✅ Enviado' : `❌ Error: ${d.error}`);
    } catch { alert('Error'); }
    finally { setTesting(null); }
  };

  return (
    <div className="space-y-8">
      <div><h2 className="text-2xl font-bold">Configuración</h2><p className="text-neutral-500 text-sm mt-1">Canales de notificación</p></div>

      {/* Automatización */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-6 border border-amber-500/20">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-amber-500/20 rounded-xl"><Zap className="w-6 h-6 text-amber-400" /></div>
          <div><h3 className="font-semibold text-lg">Envío Automático</h3><p className="text-sm text-neutral-400">Configura un cron job externo</p></div>
        </div>
        <div className="bg-neutral-900/50 rounded-xl p-4">
          <p className="text-sm text-neutral-300 mb-2">URL del Cron:</p>
          <code className="block bg-neutral-800 rounded-lg p-3 text-xs text-amber-400 break-all">https://recordatorios-gray.vercel.app/api/cron?secret=recordatorios-cron-2024</code>
          <p className="text-xs text-neutral-500 mt-2"> Usa cron-job.org para ejecutar esta URL diariamente</p>
        </div>
      </div>

      {/* Gmail */}
      <div className="bg-neutral-900/30 rounded-2xl p-6 border border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4"><div className="p-3 bg-blue-500/10 rounded-xl"><Mail className="w-6 h-6 text-blue-400" /></div><div><h3 className="font-semibold text-lg">Gmail</h3><p className="text-sm text-neutral-500">Correos electrónicos</p></div></div>
          <div className="flex items-center gap-4">{config?.gmailConfigurado && <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full"><Check className="w-3 h-3" /> Guardado</span>}<label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={data.gmailActivo} onChange={e => setData({ ...data, gmailActivo: e.target.checked })} className="w-5 h-5 accent-amber-500 rounded" /><span className="text-sm">Activo</span></label></div>
        </div>
        <div className="space-y-4">
          <div><label className="block text-sm text-neutral-400 mb-2">Correo Gmail</label><input type="email" placeholder="tucorreo@gmail.com" value={data.gmailEmail} onChange={e => setData({ ...data, gmailEmail: e.target.value })} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl outline-none focus:border-amber-500/50" /></div>
          <div><label className="block text-sm text-neutral-400 mb-2">App Password {config?.gmailConfigurado && <span className="text-green-400 text-xs">(vacío = mantener)</span>}</label><input type="password" placeholder="App Password" value={data.gmailPassword} onChange={e => setData({ ...data, gmailPassword: e.target.value })} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl outline-none focus:border-amber-500/50" /></div>
          <button onClick={probarEmail} disabled={testing === 'email'} className="px-5 py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 disabled:opacity-50 text-sm font-medium">{testing === 'email' ? 'Enviando...' : 'Probar Email'}</button>
        </div>
      </div>

      {/* Telegram */}
      <div className="bg-neutral-900/30 rounded-2xl p-6 border border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4"><div className="p-3 bg-cyan-500/10 rounded-xl"><MessageSquare className="w-6 h-6 text-cyan-400" /></div><div><h3 className="font-semibold text-lg">Telegram</h3><p className="text-sm text-neutral-500">Bot de Telegram</p></div></div>
          <div className="flex items-center gap-4">{config?.telegramConfigurado && <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full"><Check className="w-3 h-3" /> Guardado</span>}<label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={data.telegramActivo} onChange={e => setData({ ...data, telegramActivo: e.target.checked })} className="w-5 h-5 accent-amber-500 rounded" /><span className="text-sm">Activo</span></label></div>
        </div>
        <div className="space-y-4">
          <div><label className="block text-sm text-neutral-400 mb-2">Bot Token {config?.telegramConfigurado && <span className="text-green-400 text-xs">(vacío = mantener)</span>}</label><input type="password" placeholder="123456789:ABC..." value={data.telegramBotToken} onChange={e => setData({ ...data, telegramBotToken: e.target.value })} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl outline-none focus:border-amber-500/50" /></div>
          <button onClick={probarTelegram} disabled={testing === 'telegram'} className="px-5 py-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl hover:bg-cyan-500/20 disabled:opacity-50 text-sm font-medium">{testing === 'telegram' ? 'Enviando...' : 'Probar Telegram'}</button>
        </div>
      </div>

      {/* Hora */}
      <div className="bg-neutral-900/30 rounded-2xl p-6 border border-neutral-800">
        <div className="flex items-center gap-4 mb-6"><div className="p-3 bg-amber-500/10 rounded-xl"><Clock className="w-6 h-6 text-amber-400" /></div><div><h3 className="font-semibold text-lg">Hora de Ejecución</h3><p className="text-sm text-neutral-500">Hora diaria</p></div></div>
        <input type="time" value={data.horaEjecucion} onChange={e => setData({ ...data, horaEjecucion: e.target.value })} className="px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl outline-none focus:border-amber-500/50" />
      </div>

      <button onClick={guardar} disabled={saving} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl disabled:opacity-50 shadow-lg shadow-amber-500/20">{saving ? 'Guardando...' : 'Guardar Configuración'}</button>
    </div>
  );
}
