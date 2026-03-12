'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, Users, Tag, Settings, History, LogOut, Menu, X, 
  Plus, Edit, Trash2, Send, Check, AlertCircle, Clock,
  Mail, MessageSquare, TrendingUp, Calendar, DollarSign,
  ChevronDown, Search, Eye, EyeOff, Save, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

// Types
interface Admin {
  id: string;
  username: string;
  nombre: string;
  email?: string;
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  telegramId?: string;
  rol: string;
  recibirEmail: boolean;
  recibirTelegram: boolean;
  activo: boolean;
  _count?: { alertas: number };
}

interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  color: string;
  icono: string;
  _count?: { alertas: number };
}

interface Alerta {
  id: string;
  titulo: string;
  descripcion?: string;
  monto?: number;
  tipo: string;
  fechaVencimiento?: string;
  estado: string;
  prioridad: string;
  repetir: boolean;
  frecuencia?: string;
  usuarioId: string;
  categoriaId?: string;
  usuario?: Usuario;
  categoria?: Categoria;
  _count?: { notificaciones: number };
  createdAt: string;
}

interface Notificacion {
  id: string;
  canal: string;
  destinatario: string;
  estado: string;
  error?: string;
  asunto?: string;
  mensaje: string;
  alerta?: { id: string; titulo: string; tipo: string; prioridad: string };
  usuario?: { id: string; nombre: string; email: string };
  createdAt: string;
}

interface Configuracion {
  id: string;
  nombreNegocio: string;
  logoUrl?: string;
  emailRemitente?: string;
  emailPassword?: string;
  emailActivo: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramActivo: boolean;
  diasAnticipacion: number;
  enviarRecordatorios: boolean;
}

type Vista = 'login' | 'dashboard' | 'alertas' | 'usuarios' | 'categorias' | 'configuracion' | 'historial';

