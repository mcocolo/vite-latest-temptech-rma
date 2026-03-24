import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const productos = [
  'Panel Calefactor Slim',
  'Panel Calefactor Firenze',
  'Calefones',
  'Calderas',
  'Accesorios',
]

const modelosPorProducto = {
  'Panel Calefactor Slim': [
    'Panel Calefactor Slim 250W',
    'Panel Calefactor Slim 250W Toallero Simple',
    'Panel Calefactor Slim 250W Toallero Doble',
    'Panel Calefactor Slim 250W Madera Blanca',
    'Panel Calefactor Slim 500W',
    'Panel Calefactor Slim 500W Toallero Simple',
    'Panel Calefactor Slim500W Toallero Doble',
    'Panel Calefactor Slim 500W Madera Blanca',
  ],
  'Panel Calefactor Firenze': [
    'Panel Calefactor Firenze 1400W Blanco',
    'Panel Calefactor Firenze 1400W Madera Veteada',
    'Panel Calefactor Firenze 1400W Piedra Azteca',
    'Panel Calefactor Firenze 1400W Piedra Romana',
    'Panel Calefactor Firenze 1400W Marmol Traviata Gris',
    'Panel Calefactor Firenze 1400W Piedra Cantera Luna',
    'Panel Calefactor Firenze 1400W Marmol Calacatta Ocre',
    'Panel Calefactor Firenze 1400W Smart',
  ],
  Calefones: ['One', 'Nova Gris', 'Nova Negro', 'Nova Blanco', 'Pulse 318', 'Pulse 324'],
  Calderas: ['Core 14,4', 'Core 23 380V'],
  Accesorios: ['Barral 250', 'Barral 500'],
}

const motivosPorProducto = {
  'Panel Calefactor Slim': [
    'No calienta',
    'Detalle de pintura',
    'Detalle en terminacion',
    'Falla en Tecla',
    'No enciende el led de Tecla',
    'Golpe de transporte',
    'Faltante de Kit o piezas',
    'Falta de patas Firenze',
    'Marco mal terminado',
    'Ruido',
    'Medida barral incorrecta',
    'Cambio comercial',
    'Envío Incorrecto',
    'Otro',
  ],
  'Panel Calefactor Firenze': [
    'No calienta',
    'Detalle de pintura',
    'Detalle en terminacion',
    'Falla en Tecla',
    'No enciende el led de Tecla',
    'Golpe de transporte',
    'Faltante de Kit o piezas',
    'Falta de patas Firenze',
    'Marco mal terminado',
    'Ruido',
    'Medida barral incorrecta',
    'Cambio comercial',
    'Envío Incorrecto',
    'Otro',
    'No funciona el termostato',
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
}

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
]

const canales = [
  'Mercado Libre',
  'Tienda Online',
  'WhatsApp',
  'Distribuidor',
  'Local',
  'Otro',
]

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
}

function generarTrackingId() {
  const ahora = new Date()
  const y = ahora.getFullYear()
  const m = String(ahora.getMonth() + 1).padStart(2, '0')
  const d = String(ahora.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 90000) + 10000
  return `DEV-${y}${m}${d}-${rand}`
}

function sanitizeFileName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
}

