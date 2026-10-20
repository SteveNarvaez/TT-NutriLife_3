import { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:3000/api/admin';
const userId = () => localStorage.getItem('userId');
const headers = () => ({ 'Content-Type': 'application/json', 'x-user-id': userId() });

// ─── Helpers ───────────────────────────────────────────────────────
const api = {
  get:    (path) => fetch(`${API}${path}`, { headers: headers() }).then(r => r.json()),
  post:   (path, body) => fetch(`${API}${path}`, { method: 'POST',   headers: headers(), body: JSON.stringify(body) }).then(r => r.json()),
  put:    (path, body) => fetch(`${API}${path}`, { method: 'PUT',    headers: headers(), body: JSON.stringify(body) }).then(r => r.json()),
  patch:  (path, body) => fetch(`${API}${path}`, { method: 'PATCH',  headers: headers(), body: JSON.stringify(body) }).then(r => r.json()),
  delete: (path)       => fetch(`${API}${path}`, { method: 'DELETE', headers: headers() }).then(r => r.json()),
};

// ─── Mini components ───────────────────────────────────────────────
const Skeleton = ({ h = '1rem', w = '100%', className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`} style={{ height: h, width: w }} />
);

const Badge = ({ text, variant = 'gray' }) => {
  const variants = {
    green:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    red:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    amber:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    gray:   'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${variants[variant]}`}>{text}</span>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-white/30 dark:border-gray-700/50 shadow-lg ${className}`}>
    {children}
  </div>
);

const Btn = ({ children, onClick, variant = 'primary', size = 'sm', disabled = false, className = '' }) => {
  const variants = {
    primary:  'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm',
    danger:   'bg-red-500 hover:bg-red-600 text-white shadow-sm',
    ghost:    'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200',
    outline:  'border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300',
  };
  const sizes = { xs: 'px-2 py-1 text-xs', sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${sizes[size]} rounded-lg font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ value, onChange, placeholder, type = 'text', className = '' }) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600
      bg-white dark:bg-gray-800 text-gray-800 dark:text-white
      placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${className}`}
  />
);

// ─── Barra de mini gráfica SVG ─────────────────────────────────────
const MiniBarChart = ({ data = [], color = '#10b981', height = 48 }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value || d.nuevos || d.entrenamientos || 0), 1);
  const vals = data.map(d => d.value || d.nuevos || d.entrenamientos || 0);
  const W = 200; const H = height; const barW = W / vals.length - 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {vals.map((v, i) => {
        const bh = (v / max) * (H - 4);
        return (
          <rect key={i}
            x={i * (barW + 2)} y={H - bh - 2}
            width={barW} height={bh}
            rx={2}
            fill={color} opacity={0.7 + (v / max) * 0.3}
          />
        );
      })}
    </svg>
  );
};

// ─── KPI Card ──────────────────────────────────────────────────────
const KpiCard = ({ icon, label, value, color, mini }) => (
  <Card className="p-5">
    <div className="flex items-start gap-3 mb-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value ?? '—'}</p>
      </div>
    </div>
    {mini && <MiniBarChart data={mini} color={color.includes('emerald') ? '#10b981' : color.includes('blue') ? '#3b82f6' : '#f59e0b'} />}
  </Card>
);

