import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const T = {
  bg: '#08090f', surface: '#111111', surface2: '#181818',
  border: '#2a2a2a', border2: '#333333',
  grad: 'linear-gradient(135deg,#e8215a,#8b2fc9,#4a6cf7)',
  text: '#eceef5', text2: '#8890aa', text3: '#4a5068',
  red: '#ff4d6d', redDim: 'rgba(255,77,109,0.1)',
  green: '#3dd68c', greenDim: 'rgba(61,214,140,0.1)',
  radius: '10px', radiusLg: '16px',
  font: "'Inter', -apple-system, sans-serif",
}

const LOGO_URL = 'https://edddvxqlvwgexictsnmn.supabase.co/storage/v1/object/public/Imagenes/Imagen-Corporativa/Temptech_LogoHorizontal.png'

const productos = ['Panel Calefactor Slim','Panel Calefactor Firenze','Calefones','Calderas','Accesorios']

const modelosPorProducto = {
  'Panel Calefactor Slim': ['Panel Calefactor Slim 250W','Panel Calefactor Slim 250W Toallero Simple','Panel Calefactor Slim 250W Toallero Doble','Panel Calefactor Slim 250W Madera Blanca','Panel Calefactor Slim 500W','Panel Calefactor Slim 500W Toallero Simple','Panel Calefactor Slim 500W Toallero Doble','Panel Calefactor Slim 500W Madera Blanca'],
  'Panel Calefactor Firenze': ['Panel Calefactor Firenze 1400W Blanco','Panel Calefactor Firenze 1400W Madera Veteada','Panel Calefactor Firenze 1400W Piedra Azteca','Panel Calefactor Firenze 1400W Piedra Romana','Panel Calefactor Firenze 1400W Marmol Traviata Gris','Panel Calefactor Firenze 1400W Piedra Cantera Luna','Panel Calefactor Firenze 1400W Marmol Calacatta Ocre','Panel Calefactor Firenze 1400W Smart'],
  Calefones: ['One','Nova Gris','Nova Negro','Nova Blanco','Pulse 318','Pulse 324'],
  Calderas: ['Core 14,4','Core 23 380V'],
  Accesorios: ['Barral 250','Barral 500'],
}

const motivosPorProducto = {
  'Panel Calefactor Slim': ['No calienta','Detalle de pintura','Detalle en terminacion','Falla en Tecla','No enciende el led de Tecla','Golpe de transporte','Faltante de Kit o piezas','Falta de patas Firenze','Marco mal terminado','Ruido','Medida barral incorrecta','Cambio comercial','Envío Incorrecto','Otro'],
  'Panel Calefactor Firenze': ['No calienta','Detalle de pintura','Detalle en terminacion','Falla en Tecla','No enciende el led de Tecla','Golpe de transporte','Faltante de Kit o piezas','Falta de patas Firenze','Marco mal terminado','Ruido','Medida barral incorrecta','Cambio comercial','Envío Incorrecto','Otro','No funciona el termostato'],
  Calefones: ['No calienta agua','Pierde agua','Falla eléctrica','Error instalación','Golpe transporte'],
  Calderas: ['No enciende','Falla electrónica','Error instalación','Golpe transporte'],
  Accesorios: ['Medida incorrecta','Golpe transporte','Producto equivocado'],
}

const provincias = ['Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán']
const canales = ['Mercado Libre','Tienda Online','WhatsApp','Distribuidor','Local','Otro']

const emptyForm = {
  fechaIngreso: new Date().toISOString().slice(0, 10),
  nombreApellido: '', direccion: '', localidad: '', provincia: '',
  codigoPostal: '', telefono: '', fechaCompra: '', canal: '',
  vendedor: '', ventaManual: '', producto: '', modelo: '',
  motivo: '', descripcionFalla: '', email: '',
}

function generarTrackingId() {
  const ahora = new Date()
  const y = ahora.getFullYear()
  const m = String(ahora.getMonth() + 1).padStart(2, '0')
  const d = String(ahora.getDate()).padStart(2, '0')
  return `DEV-${y}${m}${d}-${Math.floor(Math.random() * 90000) + 10000}`
}

function sanitizeFileName(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_')
}

async function subirArchivo(file, trackingId, folder) {
  if (!file) return null
  if (file.size > 10 * 1024 * 1024) throw new Error('Cada archivo debe pesar menos de 10 MB.')
  const safeName = sanitizeFileName(file.name)
  const path = `${folder}/${trackingId}/${Date.now()}_${safeName}`
  const { error } = await supabase.storage.from('devoluciones').upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('devoluciones').getPublicUrl(path)
  return data.publicUrl
}