async function subirArchivo(file, trackingId, folder) {
  if (!file) return null

  const maxBytes = 10 * 1024 * 1024
  if (file.size > maxBytes) {
    throw new Error('Cada archivo debe pesar menos de 10 MB.')
  }

  const safeName = sanitizeFileName(file.name)
  const path = `${folder}/${trackingId}/${Date.now()}_${safeName}`

  const { error } = await supabase.storage
    .from('devoluciones')
    .upload(path, file, { upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from('devoluciones').getPublicUrl(path)
  return data.publicUrl
}

export default function PublicForm() {
  const [form, setForm] = useState(emptyForm)
  const [comprobante, setComprobante] = useState(null)
  const [imagenProducto, setImagenProducto] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [trackingId, setTrackingId] = useState('')

  const modelos = useMemo(() => modelosPorProducto[form.producto] || [], [form.producto])
  const motivos = useMemo(() => motivosPorProducto[form.producto] || [], [form.producto])

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'producto' ? { modelo: '', motivo: '' } : {}),
    }))
  }

  const validar = () => {
    if (!form.fechaIngreso) return 'Completá la fecha de ingreso.'
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
  if (validacion) {
    setErrorMsg(validacion)
    return
  }

  setGuardando(true)

  try {
    const id = generarTrackingId()
    console.log('STEP 1 - ID generado:', id)

    let comprobanteUrl = null
    let imagenProductoUrl = null

    if (comprobante) {
      console.log('STEP 2 - Subiendo comprobante...')
      try {
        comprobanteUrl = await subirArchivo(comprobante, id, 'comprobantes')
        console.log('STEP 2 OK - comprobanteUrl:', comprobanteUrl)
      } catch (err) {
        console.error('STEP 2 ERROR:', err)
        alert('ERROR SUBIENDO COMPROBANTE:\n' + JSON.stringify(err, null, 2))
        throw err
      }
    }

    if (imagenProducto) {
      console.log('STEP 3 - Subiendo imagen producto...')
      try {
        imagenProductoUrl = await subirArchivo(imagenProducto, id, 'productos')
        console.log('STEP 3 OK - imagenProductoUrl:', imagenProductoUrl)
      } catch (err) {
        console.error('STEP 3 ERROR:', err)
        alert('ERROR SUBIENDO IMAGEN:\n' + JSON.stringify(err, null, 2))
        throw err
      }
    }

    let diasGarantia = null
    if (form.fechaCompra && form.fechaIngreso) {
      const fechaCompra = new Date(form.fechaCompra)
      const fechaReclamo = new Date(form.fechaIngreso)

      if (!isNaN(fechaCompra.getTime()) && !isNaN(fechaReclamo.getTime())) {
        diasGarantia = Math.floor(
          (fechaReclamo - fechaCompra) / (1000 * 60 * 60 * 24)
        )
      }
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
      comprobante_url: comprobanteUrl,
      producto: form.producto,
      modelo: form.modelo,
      motivo: form.motivo,
      descripcion_falla: form.descripcionFalla.trim(),
      imagen_producto_url: imagenProductoUrl,
      email: form.email.trim(),
      estado: 'Ingresado',
    }

    console.log('STEP 4 - INSERTANDO:', payload)

    const { data, error } = await supabase
      .from('devoluciones')
      .insert([payload])
      .select()

    if (error) {
      console.error('STEP 4 ERROR:', error)
      alert('ERROR INSERT TABLA:\n' + JSON.stringify(error, null, 2))
      throw error
    }

    console.log('STEP 4 OK:', data)

    const { data: emailData, error: emailError } = await supabase.functions.invoke(
      'alta-reclamo-email',
      {
        body: {
          email: form.email.trim(),
          nombre: form.nombreApellido.trim(),
          trackingId: id,
          fechaIngreso: form.fechaIngreso,
          direccion: form.direccion.trim(),
          localidad: form.localidad.trim(),
          provincia: form.provincia,
          codigoPostal: form.codigoPostal.trim(),
          telefono: form.telefono.trim(),
          fechaCompra: form.fechaCompra || null,
          canal: form.canal || null,
          vendedor: form.vendedor.trim() || null,
          ventaManual: form.ventaManual.trim() || null,
          producto: form.producto,
          modelo: form.modelo,
          motivo: form.motivo,
          descripcion: form.descripcionFalla.trim(),
          diasGarantia: diasGarantia,
          comprobanteUrl: comprobanteUrl,
          imagenProductoUrl: imagenProductoUrl,
        },
      }
    )

    console.log('STEP 5 emailData:', emailData)
    console.log('STEP 5 emailError:', emailError)

    setTrackingId(id)
    setMensaje(`Solicitud registrada correctamente. Tu ID es ${id}`)

    setForm({
      ...emptyForm,
      fechaIngreso: new Date().toISOString().slice(0, 10),
    })

    setComprobante(null)
    setImagenProducto(null)

  } catch (err) {
    console.error('ERROR FINAL:', err)
    setErrorMsg(err?.message || 'No se pudo registrar la solicitud.')
  } finally {
    setGuardando(false)
  }
}

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f8', padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <div
        style={{
          maxWidth: 980,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 16,
          padding: 28,
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 30 }}>Portal de devoluciones TempTech</h1>
        <p style={{ marginTop: 8, color: '#6b7280' }}>
          Carga inicial de reclamos con adjuntos, ID automático y registro en base de datos.
        </p>

        {errorMsg ? (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: 14,
              borderRadius: 12,
              marginBottom: 18,
            }}
          >
            {errorMsg}
          </div>
        ) : null}

        {mensaje ? (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              padding: 14,
              borderRadius: 12,
              marginBottom: 18,
            }}
          >
            {mensaje}
          </div>
        ) : null}

        <form
          onSubmit={guardar}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 16,
          }}
        >
 <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
  <label style={{ fontWeight: 500 }}>Fecha ingreso</label>
  <input
    type="text"
    value={form.fechaIngreso.split('-').reverse().join('/')}
    readOnly
    style={{
      padding: '12px 14px',
      borderRadius: 10,
      border: '1px solid #d1d5db',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      width: '220px',
    }}
  />