// ════════════════════════════════════════════════════════════════════
// 1. SECCIÓN: ESTADÍSTICAS GLOBALES
// ════════════════════════════════════════════════════════════════════
function SeccionStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array(8).fill(0).map((_, i) => <Card key={i} className="p-5"><Skeleton h="4rem" /></Card>)}
    </div>
  );

  const r = data?.resumen || {};
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="👥" label="Usuarios totales"         value={r.total_usuarios}           color="bg-blue-100 dark:bg-blue-900/30"    />
        <KpiCard icon="✅" label="Usuarios activos"         value={r.usuarios_activos}         color="bg-emerald-100 dark:bg-emerald-900/30" />
        <KpiCard icon="🆕" label="Nuevos hoy"               value={r.nuevos_hoy}               color="bg-amber-100 dark:bg-amber-900/30"  />
        <KpiCard icon="🏋️" label="Entrenamientos hoy"      value={r.entrenamientos_hoy}        color="bg-violet-100 dark:bg-violet-900/30" />
        <KpiCard icon="🍽️" label="Registros comida hoy"    value={r.registros_comida_hoy}      color="bg-orange-100 dark:bg-orange-900/30" />
        <KpiCard icon="🔥" label="Promedio kcal sistema"    value={r.promedio_calorias_sistema} color="bg-red-100 dark:bg-red-900/30"      />
        <KpiCard icon="📋" label="Triajes completados"      value={r.triajes_completados}       color="bg-teal-100 dark:bg-teal-900/30"    />
        <KpiCard icon="🥦" label="Alimentos en catálogo"    value={r.total_alimentos}           color="bg-lime-100 dark:bg-lime-900/30"    />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Registros últimos 30 días
          </p>
          <MiniBarChart data={data?.registro_diario || []} color="#10b981" height={64} />
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Actividad última semana
          </p>
          <MiniBarChart data={data?.actividad_semana || []} color="#3b82f6" height={64} />
        </Card>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 2. SECCIÓN: USUARIOS
