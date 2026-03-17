import React, { useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const productos = [
  'Panel Calefactor Slim',
  'Panel Calefactor Firenze',
  'Calefones',
  'Calderas',
  'Accesorios',
];

const modelosPorProducto = {
  'Panel Calefactor Slim': [
    '250W',
    '250W TS',
    '250W TD',
    '250W MB',
    '500W',
    '500W TS',
    '500W TD',
    '500W MB',
  ],
  'Panel Calefactor Firenze': [
    '1400W BL',
    '1400W MV',
    '1400W PA',
    '1400W PR',
    '1400W MTV',
    '1400W PCL',
    '1400W MCO',
    '1400W Smart',
  ],
  Calefones: ['One', 'Nova Gris', 'Nova Negro', 'Nova Blanco', 'Pulse 318', 'Pulse 324'],
  Calderas: ['Core 14,4', 'Core 23 380V'],
  Accesorios: ['Barral 250', 'Barral 500'],
};

const motivosPorProducto = {
  'Panel Calefactor Slim': [
    'No calienta',
    'Calienta poco',
    'Falla eléctrica',
    'Golpe transporte',
    'Error instalación',
    'Ruido',
  ],
  'Panel Calefactor Firenze': [
    'No calienta',
    'Calienta poco',
    'Falla eléctrica',
    'Golpe transporte',
    'Error instalación',
    'Ruido',
  ],
  Calefones: [
    'No calienta agua',
    'Pierde agua',
    'Falla eléctrica',
    'Error instalación',
    'Golpe transporte',
  ],
  Calderas: [
    'No enciende',
    'Falla electrónica',
    'Error instalación',
    'Golpe transporte',
  ],
  Accesorios: ['Medida incorrecta', 'Golpe transporte', 'Producto equivocado'],
};

const provincias = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

const canales = [
  'Mercado Libre',
  'Tienda Online',
  'WhatsApp',
  'Distribuidor',
  'Local',
  'Otro',
];

const emptyForm = {
  fechaIngreso: new Date().toISOString().slice(0, 10),
  nombreApellido: '',
  direccion: '',
  localidad: '',
  provincia: '',
  codigoPostal: '',
  telefono: '',
  fechaCompra: '',
  canal: '',
  vendedor: '',
  ventaManual: '',
  producto: '',
  modelo: '',
  motivo: '',
  descripcionFalla: '',
  email: '',
};

function generarTrackingId() {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `DEV-${y}${m}${d}-${rand}`;
}

function sanitizeFileName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function subirArchivo(file, trackingId, folder) {
  if (!supabase || !file) return null;

  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('Cada archivo debe pesar menos de 10 MB.');
  }

  const safeName = sanitizeFileName(file.name);
  const path = `${folder}/${trackingId}/${Date.now()}_${safeName}`;

  const { error } = await supabase.storage
    .from('devoluciones')
    .upload(path, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from('devoluciones').getPublicUrl(path);
  return data.publicUrl;
}

export default function App() {
  const [form, setForm] = useState(emptyForm);
  const [comprobante, setComprobante] = useState(null);
  const [imagenProducto, setImagenProducto] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [enviado, setEnviado] = useState(false);

  const modelos = useMemo(() => modelosPorProducto[form.producto] || [], [form.producto]);
  const motivos = useMemo(() => motivosPorProducto[form.producto] || [], [form.producto]);

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'producto' ? { modelo: '', motivo: '' } : {}),
    }));
  };

  const validar = () => {
    if (!form.fechaIngreso) return 'Completá la fecha de ingreso.';
    if (!form.nombreApellido.trim()) return 'Completá nombre y apellido.';
    if (!form.direccion.trim()) return 'Completá la dirección.';
    if (!form.localidad.trim()) return 'Completá la localidad.';
    if (!form.provincia) return 'Seleccioná la provincia.';
    if (!form.codigoPostal.trim()) return 'Completá el código postal.';
    if (!form.telefono.trim()) return 'Completá el teléfono.';
    if (!form.email.trim()) return 'Completá el email.';
    if (!form.producto) return 'Seleccioná el producto.';
    if (!form.modelo) return 'Seleccioná el modelo.';
    if (!form.motivo) return 'Seleccioná el motivo.';
    if (!form.descripcionFalla.trim()) return 'Describí la falla.';
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setEnviado(false);

    const validacion = validar();
    if (validacion) {
      setErrorMsg(validacion);
      return;
    }

    if (!supabase) {
      setErrorMsg('Faltan las variables de entorno de Supabase.');
      return;
    }

    setGuardando(true);

    try {
      const id = generarTrackingId();

      const comprobanteUrl = await subirArchivo(comprobante, id, 'comprobantes');
      const imagenProductoUrl = await subirArchivo(imagenProducto, id, 'productos');

      const payload = {
        tracking_id: id,
        fecha_ingreso: form.fechaIngreso,
        nombre_apellido: form.nombreApellido.trim(),
        direccion: form.direccion.trim(),
        localidad: form.localidad.trim(),
        provincia: form.provincia,
        codigo_postal: form.codigoPostal.trim(),
        telefono: form.telefono.trim(),
        fecha_compra: form.fechaCompra || null,
        canal: form.canal || null,
        vendedor: form.vendedor.trim() || null,
        numero_venta_manual: form.ventaManual.trim() || null,
        comprobante_url: comprobanteUrl,
        producto: form.producto,
        modelo: form.modelo,
        motivo: form.motivo,
        descripcion_falla: form.descripcionFalla.trim(),
        imagen_producto_url: imagenProductoUrl,
        email: form.email.trim(),
        estado: 'Ingresado',
      };

      const { error } = await supabase.from('devoluciones').insert(payload);
      if (error) throw error;

      setTrackingId(id);
      setEnviado(true);
      setForm({
        ...emptyForm,
        fechaIngreso: new Date().toISOString().slice(0, 10),
      });
      setComprobante(null);
      setImagenProducto(null);
    } catch (err) {
      setErrorMsg(err?.message || 'No se pudo registrar la solicitud.');
    } finally {
      setGuardando(false);
    }
  };

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#f4f6f8',
      padding: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
    },
    container: {
      maxWidth: '980px',
      margin: '0 auto',
      background: '#ffffff',
      borderRadius: '16px',
      padding: '28px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    },
    title: {
      margin: 0,
      fontSize: '30px',
    },
    subtitle: {
      marginTop: '8px',
      color: '#6b7280',
    },
    alertError: {
      background: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#991b1b',
      padding: '14px',
      borderRadius: '12px',
      marginBottom: '18px',
    },
    alertOk: {
      background: '#ecfdf5',
      border: '1px solid #a7f3d0',
      color: '#065f46',
      padding: '14px',
      borderRadius: '12px',
      marginBottom: '18px',
    },
    form: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: '16px',
    },
    full: {
      gridColumn: '1 / -1',
    },
    field: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    },
    label: {
      fontWeight: 600,
      fontSize: '14px',
    },
    input: {
      padding: '12px 14px',
      borderRadius: '10px',
      border: '1px solid #d1d5db',
      fontSize: '14px',
      outline: 'none',
    },
    textarea: {
      padding: '12px 14px',
      borderRadius: '10px',
      border: '1px solid #d1d5db',
      fontSize: '14px',
      minHeight: '120px',
      resize: 'vertical',
      outline: 'none',
    },
    fileBox: {
      border: '1px dashed #cbd5e1',
      borderRadius: '10px',
      padding: '12px',
      background: '#fafafa',
    },
    buttonRow: {
      gridColumn: '1 / -1',
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: '8px',
    },
    button: {
      background: '#111827',
      color: '#fff',
      border: 'none',
      borderRadius: '12px',
      padding: '13px 22px',
      fontSize: '14px',
      cursor: guardando ? 'not-allowed' : 'pointer',
      opacity: guardando ? 0.7 : 1,
    },
    small: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '4px',
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Portal de devoluciones TempTech</h1>
        <p style={styles.subtitle}>
          Carga inicial de reclamos con adjuntos, ID automático y registro en base de datos.
        </p>

        {errorMsg ? <div style={styles.alertError}>{errorMsg}</div> : null}

        {enviado ? (
          <div style={styles.alertOk}>
            Solicitud registrada correctamente. Tu ID de seguimiento es{' '}
            <strong>{trackingId}</strong>
          </div>
        ) : null}

        <form onSubmit={onSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Fecha ingreso</label>
            <input
              style={styles.input}
              type="date"
              value={form.fechaIngreso}
              onChange={(e) => update('fechaIngreso', e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Nombre y Apellido</label>
            <input
              style={styles.input}
              type="text"
              value={form.nombreApellido}
              onChange={(e) => update('nombreApellido', e.target.value)}
            />
          </div>

          <div style={{ ...styles.field, ...styles.full }}>
            <label style={styles.label}>Dirección</label>
            <input
              style={styles.input}
              type="text"
              value={form.direccion}
              onChange={(e) => update('direccion', e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Localidad</label>
            <input
              style={styles.input}
              type="text"
              value={form.localidad}
              onChange={(e) => update('localidad', e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Provincia</label>
            <select
              style={styles.input}
              value={form.provincia}
              onChange={(e) => update('provincia', e.target.value)}
            >
              <option value="">Seleccionar provincia</option>
              {provincias.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Código Postal</label>
            <input
              style={styles.input}
              type="text"
              value={form.codigoPostal}
              onChange={(e) => update('codigoPostal', e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Teléfono</label>
            <input
              style={styles.input}
              type="text"
              value={form.telefono}
              onChange={(e) => update('telefono', e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Fecha de Compra</label>
            <input
              style={styles.input}
              type="date"
              value={form.fechaCompra}
              onChange={(e) => update('fechaCompra', e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Canal</label>
            <select
              style={styles.input}
              value={form.canal}
              onChange={(e) => update('canal', e.target.value)}
            >
              <option value="">Seleccionar canal</option>
              {canales.map((canal) => (
                <option key={canal} value={canal}>
                  {canal}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Vendedor</label>
            <input
              style={styles.input}
              type="text"
              value={form.vendedor}
              onChange={(e) => update('vendedor', e.target.value)}
            />
          </div>

          <div style={{ ...styles.field, ...styles.full }}>
            <label style={styles.label}># Venta o Comprobante</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Podés escribir el número manualmente"
              value={form.ventaManual}
              onChange={(e) => update('ventaManual', e.target.value)}
            />
            <div style={styles.fileBox}>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setComprobante(e.target.files?.[0] || null)}
              />
              {comprobante ? (
                <div style={styles.small}>Archivo seleccionado: {comprobante.name}</div>
              ) : null}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Producto</label>
            <select
              style={styles.input}
              value={form.producto}
              onChange={(e) => update('producto', e.target.value)}
            >
              <option value="">Seleccionar producto</option>
              {productos.map((producto) => (
                <option key={producto} value={producto}>
                  {producto}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Modelo</label>
            <select
              style={styles.input}
              value={form.modelo}
              onChange={(e) => update('modelo', e.target.value)}
              disabled={!form.producto}
            >
              <option value="">
                {form.producto ? 'Seleccionar modelo' : 'Elegí primero el producto'}
              </option>
              {modelos.map((modelo) => (
                <option key={modelo} value={modelo}>
                  {modelo}
                </option>
              ))}
            </select>
          </div>

          <div style={{ ...styles.field, ...styles.full }}>
            <label style={styles.label}>Motivo</label>
            <select
              style={styles.input}
              value={form.motivo}
              onChange={(e) => update('motivo', e.target.value)}
              disabled={!form.producto}
            >
              <option value="">
                {form.producto ? 'Seleccionar motivo' : 'Elegí primero el producto'}
              </option>
              {motivos.map((motivo) => (
                <option key={motivo} value={motivo}>
                  {motivo}
                </option>
              ))}
            </select>
          </div>

          <div style={{ ...styles.field, ...styles.full }}>
            <label style={styles.label}>Descripción de Falla</label>
            <textarea
              style={styles.textarea}
              value={form.descripcionFalla}
              onChange={(e) => update('descripcionFalla', e.target.value)}
            />
          </div>

          <div style={{ ...styles.field, ...styles.full }}>
            <label style={styles.label}>Adjuntar Imagen Producto</label>
            <div style={styles.fileBox}>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setImagenProducto(e.target.files?.[0] || null)}
              />
              {imagenProducto ? (
                <div style={styles.small}>
                  Archivo seleccionado: {imagenProducto.name}
                </div>
              ) : null}
            </div>
          </div>

          <div style={styles.buttonRow}>
            <button type="submit" style={styles.button} disabled={guardando}>
              {guardando ? 'Registrando...' : 'Registrar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