// ── UI helpers ──
const inputStyle = { background: T.surface2, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '10px 14px', color: T.text, fontSize: 14, outline: 'none', width: '100%', fontFamily: T.font, transition: 'border .2s' }

function Label({ children }) {
  return <label style={{ fontSize: 11, fontWeight: 600, color: T.text2, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 6 }}>{children}</label>
}

function Input({ label, span, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, ...(span ? { gridColumn: span } : {}) }}>
      {label && <Label>{label}</Label>}
      <input style={inputStyle} onFocus={e => e.target.style.borderColor = '#4a6cf7'} onBlur={e => e.target.style.borderColor = T.border} {...props} />
    </div>
  )
}

function Select({ label, span, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, ...(span ? { gridColumn: span } : {}) }}>
      {label && <Label>{label}</Label>}
      <select style={{ ...inputStyle, cursor: 'pointer' }} {...props}>{children}</select>
    </div>
  )
}

function Textarea({ label, span, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, ...(span ? { gridColumn: span } : {}) }}>
      {label && <Label>{label}</Label>}
      <textarea style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#4a6cf7'} onBlur={e => e.target.style.borderColor = T.border} {...props} />
    </div>
  )
}

function SectionTitle({ emoji, title }) {
  return (
    <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{title}</span>
    </div>
  )
}