// ════════════════════════════════════════════════════════════════════
function SeccionUsuarios() {
  const [data, setData] = useState({ usuarios: [], total: 0, total_paginas: 1 });
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [pagina, setPagina] = useState(1);
  const [accionando, setAccionando] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const myId = Number(userId());

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/usuarios?buscar=${buscar}&pagina=${pagina}&limite=15`);
      setData(res);
    } finally { setLoading(false); }
  }, [buscar, pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarRol = async (id, rolActual) => {
    const nuevoRol = rolActual === 'admin' ? 'usuario' : 'admin';
    if (!confirm(`¿Cambiar rol de este usuario a ${nuevoRol}?`)) return;
    setAccionando(id);
    await api.patch(`/usuarios/${id}/rol`, { rol: nuevoRol });
    setAccionando(null);
    cargar();
  };

  const toggleEstado = async (id, activo) => {
    if (!confirm(activo ? '¿Suspender esta cuenta?' : '¿Reactivar esta cuenta?')) return;
    setAccionando(id);
    await api.patch(`/usuarios/${id}/estado`, { activo: !activo });
    setAccionando(null);
    cargar();
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este usuario y todos sus datos? Esta acción no se puede deshacer.')) return;
    setAccionando(id);
    const res = await api.delete(`/usuarios/${id}`);
    setAccionando(null);
    if (res.success) cargar();
    else alert(res.error);
  };

  const verDetalle = async (id) => {
    const res = await api.get(`/usuarios/${id}`);
    setDetalle(res);
  };

  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="flex gap-3">
        <Input value={buscar} onChange={v => { setBuscar(v); setPagina(1); }} placeholder="Buscar por nombre o email…" className="max-w-xs" />
        <Btn onClick={cargar} variant="ghost">🔄 Actualizar</Btn>
      </div>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                {['Usuario', 'Email', 'Rol', 'Estado', 'Registro', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                      {Array(6).fill(0).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton h="1rem" w={j === 5 ? '80%' : '60%'} /></td>
                      ))}
                    </tr>
                  ))
                : data.usuarios.map(u => (
                    <tr key={u.id_usuario}
                      className={`border-b border-gray-50 dark:border-gray-800 transition-colors
                        ${u.id_usuario === myId ? 'bg-emerald-50/40 dark:bg-emerald-900/10' : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/20'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                            {(u.nombre || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white text-xs">
                              {u.nombre}
                              {u.id_usuario === myId && <span className="ml-1 text-emerald-500">(tú)</span>}
                            </p>
                            <p className="text-gray-400 text-xs">{u.peso_kg ? `${u.peso_kg} kg` : '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge text={u.rol} variant={u.rol === 'admin' ? 'blue' : 'gray'} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge text={u.activo ? 'Activo' : 'Suspendido'} variant={u.activo ? 'green' : 'red'} />
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString('es-MX') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Btn variant="ghost" size="xs" onClick={() => verDetalle(u.id_usuario)}>👁</Btn>
                          {u.id_usuario !== myId && <>
                            <Btn variant="ghost" size="xs" disabled={!!accionando}
                              onClick={() => cambiarRol(u.id_usuario, u.rol)}>
                              {u.rol === 'admin' ? '⬇️' : '⬆️'}
                            </Btn>
                            <Btn variant="ghost" size="xs" disabled={!!accionando}
                              onClick={() => toggleEstado(u.id_usuario, u.activo)}>
                              {u.activo ? '🔒' : '🔓'}
                            </Btn>
                            <Btn variant="danger" size="xs" disabled={!!accionando}
                              onClick={() => eliminar(u.id_usuario)}>🗑</Btn>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {data.total_paginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400">{data.total} usuarios</p>
            <div className="flex gap-2">
              <Btn variant="outline" size="xs" disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}>← Ant</Btn>
              <span className="text-xs text-gray-500 px-2 py-1">{pagina} / {data.total_paginas}</span>
              <Btn variant="outline" size="xs" disabled={pagina === data.total_paginas} onClick={() => setPagina(p => p + 1)}>Sig →</Btn>
            </div>
          </div>
        )}
      </Card>

      {/* Modal detalle */}
      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 dark:text-white">{detalle.perfil?.nombre}</h3>
              <button onClick={() => setDetalle(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Email', detalle.perfil?.email],
                  ['Rol', detalle.perfil?.rol],
                  ['Estado', detalle.perfil?.activo ? '✅ Activo' : '🔴 Suspendido'],
                  ['Peso', `${detalle.perfil?.peso_kg || '—'} kg`],
                  ['Altura', `${detalle.perfil?.altura_cm || '—'} cm`],
                  ['TMB', `${detalle.perfil?.tmb_calculado || '—'} kcal`],
                  ['Objetivo', detalle.perfil?.objetivo_actual || '—'],
                  ['Nivel actividad', detalle.perfil?.nivel_actividad || '—'],
                  ['Total entrenamientos', detalle.perfil?.total_entrenamientos],
                  ['Días con registro', detalle.perfil?.dias_con_registro],
                  ['Promedio constancia', detalle.perfil?.promedio_constancia ? `${Math.round(detalle.perfil.promedio_constancia)}%` : '—'],
                  ['Triaje completado', detalle.perfil?.triaje_completado ? '✅ Sí' : '❌ No'],
                ].map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <p className="text-xs text-gray-400">{k}</p>
                    <p className="font-medium text-gray-800 dark:text-white">{v ?? '—'}</p>
                  </div>
                ))}
              </div>
              {detalle.triaje && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Triaje de salud</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {[
                      ['Padece enfermedad', detalle.triaje.padece_enfermedad ? 'Sí' : 'No'],
                      ['Apto alto impacto', detalle.triaje.apto_alto_impacto ? 'Sí' : 'No'],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <span className="text-gray-400">{k}: </span>
                        <span className="font-medium text-gray-700 dark:text-gray-200">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 3. SECCIÓN: CATÁLOGO CRUD (alimentos / ejercicios)
// ════════════════════════════════════════════════════════════════════
function SeccionCatalogo({ tipo }) {
  const isAlimento  = tipo === 'alimentos';
  const endpoint    = `/catalogo/${tipo}`;
  const idField     = isAlimento ? 'id_comida' : 'id_ejercicio';
  const groupField  = isAlimento ? 'grupo_nutricional' : 'grupo_muscular';

  const camposVacios = isAlimento
    ? { nombre: '', grupo_nutricional: '', cantidad_base: '', unidad_medida: 'g', calorias_kcal: '', proteina_g: '', lipidos_g: '', carbohidratos_g: '' }
    : { nombre: '', grupo_muscular: '', dificultad: 'intermedio', nivel_impacto: 'moderado', objetivo_enfocado: '', series_sugeridas: '', repeticiones_sugeridas: '', descripcion: '' };

  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar]   = useState('');
  const [form, setForm]       = useState(camposVacios);
  const [editId, setEditId]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const [showForm, setShowForm] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await api.get(`${endpoint}?buscar=${buscar}`).catch(() => []);
    setItems(Array.isArray(res) ? res : []);
    setLoading(false);
  }, [buscar, endpoint]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNuevo  = () => { setForm(camposVacios); setEditId(null); setShowForm(true); };
  const abrirEditar = (item) => {
    setForm(Object.fromEntries(Object.keys(camposVacios).map(k => [k, item[k] ?? ''])));
    setEditId(item[idField]);
    setShowForm(true);
  };

  const guardar = async () => {
    setSaving(true);
    const res = editId
      ? await api.put(`${endpoint}/${editId}`, form)
      : await api.post(endpoint, form);
    setSaving(false);
    if (res.success || res.alimento || res.ejercicio) {
      setShowForm(false);
      cargar();
    } else {
      alert(res.error || 'Error al guardar');
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este elemento del catálogo?')) return;
    await api.delete(`${endpoint}/${id}`);
    cargar();
  };

  // Campos del formulario dinámico
  const campos = isAlimento
    ? [
        { key: 'nombre',            label: 'Nombre',            type: 'text'   },
        { key: 'grupo_nutricional', label: 'Grupo nutricional', type: 'text'   },
        { key: 'cantidad_base',     label: 'Cantidad base',     type: 'number' },
        { key: 'unidad_medida',     label: 'Unidad medida',     type: 'text'   },
        { key: 'calorias_kcal',     label: 'Calorías (kcal)',   type: 'number' },
        { key: 'proteina_g',        label: 'Proteína (g)',       type: 'number' },
        { key: 'lipidos_g',         label: 'Lípidos (g)',        type: 'number' },
        { key: 'carbohidratos_g',   label: 'Carbohidratos (g)', type: 'number' },
      ]
    : [
        { key: 'nombre',                   label: 'Nombre',                type: 'text'   },
        { key: 'grupo_muscular',           label: 'Grupo muscular',        type: 'text'   },
        { key: 'dificultad',              label: 'Dificultad',            type: 'text'   },
        { key: 'nivel_impacto',           label: 'Nivel impacto',         type: 'text'   },
        { key: 'objetivo_enfocado',       label: 'Objetivo enfocado',     type: 'text'   },
        { key: 'series_sugeridas',        label: 'Series',                type: 'number' },
        { key: 'repeticiones_sugeridas',  label: 'Repeticiones',          type: 'number' },
        { key: 'descripcion',             label: 'Descripción',           type: 'text'   },
      ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input value={buscar} onChange={v => setBuscar(v)} placeholder={`Buscar ${isAlimento ? 'alimento' : 'ejercicio'}…`} className="max-w-xs" />
        <Btn onClick={cargar} variant="ghost">🔄</Btn>
        <Btn onClick={abrirNuevo} variant="primary">+ Nuevo {isAlimento ? 'alimento' : 'ejercicio'}</Btn>
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 dark:text-white">
                {editId ? 'Editar' : 'Nuevo'} {isAlimento ? 'alimento' : 'ejercicio'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {campos.map(c => (
                <div key={c.key} className={c.key === 'nombre' || c.key === 'descripcion' ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{c.label}</label>
                  <Input
                    type={c.type}
                    value={form[c.key] ?? ''}
                    onChange={v => setForm(f => ({ ...f, [c.key]: v }))}
                    placeholder={c.label}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
              <Btn variant="primary" onClick={guardar} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </Btn>
            </div>
          </Card>
        </div>
      )}

      {/* Lista */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Grupo</th>
                {isAlimento && <>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">kcal</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Prot</th>
                </>}
                {!isAlimento && <>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Dificultad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Impacto</th>
                </>}
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(6).fill(0).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                      {Array(5).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton h="0.875rem" /></td>)}
                    </tr>
                  ))
                : items.map(item => (
                    <tr key={item[idField]} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{item.nombre}</td>
                      <td className="px-4 py-3">
                        <Badge text={item[groupField] || '—'} />
                      </td>
                      {isAlimento && <>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{item.calorias_kcal}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{item.proteina_g}g</td>
                      </>}
                      {!isAlimento && <>
                        <td className="px-4 py-3"><Badge text={item.dificultad || '—'} variant="amber" /></td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.nivel_impacto || '—'}</td>
                      </>}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Btn variant="ghost" size="xs" onClick={() => abrirEditar(item)}>✏️</Btn>
                          <Btn variant="danger" size="xs" onClick={() => eliminar(item[idField])}>🗑</Btn>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          {!loading && items.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              No se encontraron resultados
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 4. SECCIÓN: TRIAJES
// ════════════════════════════════════════════════════════════════════
function SeccionTriajes() {
  const [triajes, setTriajes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/triajes').then(r => { setTriajes(Array.isArray(r) ? r : []); setLoading(false); });
  }, []);

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              {['Usuario', 'Email', 'Padece enfermedad', 'Apto alto impacto', 'Completado', 'Fecha'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                    {Array(6).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton h="0.875rem" /></td>)}
                  </tr>
                ))
              : triajes.map((t, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{t.nombre}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{t.email}</td>
                    <td className="px-4 py-3"><Badge text={t.padece_enfermedad ? 'Sí' : 'No'} variant={t.padece_enfermedad ? 'red' : 'green'} /></td>
                    <td className="px-4 py-3"><Badge text={t.apto_alto_impacto ? 'Sí' : 'No'} variant={t.apto_alto_impacto ? 'green' : 'amber'} /></td>
                    <td className="px-4 py-3"><Badge text={t.triaje_completado ? '✅ Sí' : '⏳ No'} variant={t.triaje_completado ? 'green' : 'amber'} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {t.fecha_evaluacion ? new Date(t.fecha_evaluacion).toLocaleDateString('es-MX') : '—'}
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
        {!loading && triajes.length === 0 && (
          <div className="text-center py-12 text-gray-400">No hay triajes registrados</div>
        )}
      </div>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════════════
// PANEL PRINCIPAL ADMIN
// ════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const [seccion, setSeccion] = useState('stats');

  const SECCIONES = [
    { id: 'stats',     icon: '📊', label: 'Estadísticas'       },
    { id: 'usuarios',  icon: '👥', label: 'Usuarios'           },
    { id: 'alimentos', icon: '🥦', label: 'Catálogo alimentos' },
    { id: 'ejercicios',icon: '💪', label: 'Catálogo ejercicios'},
    { id: 'triajes',   icon: '📋', label: 'Triajes de salud'   },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center text-white text-xl shadow">
          🛡️
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Panel de Administración</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">Gestión completa del sistema NutriLife</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-2xl overflow-x-auto">
        {SECCIONES.map(s => (
          <button
            key={s.id}
            onClick={() => setSeccion(s.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 flex-shrink-0
              ${seccion === s.id
                ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <span>{s.icon}</span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Contenido */}
      {seccion === 'stats'      && <SeccionStats />}
      {seccion === 'usuarios'   && <SeccionUsuarios />}
      {seccion === 'alimentos'  && <SeccionCatalogo tipo="alimentos" />}
      {seccion === 'ejercicios' && <SeccionCatalogo tipo="ejercicios" />}
      {seccion === 'triajes'    && <SeccionTriajes />}
    </div>
  );
}