</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label>Nombre y Apellido</label>
            <input
              type="text"
              value={form.nombreApellido}
              onChange={(e) => update('nombreApellido', e.target.value)}
              style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label>Dirección</label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => update('direccion', e.target.value)}
              style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label>Localidad</label>
            <input
              type="text"
              value={form.localidad}
              onChange={(e) => update('localidad', e.target.value)}
              style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label>Provincia</label>
            <select
              value={form.provincia}
              onChange={(e) => update('provincia', e.target.value)}
              style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}
            >
              <option value="">Seleccionar provincia</option>
              {provincias.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label>Código Postal</label>
            <input
              type="text"
              value={form.codigoPostal}
              onChange={(e) => update('codigoPostal', e.target.value)}
              style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label>Teléfono</label>
            <input
              type="text"
              value={form.telefono}
              onChange={(e) => update('telefono', e.target.value)}
              style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label>Fecha de Compra</label>
            <input
              type="date"
              value={form.fechaCompra}
              onChange={(e) => update('fechaCompra', e.target.value)}
              style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label>Canal</label>
            <select
              value={form.canal}
              onChange={(e) => update('canal', e.target.value)}
              style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}
            >
              <option value="">Seleccionar canal</option>
              {canales.map((canal) => (
                <option key={canal} value={canal}>
                  {canal}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label>Vendedor</label>
            <input
              type="text"
              value={form.vendedor}
              onChange={(e) => update('vendedor', e.target.value)}
              style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label># Venta o Comprobante</label>
            <input
              type="text"
              placeholder="Podés escribir el número manualmente"
              value={form.ventaManual}
              onChange={(e) => update('ventaManual', e.target.value)}
              style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}
            />
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setComprobante(e.target.files?.[0] || null)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label>Producto</label>
            <select
              value={form.producto}
              onChange={(e) => update('producto', e.target.value)}
              style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}
            >
              <option value="">Seleccionar producto</option>
              {productos.map((producto) => (
                <option key={producto} value={producto}>
                  {producto}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label>Modelo</label>
            <select
              value={form.modelo}
              onChange={(e) => update('modelo', e.target.value)}
              disabled={!form.producto}
              style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}
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

          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label>Motivo</label>
            <select
              value={form.motivo}
              onChange={(e) => update('motivo', e.target.value)}
              disabled={!form.producto}
              style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}
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

          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label>Descripción de Falla</label>
            <textarea
              value={form.descripcionFalla}
              onChange={(e) => update('descripcionFalla', e.target.value)}
              style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', minHeight: 120 }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label>Adjuntar Imagen Producto</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setImagenProducto(e.target.files?.[0] || null)}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="submit"
              disabled={guardando}
              style={{
                background: '#111827',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '13px 22px',
                cursor: guardando ? 'not-allowed' : 'pointer',
                opacity: guardando ? 0.7 : 1,
              }}
            >
              {guardando ? 'Registrando...' : 'Registrar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}