export default function Page() {
  // Estados principales
  const [vista, setVista] = useState<Vista>('login');
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados de datos
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(null);
  
  // Estados de formularios
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados de modales
  const [modalUsuario, setModalUsuario] = useState(false);
  const [modalCategoria, setModalCategoria] = useState(false);
  const [modalAlerta, setModalAlerta] = useState(false);
  const [modalConfirmar, setModalConfirmar] = useState(false);
  
  // Estados de edición
  const [editandoUsuario, setEditandoUsuario] = useState<Usuario | null>(null);
  const [editandoCategoria, setEditandoCategoria] = useState<Categoria | null>(null);
  const [editandoAlerta, setEditandoAlerta] = useState<Alerta | null>(null);
  const [eliminando, setEliminando] = useState<{ tipo: string; id: string } | null>(null);
  
  // Estados de filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');
  
  // Estadísticas del dashboard
  const [stats, setStats] = useState({
    pendientes: 0,
    enviadasHoy: 0,
    usuariosActivos: 0
  });

  // Verificar token guardado al cargar
  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      verificarToken(savedToken);
    }
  }, []);

  // Cargar datos cuando cambia la vista
  useEffect(() => {
    if (token && vista !== 'login') {
      switch (vista) {
        case 'dashboard':
          cargarDashboard();
          break;
        case 'alertas':
          cargarAlertas();
          cargarUsuarios();
          cargarCategorias();
          break;
        case 'usuarios':
          cargarUsuarios();
          break;
        case 'categorias':
          cargarCategorias();
          break;
        case 'configuracion':
          cargarConfiguracion();
          break;
        case 'historial':
          cargarNotificaciones();
          break;
      }
    }
  }, [vista, token]);

  // Funciones de autenticación
  const verificarToken = async (savedToken: string) => {
    try {
      const res = await fetch('/api/auth', {
        headers: { Authorization: `Bearer ${savedToken}` }
      });
      const data = await res.json();
      if (data.valid) {
        setToken(savedToken);
        setAdmin(data.admin);
        setVista('dashboard');
      } else {
        localStorage.removeItem('adminToken');
      }
    } catch {
      localStorage.removeItem('adminToken');
    }
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setAdmin(data.admin);
        localStorage.setItem('adminToken', data.token);
        setVista('dashboard');
        setLoginForm({ username: '', password: '' });
      } else {
        alert(data.error || 'Error al iniciar sesión');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('adminToken');
    setVista('login');
  };

  // Funciones de carga de datos
  const cargarDashboard = async () => {
    await Promise.all([cargarAlertas(), cargarUsuarios()]);
    // Calcular estadísticas
    setStats({
      pendientes: alertas.filter(a => a.estado === 'pendiente').length,
      enviadasHoy: alertas.filter(a => a.estado === 'enviado').length,
      usuariosActivos: usuarios.filter(u => u.activo).length
    });
  };

  const cargarUsuarios = async () => {
    try {
      const res = await fetch('/api/usuarios');
      const data = await res.json();
      setUsuarios(data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const cargarCategorias = async () => {
    try {
      const res = await fetch('/api/categorias');
      const data = await res.json();
      setCategorias(data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const cargarAlertas = async () => {
    try {
      let url = '/api/alertas?';
      if (filtroEstado) url += `estado=${filtroEstado}&`;
      if (filtroTipo) url += `tipo=${filtroTipo}&`;
      const res = await fetch(url);
      const data = await res.json();
      setAlertas(data);
      
      // Actualizar stats
      setStats({
        pendientes: data.filter((a: Alerta) => a.estado === 'pendiente').length,
        enviadasHoy: data.filter((a: Alerta) => a.estado === 'enviado').length,
        usuariosActivos: usuarios.filter(u => u.activo).length
      });
    } catch (error) {
      console.error('Error cargando alertas:', error);
    }
  };

  const cargarNotificaciones = async () => {
    try {
      const res = await fetch('/api/notificaciones/historial?limit=100');
      const data = await res.json();
      setNotificaciones(data);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  };

  const cargarConfiguracion = async () => {
    try {
      const res = await fetch('/api/configuracion');
      const data = await res.json();
      setConfiguracion(data);
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  // CRUD Usuarios
  const guardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);
    
    try {
      if (editandoUsuario) {
        await fetch(`/api/usuarios/${editandoUsuario.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            recibirEmail: data.recibirEmail === 'on',
            recibirTelegram: data.recibirTelegram === 'on'
          })
        });
      } else {
        await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            recibirEmail: true,
            recibirTelegram: true
          })
        });
      }
      setModalUsuario(false);
      setEditandoUsuario(null);
      cargarUsuarios();
    } catch (error) {
      alert('Error al guardar usuario');
    }
  };

  const eliminarUsuario = async (id: string) => {
    try {
      await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
      setEliminando(null);
      setModalConfirmar(false);
      cargarUsuarios();
    } catch (error) {
      alert('Error al eliminar usuario');
    }
  };

  // CRUD Categorías
  const guardarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);
    
    try {
      if (editandoCategoria) {
        await fetch(`/api/categorias/${editandoCategoria.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else {
        await fetch('/api/categorias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }
      setModalCategoria(false);
      setEditandoCategoria(null);
      cargarCategorias();
    } catch (error) {
      alert('Error al guardar categoría');
    }
  };

  const eliminarCategoria = async (id: string) => {
    try {
      await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
      setEliminando(null);
      setModalConfirmar(false);
      cargarCategorias();
    } catch (error) {
      alert('Error al eliminar categoría');
    }
  };

  // CRUD Alertas
  const guardarAlerta = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);
    
    try {
      const body = {
        ...data,
        monto: data.monto ? parseFloat(data.monto as string) : null,
        fechaVencimiento: data.fechaVencimiento || null,
        repetir: data.repetir === 'on'
      };
      
      if (editandoAlerta) {
        await fetch(`/api/alertas/${editandoAlerta.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      } else {
        await fetch('/api/alertas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      }
      setModalAlerta(false);
      setEditandoAlerta(null);
      cargarAlertas();
    } catch (error) {
      alert('Error al guardar alerta');
    }
  };

  const eliminarAlerta = async (id: string) => {
    try {
      await fetch(`/api/alertas/${id}`, { method: 'DELETE' });
      setEliminando(null);
      setModalConfirmar(false);
      cargarAlertas();
    } catch (error) {
      alert('Error al eliminar alerta');
    }
  };

  // Enviar alerta
  const enviarAlertaAhora = async (alerta: Alerta) => {
    if (!alerta.usuario) return;
    
    try {
      const mensaje = `📌 *${alerta.titulo}*\n\n${alerta.descripcion || ''}\n\n` +
        (alerta.monto ? `💰 Monto: $${alerta.monto.toFixed(2)}\n` : '') +
        (alerta.fechaVencimiento ? `📅 Vencimiento: ${new Date(alerta.fechaVencimiento).toLocaleDateString('es-ES')}\n` : '');
      
      // Enviar por email
      if (alerta.usuario.recibirEmail && alerta.usuario.email) {
        await fetch('/api/notificaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alertaId: alerta.id,
            canal: 'email',
            destinatario: alerta.usuario.email,
            asunto: alerta.titulo,
            mensaje
          })
        });
      }
      
      // Enviar por Telegram
      if (alerta.usuario.recibirTelegram && alerta.usuario.telegramId) {
        await fetch('/api/notificaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alertaId: alerta.id,
            canal: 'telegram',
            destinatario: alerta.usuario.telegramId,
            mensaje
          })
        });
      }
      
      alert('Notificación enviada');
      cargarAlertas();
    } catch (error) {
      alert('Error al enviar notificación');
    }
  };

  // Actualizar configuración
  const guardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);
    
    try {
      await fetch('/api/configuracion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          emailActivo: data.emailActivo === 'on',
          telegramActivo: data.telegramActivo === 'on',
          enviarRecordatorios: data.enviarRecordatorios === 'on',
          diasAnticipacion: parseInt(data.diasAnticipacion as string) || 3
        })
      });
      alert('Configuración guardada');
      cargarConfiguracion();
    } catch (error) {
      alert('Error al guardar configuración');
    }
  };

  // Helpers
  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'warning';
      case 'enviado': return 'success';
      case 'vencido': return 'destructive';
      case 'pagado': return 'info';
      default: return 'secondary';
    }
  };

  const getPrioridadVariant = (prioridad: string) => {
    switch (prioridad) {
      case 'urgente': return 'destructive';
      case 'alta': return 'warning';
      case 'normal': return 'secondary';
      case 'baja': return 'outline';
      default: return 'secondary';
    }
  };

  // Filtrar alertas por búsqueda
  const alertasFiltradas = alertas.filter(a => 
    busqueda === '' || 
    a.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.usuario?.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Renderizado condicional de vistas
  const renderLogin = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-4">
      <Card className="w-full max-w-md border-neutral-800 bg-neutral-900/90 backdrop-blur-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
            <Bell className="w-8 h-8 text-neutral-900" />
          </div>
          <CardTitle className="text-2xl font-bold text-gradient-gold">Sistema de Alertas</CardTitle>
          <p className="text-neutral-400 text-sm mt-1">Ingresa tus credenciales para continuar</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                value={loginForm.username}
                onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                placeholder="admin"
                className="bg-neutral-800 border-neutral-700"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  placeholder="••••••••"
                  className="bg-neutral-800 border-neutral-700 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-900 font-semibold"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
            <p className="text-center text-xs text-neutral-500 mt-4">
              Usuario: admin | Contraseña: admin123
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const renderSidebar = () => (
    <>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-neutral-900 border-r border-neutral-800 
        transform transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-neutral-900" />
            </div>
            <div>
              <h1 className="font-bold text-neutral-100">Alertas</h1>
              <p className="text-xs text-neutral-400">{admin?.nombre}</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-neutral-400 hover:text-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="p-3 space-y-1">
          {[
            { id: 'dashboard', icon: TrendingUp, label: 'Dashboard' },
            { id: 'alertas', icon: Bell, label: 'Alertas' },
            { id: 'usuarios', icon: Users, label: 'Usuarios' },
            { id: 'categorias', icon: Tag, label: 'Categorías' },
            { id: 'configuracion', icon: Settings, label: 'Configuración' },
            { id: 'historial', icon: History, label: 'Historial' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setVista(item.id as Vista); setSidebarOpen(false); }}
              className={`nav-btn ${vista === item.id ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-neutral-800">
          <button
            onClick={logout}
            className="nav-btn text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );

  const renderHeader = () => (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-neutral-900/95 backdrop-blur-lg border-b border-neutral-800 px-4 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-neutral-400 hover:text-neutral-200"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-neutral-100">Sistema de Alertas</h1>
        <div className="w-6" />
      </div>
    </header>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-100">Dashboard</h2>
        <Button 
          onClick={() => cargarDashboard()}
          variant="outline"
          className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-400 text-sm font-medium">Alertas Pendientes</p>
                <p className="text-3xl font-bold text-neutral-100 mt-1">{stats.pendientes}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-400 text-sm font-medium">Enviadas Hoy</p>
                <p className="text-3xl font-bold text-neutral-100 mt-1">{stats.enviadasHoy}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Send className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-400 text-sm font-medium">Usuarios Activos</p>
                <p className="text-3xl font-bold text-neutral-100 mt-1">{stats.usuariosActivos}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Próximas Alertas */}
      <Card className="bg-neutral-900/50 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-neutral-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Próximas Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alertas.slice(0, 5).map(alerta => (
              <div 
                key={alerta.id}
                className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50"
              >
                <div>
                  <p className="font-medium text-neutral-100">{alerta.titulo}</p>
                  <p className="text-sm text-neutral-400">
                    {alerta.usuario?.nombre} • {alerta.fechaVencimiento 
                      ? new Date(alerta.fechaVencimiento).toLocaleDateString('es-ES')
                      : 'Sin fecha'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getBadgeVariant(alerta.estado)}>{alerta.estado}</Badge>
                  {alerta.monto && (
                    <span className="text-amber-400 font-medium">${alerta.monto.toFixed(2)}</span>
                  )}
                </div>
              </div>
            ))}
            {alertas.length === 0 && (
              <p className="text-center text-neutral-500 py-4">No hay alertas</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAlertas = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-neutral-100">Gestión de Alertas</h2>
        <Button 
          onClick={() => { setEditandoAlerta(null); setModalAlerta(true); }}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-900"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Alerta
        </Button>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Buscar alertas..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="pl-10 bg-neutral-800 border-neutral-700"
          />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-full sm:w-40 bg-neutral-800 border-neutral-700">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
            <SelectItem value="pagado">Pagado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-full sm:w-40 bg-neutral-800 border-neutral-700">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="recordatorio">Recordatorio</SelectItem>
            <SelectItem value="aviso">Aviso</SelectItem>
            <SelectItem value="personalizado">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Lista de Alertas */}
      <div className="space-y-3">
        {alertasFiltradas.map(alerta => (
          <Card key={alerta.id} className="bg-neutral-900/50 border-neutral-800">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-neutral-100">{alerta.titulo}</h3>
                    <Badge variant={getBadgeVariant(alerta.estado)}>{alerta.estado}</Badge>
                    <Badge variant={getPrioridadVariant(alerta.prioridad)}>{alerta.prioridad}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {alerta.usuario?.nombre}
                    </span>
                    {alerta.fechaVencimiento && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(alerta.fechaVencimiento).toLocaleDateString('es-ES')}
                      </span>
                    )}
                    {alerta.monto && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <DollarSign className="w-4 h-4" />
                        ${alerta.monto.toFixed(2)}
                      </span>
                    )}
                    {alerta.categoria && (
                      <span 
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                        style={{ backgroundColor: alerta.categoria.color + '20', color: alerta.categoria.color }}
                      >
                        {alerta.categoria.nombre}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {alerta.estado === 'pendiente' && (
                    <Button
                      size="sm"
                      onClick={() => enviarAlertaAhora(alerta)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Enviar
                    </Button>
                  )}
                  {alerta.estado === 'pendiente' && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        await fetch(`/api/alertas/${alerta.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ estado: 'pagado' })
                        });
                        cargarAlertas();
                      }}
                      variant="outline"
                      className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Pagado
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditandoAlerta(alerta); setModalAlerta(true); }}
                    className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEliminando({ tipo: 'alerta', id: alerta.id }); setModalConfirmar(true); }}
                    className="border-red-700 text-red-400 hover:bg-red-600/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {alertasFiltradas.length === 0 && (
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400">No hay alertas que mostrar</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderUsuarios = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-100">Gestión de Usuarios</h2>
        <Button 
          onClick={() => { setEditandoUsuario(null); setModalUsuario(true); }}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-900"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>
      
      <div className="grid gap-3">
        {usuarios.map(usuario => (
          <Card key={usuario.id} className="bg-neutral-900/50 border-neutral-800">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-neutral-900 font-bold text-lg">
                    {usuario.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-neutral-100">{usuario.nombre}</h3>
                      <Badge variant={usuario.rol === 'admin' ? 'default' : 'secondary'}>
                        {usuario.rol}
                      </Badge>
                      {!usuario.activo && <Badge variant="destructive">Inactivo</Badge>}
                    </div>
                    <p className="text-sm text-neutral-400">{usuario.email}</p>
                    <div className="flex gap-3 mt-1 text-xs text-neutral-500">
                      {usuario.recibirEmail && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />Email</span>}
                      {usuario.recibirTelegram && <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />Telegram</span>}
                      {usuario._count && <span>{usuario._count.alertas} alertas</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditandoUsuario(usuario); setModalUsuario(true); }}
                    className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEliminando({ tipo: 'usuario', id: usuario.id }); setModalConfirmar(true); }}
                    className="border-red-700 text-red-400 hover:bg-red-600/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {usuarios.length === 0 && (
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400">No hay usuarios registrados</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderCategorias = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-100">Gestión de Categorías</h2>
        <Button 
          onClick={() => { setEditandoCategoria(null); setModalCategoria(true); }}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-900"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categorias.map(categoria => (
          <Card key={categoria.id} className="bg-neutral-900/50 border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: categoria.color + '20' }}
                  >
                    <Tag className="w-5 h-5" style={{ color: categoria.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-100">{categoria.nombre}</h3>
                    <p className="text-sm text-neutral-400">{categoria.descripcion || 'Sin descripción'}</p>
                    {categoria._count && (
                      <p className="text-xs text-neutral-500 mt-1">{categoria._count.alertas} alertas</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEditandoCategoria(categoria); setModalCategoria(true); }}
                    className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEliminando({ tipo: 'categoria', id: categoria.id }); setModalConfirmar(true); }}
                    className="text-red-400 hover:text-red-300 hover:bg-red-600/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {categorias.length === 0 && (
          <Card className="bg-neutral-900/50 border-neutral-800 sm:col-span-2 lg:col-span-3">
            <CardContent className="p-8 text-center">
              <Tag className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400">No hay categorías creadas</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderConfiguracion = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-100">Configuración del Sistema</h2>
      
      <form onSubmit={guardarConfiguracion} className="space-y-6">
        {/* Configuración General */}
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-neutral-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" />
              Configuración General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombreNegocio">Nombre del Negocio</Label>
                <Input
                  id="nombreNegocio"
                  name="nombreNegocio"
                  defaultValue={configuracion?.nombreNegocio}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diasAnticipacion">Días de Anticipación</Label>
                <Input
                  id="diasAnticipacion"
                  name="diasAnticipacion"
                  type="number"
                  min="1"
                  max="30"
                  defaultValue={configuracion?.diasAnticipacion || 3}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Enviar Recordatorios Automáticos</Label>
                <p className="text-sm text-neutral-400">Enviar alertas antes del vencimiento</p>
              </div>
              <Switch 
                name="enviarRecordatorios"
                defaultChecked={configuracion?.enviarRecordatorios}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Configuración de Email */}
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-neutral-100 flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-400" />
              Configuración de Email (Gmail)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Activar Email</Label>
                <p className="text-sm text-neutral-400">Enviar notificaciones por email</p>
              </div>
              <Switch 
                name="emailActivo"
                defaultChecked={configuracion?.emailActivo}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emailRemitente">Email Remitente</Label>
                <Input
                  id="emailRemitente"
                  name="emailRemitente"
                  type="email"
                  placeholder="tucorreo@gmail.com"
                  defaultValue={configuracion?.emailRemitente}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailPassword">Contraseña de Aplicación</Label>
                <Input
                  id="emailPassword"
                  name="emailPassword"
                  type="password"
                  placeholder="••••••••"
                  defaultValue={configuracion?.emailPassword}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
            </div>
            <p className="text-xs text-neutral-500">
              Para Gmail, genera una "Contraseña de aplicación" en tu cuenta de Google
            </p>
          </CardContent>
        </Card>
        
        {/* Configuración de Telegram */}
        <Card className="bg-neutral-900/50 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-neutral-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              Configuración de Telegram
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Activar Telegram</Label>
                <p className="text-sm text-neutral-400">Enviar notificaciones por Telegram</p>
              </div>
              <Switch 
                name="telegramActivo"
                defaultChecked={configuracion?.telegramActivo}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="telegramBotToken">Bot Token</Label>
                <Input
                  id="telegramBotToken"
                  name="telegramBotToken"
                  placeholder="123456:ABC-DEF..."
                  defaultValue={configuracion?.telegramBotToken}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegramChatId">Chat ID Principal</Label>
                <Input
                  id="telegramChatId"
                  name="telegramChatId"
                  placeholder="-1001234567890"
                  defaultValue={configuracion?.telegramChatId}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
            </div>
            <p className="text-xs text-neutral-500">
              Habla con @BotFather en Telegram para crear un bot y obtener el token
            </p>
          </CardContent>
        </Card>
        
        <Button 
          type="submit"
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-900"
        >
          <Save className="w-4 h-4 mr-2" />
          Guardar Configuración
        </Button>
      </form>
    </div>
  );

  const renderHistorial = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-100">Historial de Notificaciones</h2>
      
      <div className="space-y-3">
        {notificaciones.map(notif => (
          <Card key={notif.id} className="bg-neutral-900/50 border-neutral-800">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    notif.canal === 'email' ? 'bg-cyan-500/20' : 'bg-sky-500/20'
                  }`}>
                    {notif.canal === 'email' 
                      ? <Mail className="w-5 h-5 text-cyan-400" />
                      : <MessageSquare className="w-5 h-5 text-sky-400" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-neutral-100">
                        {notif.alerta?.titulo || 'Sin título'}
                      </h3>
                      <Badge variant={
                        notif.estado === 'enviado' ? 'success' :
                        notif.estado === 'error' ? 'destructive' : 'warning'
                      }>
                        {notif.estado}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-400">
                      Para: {notif.destinatario} • {notif.usuario?.nombre || 'Sin usuario'}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {new Date(notif.createdAt).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>
              {notif.error && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {notif.error}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {notificaciones.length === 0 && (
          <Card className="bg-neutral-900/50 border-neutral-800">
            <CardContent className="p-8 text-center">
              <History className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400">No hay notificaciones en el historial</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  // Modales
  const renderModalUsuario = () => (
    <Dialog open={modalUsuario} onOpenChange={setModalUsuario}>
      <DialogContent className="bg-neutral-900 border-neutral-700">
        <DialogHeader>
          <DialogTitle>{editandoUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={guardarUsuario} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input 
              name="nombre" 
              defaultValue={editandoUsuario?.nombre}
              className="bg-neutral-800 border-neutral-700"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input 
              name="email" 
              type="email"
              defaultValue={editandoUsuario?.email}
              className="bg-neutral-800 border-neutral-700"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input 
              name="telefono" 
              defaultValue={editandoUsuario?.telefono || ''}
              className="bg-neutral-800 border-neutral-700"
            />
          </div>
          <div className="space-y-2">
            <Label>Telegram ID</Label>
            <Input 
              name="telegramId" 
              defaultValue={editandoUsuario?.telegramId || ''}
              className="bg-neutral-800 border-neutral-700"
            />
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Select name="rol" defaultValue={editandoUsuario?.rol || 'cliente'}>
              <SelectTrigger className="bg-neutral-800 border-neutral-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                name="recibirEmail" 
                defaultChecked={editandoUsuario?.recibirEmail ?? true}
                className="rounded border-neutral-600 bg-neutral-800 text-amber-500"
              />
              Recibir Email
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                name="recibirTelegram" 
                defaultChecked={editandoUsuario?.recibirTelegram ?? true}
                className="rounded border-neutral-600 bg-neutral-800 text-amber-500"
              />
              Recibir Telegram
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalUsuario(false)}>Cancelar</Button>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-400 text-neutral-900">
              {editandoUsuario ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  const renderModalCategoria = () => (
    <Dialog open={modalCategoria} onOpenChange={setModalCategoria}>
      <DialogContent className="bg-neutral-900 border-neutral-700">
        <DialogHeader>
          <DialogTitle>{editandoCategoria ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={guardarCategoria} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input 
              name="nombre" 
              defaultValue={editandoCategoria?.nombre}
              className="bg-neutral-800 border-neutral-700"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea 
              name="descripcion" 
              defaultValue={editandoCategoria?.descripcion || ''}
              className="bg-neutral-800 border-neutral-700"
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              <Input 
                name="color" 
                type="color"
                defaultValue={editandoCategoria?.color || '#f59e0b'}
                className="w-16 h-10 p-1 bg-neutral-800 border-neutral-700"
              />
              <Input 
                name="colorHex"
                defaultValue={editandoCategoria?.color || '#f59e0b'}
                className="flex-1 bg-neutral-800 border-neutral-700"
                placeholder="#f59e0b"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalCategoria(false)}>Cancelar</Button>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-400 text-neutral-900">
              {editandoCategoria ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  const renderModalAlerta = () => (
    <Dialog open={modalAlerta} onOpenChange={setModalAlerta}>
      <DialogContent className="bg-neutral-900 border-neutral-700 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editandoAlerta ? 'Editar Alerta' : 'Nueva Alerta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={guardarAlerta} className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input 
              name="titulo" 
              defaultValue={editandoAlerta?.titulo}
              className="bg-neutral-800 border-neutral-700"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea 
              name="descripcion" 
              defaultValue={editandoAlerta?.descripcion || ''}
              className="bg-neutral-800 border-neutral-700"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input 
                name="monto" 
                type="number"
                step="0.01"
                defaultValue={editandoAlerta?.monto || ''}
                className="bg-neutral-800 border-neutral-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select name="tipo" defaultValue={editandoAlerta?.tipo || 'pago'}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="recordatorio">Recordatorio</SelectItem>
                  <SelectItem value="aviso">Aviso</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Vencimiento</Label>
              <Input 
                name="fechaVencimiento" 
                type="date"
                defaultValue={editandoAlerta?.fechaVencimiento?.split('T')[0] || ''}
                className="bg-neutral-800 border-neutral-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select name="prioridad" defaultValue={editandoAlerta?.prioridad || 'normal'}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Usuario</Label>
              <Select name="usuarioId" defaultValue={editandoAlerta?.usuarioId || ''} required>
                <SelectTrigger className="bg-neutral-800 border-neutral-700">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select name="categoriaId" defaultValue={editandoAlerta?.categoriaId || ''}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700">
                  <SelectValue placeholder="Sin categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin categoría</SelectItem>
                  {categorias.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select name="estado" defaultValue={editandoAlerta?.estado || 'pendiente'}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Repetir</Label>
              <Select name="frecuencia" defaultValue={editandoAlerta?.frecuencia || ''}>
                <SelectTrigger className="bg-neutral-800 border-neutral-700">
                  <SelectValue placeholder="No repetir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No repetir</SelectItem>
                  <SelectItem value="diario">Diario</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalAlerta(false)}>Cancelar</Button>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-400 text-neutral-900">
              {editandoAlerta ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  const renderModalConfirmar = () => (
    <Dialog open={modalConfirmar} onOpenChange={setModalConfirmar}>
      <DialogContent className="bg-neutral-900 border-neutral-700">
        <DialogHeader>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setModalConfirmar(false)}>Cancelar</Button>
          <Button 
            variant="destructive"
            onClick={() => {
              if (eliminando?.tipo === 'usuario') eliminarUsuario(eliminando.id);
              else if (eliminando?.tipo === 'categoria') eliminarCategoria(eliminando.id);
              else if (eliminando?.tipo === 'alerta') eliminarAlerta(eliminando.id);
            }}
          >
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Render principal
  if (vista === 'login') {
    return renderLogin();
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {renderSidebar()}
      {renderHeader()}
      
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-6">
          {vista === 'dashboard' && renderDashboard()}
          {vista === 'alertas' && renderAlertas()}
          {vista === 'usuarios' && renderUsuarios()}
          {vista === 'categorias' && renderCategorias()}
          {vista === 'configuracion' && renderConfiguracion()}
          {vista === 'historial' && renderHistorial()}
        </div>
      </main>
      
      {renderModalUsuario()}
      {renderModalCategoria()}
      {renderModalAlerta()}
      {renderModalConfirmar()}
    </div>
  );
}