// ── Multi-file upload component ──
function MultiFileInput({ label, span, files, onAdd, onRemove, accept }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...(span ? { gridColumn: span } : {}) }}>
      {label && <Label>{label}</Label>}

      {/* Preview de archivos seleccionados */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
          {files.map((file, idx) => (
            <div key={idx} style={{ background: T.surface2, border: `1px solid ${T.border2}`, borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              {file.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(file)} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} />
              ) : (
                <span style={{ fontSize: 20 }}>📄</span>
              )}
              <span style={{ color: T.text2, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
              <button type="button" onClick={() => onRemove(idx)} style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Botón para agregar más */}
      <label style={{ background: T.surface2, border: `1px dashed ${T.border2}`, borderRadius: T.radius, padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.text2, transition: 'border .2s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#4a6cf7'}
        onMouseLeave={e => e.currentTarget.style.borderColor = T.border2}
      >
        <span style={{ fontSize: 18 }}>📎</span>
        <span>Agregar {files.length > 0 ? 'más archivos' : 'archivos'}</span>
        {files.length > 0 && <span style={{ marginLeft: 'auto', background: 'rgba(74,108,247,0.15)', color: '#7b9fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>{files.length} archivo{files.length !== 1 ? 's' : ''}</span>}
        <input
          type="file"
          accept={accept}
          multiple
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files) onAdd(Array.from(e.target.files)); e.target.value = '' }}
        />
      </label>
    </div>
  )
}

export default function PublicForm() {
  const [form, setForm] = useState(emptyForm)
  // Multi-file arrays
  const [comprobantes, setComprobantes]       = useState([])   // múltiples comprobantes
  const [imagenesProducto, setImagenesProducto] = useState([]) // múltiples fotos del producto
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje]     = useState('')
  const [errorMsg, setErrorMsg]   = useState('')
  const [trackingId, setTrackingId] = useState('')

  const modelos = useMemo(() => modelosPorProducto[form.producto] || [], [form.producto])
  const motivos = useMemo(() => motivosPorProducto[form.producto] || [], [form.producto])

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value, ...(key === 'producto' ? { modelo: '', motivo: '' } : {}) }))

  const addComprobantes   = (files) => setComprobantes(prev => [...prev, ...files])
  const removeComprobante = (idx)   => setComprobantes(prev => prev.filter((_, i) => i !== idx))
  const addImagenes       = (files) => setImagenesProducto(prev => [...prev, ...files])
  const removeImagen      = (idx)   => setImagenesProducto(prev => prev.filter((_, i) => i !== idx))

  const validar = () => {
    if (!form.nombreApellido.trim()) return 'Completá nombre y apellido.'
    if (!form.direccion.trim()) return 'Completá la dirección.'
    if (!form.localidad.trim()) return 'Completá la localidad.'
    if (!form.provincia) return 'Seleccioná la provincia.'
    if (!form.codigoPostal.trim()) return 'Completá el código postal.'
    if (!form.telefono.trim()) return 'Completá el teléfono.'
    if (!form.email.trim()) return 'Completá el email.'
    if (!form.producto) return 'Seleccioná el producto.'
    if (!form.modelo) return 'Seleccioná el modelo.'
    if (!form.motivo) return 'Seleccioná el motivo.'
    if (!form.descripcionFalla.trim()) return 'Describí la falla.'
    return ''
  }

  async function guardar(e) {
    e.preventDefault()
    setMensaje('')
    setErrorMsg('')
    const validacion = validar()
    if (validacion) { setErrorMsg(validacion); return }
    setGuardando(true)

    try {
      const id = generarTrackingId()

      // Subir todos los comprobantes
      const comprobantesUrls = []
      for (const file of comprobantes) {
        const url = await subirArchivo(file, id, 'comprobantes')
        if (url) comprobantesUrls.push(url)
      }

      // Subir todas las imágenes del producto
      const imagenesUrls = []
      for (const file of imagenesProducto) {
        const url = await subirArchivo(file, id, 'productos')
        if (url) imagenesUrls.push(url)
      }

      // Calcular días garantía
      let diasGarantia = null
      if (form.fechaCompra && form.fechaIngreso) {
        const fc = new Date(form.fechaCompra), fi = new Date(form.fechaIngreso)
        if (!isNaN(fc.getTime()) && !isNaN(fi.getTime())) diasGarantia = Math.floor((fi - fc) / (1000 * 60 * 60 * 24))
      }

      const payload = {
        tracking_id: id,
        fecha_ingreso: new Date().toISOString().slice(0, 10),
        nombre_apellido: form.nombreApellido.trim(),
        direccion: form.direccion.trim(),
        localidad: form.localidad.trim(),
        provincia: form.provincia,
        codigo_postal: form.codigoPostal.trim(),
        telefono: form.telefono.trim(),
        fecha_compra: form.fechaCompra || null,
        dias_garantia: diasGarantia,
        canal: form.canal || null,
        vendedor: form.vendedor.trim() || null,
        numero_venta_manual: form.ventaManual.trim() || null,
        // Guardamos la primera URL en el campo original (retrocompatibilidad)
        comprobante_url: comprobantesUrls[0] || null,
        imagen_producto_url: imagenesUrls[0] || null,
        // URLs adicionales en campos JSON (si existen en tu tabla)
        comprobantes_urls: comprobantesUrls,
        imagenes_producto_urls: imagenesUrls,
        producto: form.producto,
        modelo: form.modelo,
        motivo: form.motivo,
        descripcion_falla: form.descripcionFalla.trim(),
        email: form.email.trim(),
        estado: 'Ingresado',
      }

      const { error } = await supabase.from('devoluciones').insert([payload]).select()
      if (error) throw error

      await supabase.functions.invoke('alta-reclamo-email', {
        body: {
          email: form.email.trim(), nombre: form.nombreApellido.trim(), trackingId: id,
          fechaIngreso: form.fechaIngreso, direccion: form.direccion.trim(),
          localidad: form.localidad.trim(), provincia: form.provincia,
          codigoPostal: form.codigoPostal.trim(), telefono: form.telefono.trim(),
          fechaCompra: form.fechaCompra || null, canal: form.canal || null,
          vendedor: form.vendedor.trim() || null, ventaManual: form.ventaManual.trim() || null,
          producto: form.producto, modelo: form.modelo, motivo: form.motivo,
          descripcion: form.descripcionFalla.trim(), diasGarantia,
          comprobanteUrl: comprobantesUrls[0] || null,
          imagenProductoUrl: imagenesUrls[0] || null,
        },
      })

      setTrackingId(id)
      setMensaje(`Solicitud registrada correctamente. Tu ID de seguimiento es ${id}`)
      setForm({ ...emptyForm, fechaIngreso: new Date().toISOString().slice(0, 10) })
      setComprobantes([])
      setImagenesProducto([])
    } catch (err) {
      setErrorMsg(err?.message || 'No se pudo registrar la solicitud.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: '32px 16px', fontFamily: T.font }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={LOGO_URL} alt="TEMPTECH" style={{ height: 42, objectFit: 'contain', marginBottom: 16 }} onError={e => e.currentTarget.style.display = 'none'} />
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: T.text, margin: 0 }}>Portal de Soporte</h1>
          <p style={{ color: T.text2, marginTop: 8, fontSize: 14 }}>Registrá tu solicitud de garantía o devolución</p>
        </div>

        {mensaje && (
          <div style={{ background: T.greenDim, border: `1px solid rgba(61,214,140,0.3)`, color: T.green, padding: '16px 20px', borderRadius: T.radiusLg, marginBottom: 24, fontSize: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>✓ Solicitud registrada</div>
            <div>{mensaje}</div>
            {trackingId && <div style={{ marginTop: 10, background: 'rgba(61,214,140,0.1)', borderRadius: 8, padding: '8px 12px', fontFamily: 'monospace', fontSize: 15, fontWeight: 700 }}>ID: {trackingId}</div>}
          </div>
        )}

        {errorMsg && (
          <div style={{ background: T.redDim, border: `1px solid rgba(255,77,109,0.3)`, color: T.red, padding: '14px 20px', borderRadius: T.radiusLg, marginBottom: 24, fontSize: 14 }}>
            ⚠ {errorMsg}
          </div>
        )}

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, overflow: 'hidden' }}>
          <div style={{ height: 3, background: T.grad }} />
          <form onSubmit={guardar} style={{ padding: 28 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>

              <SectionTitle emoji="👤" title="Datos personales" />
              <Input label="Nombre y Apellido *" value={form.nombreApellido} onChange={e => update('nombreApellido', e.target.value)} placeholder="Juan Pérez" />
              <Input label="Email *" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="tu@email.com" />
              <Input span="1 / -1" label="Dirección *" value={form.direccion} onChange={e => update('direccion', e.target.value)} placeholder="Av. Corrientes 1234" />
              <Input label="Localidad *" value={form.localidad} onChange={e => update('localidad', e.target.value)} placeholder="Buenos Aires" />
              <Select label="Provincia *" value={form.provincia} onChange={e => update('provincia', e.target.value)}>
                <option value="">Seleccionar provincia</option>
                {provincias.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
              <Input label="Código Postal *" value={form.codigoPostal} onChange={e => update('codigoPostal', e.target.value)} placeholder="1000" />
              <Input label="Teléfono *" value={form.telefono} onChange={e => update('telefono', e.target.value)} placeholder="+54 11 1234-5678" />

              <SectionTitle emoji="🛒" title="Datos de compra" />
              <Input label="Fecha de Compra" type="date" value={form.fechaCompra} onChange={e => update('fechaCompra', e.target.value)} />
              <Select label="Canal de compra" value={form.canal} onChange={e => update('canal', e.target.value)}>
                <option value="">Seleccionar canal</option>
                {canales.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Input label="Vendedor" value={form.vendedor} onChange={e => update('vendedor', e.target.value)} placeholder="Nombre del vendedor" />
              <Input span="1 / -1" label="# Venta o Comprobante" placeholder="Podés escribir el número manualmente" value={form.ventaManual} onChange={e => update('ventaManual', e.target.value)} />

              {/* Multi-file: comprobantes */}
              <MultiFileInput
                span="1 / -1"
                label="Comprobantes de compra (podés subir varios)"
                accept="image/*,.pdf"
                files={comprobantes}
                onAdd={addComprobantes}
                onRemove={removeComprobante}
              />

              <SectionTitle emoji="📦" title="Datos del producto" />
              <Select label="Producto *" value={form.producto} onChange={e => update('producto', e.target.value)}>
                <option value="">Seleccionar producto</option>
                {productos.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
              <Select label="Modelo *" value={form.modelo} onChange={e => update('modelo', e.target.value)} disabled={!form.producto}>
                <option value="">{form.producto ? 'Seleccionar modelo' : 'Elegí primero el producto'}</option>
                {modelos.map(m => <option key={m} value={m}>{m}</option>)}
              </Select>
              <Select span="1 / -1" label="Motivo *" value={form.motivo} onChange={e => update('motivo', e.target.value)} disabled={!form.producto}>
                <option value="">{form.producto ? 'Seleccionar motivo' : 'Elegí primero el producto'}</option>
                {motivos.map(m => <option key={m} value={m}>{m}</option>)}
              </Select>
              <Textarea span="1 / -1" label="Descripción de la falla *" value={form.descripcionFalla} onChange={e => update('descripcionFalla', e.target.value)} placeholder="Describí el problema con el mayor detalle posible..." />

              {/* Multi-file: imágenes del producto */}
              <MultiFileInput
                span="1 / -1"
                label="Fotos del producto (podés subir varias)"
                accept="image/*,.pdf"
                files={imagenesProducto}
                onAdd={addImagenes}
                onRemove={removeImagen}
              />

              <div style={{ gridColumn: '1 / -1', borderTop: `1px solid ${T.border}`, paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontSize: 13, color: T.text3 }}>
                  Fecha de ingreso: <span style={{ color: T.text2, fontWeight: 500 }}>{form.fechaIngreso.split('-').reverse().join('/')}</span>
                </div>
                <button type="submit" disabled={guardando} style={{ background: guardando ? T.surface2 : T.grad, border: 'none', borderRadius: T.radius, padding: '12px 32px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.7 : 1, fontFamily: T.font, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {guardando && <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                  {guardando ? 'Registrando...' : 'Registrar solicitud'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: T.text3 }}>
          © {new Date().getFullYear()} TEMPTECH · Soporte al Cliente
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: ${T.text3}; }
        select option { background: ${T.surface2}; color: ${T.text}; }
      `}</style>
    </div>
  )
}
