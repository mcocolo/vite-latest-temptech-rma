import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function formatearFecha(fecha) {
  if (!fecha) return '-'
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return fecha

  return d.toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function AdminList() {
  const [datos, setDatos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('Ingresado')
  const [errorTexto, setErrorTexto] = useState('')
  const [rechazoAbiertoId, setRechazoAbiertoId] = useState(null)
  const [textoRechazo, setTextoRechazo] = useState('')

  const [resolucionAbiertaId, setResolucionAbiertaId] = useState(null)
  const [empresaEnvio, setEmpresaEnvio] = useState('Correo Argentino')
  const [codigoSeguimiento, setCodigoSeguimiento] = useState('')
  const [fechaEnvio, setFechaEnvio] = useState('')

  async function cargar() {
    setCargando(true)
    setErrorTexto('')

    let query = supabase
      .from('devoluciones')
      .select('*')
      .order('fecha_creacion', { ascending: false })

    if (filtroEstado !== 'todos') {
      query = query.eq('estado', filtroEstado)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error al cargar devoluciones:', error)
      setErrorTexto(error.message || 'Error al leer reclamos')
      setDatos([])
    } else {
      setDatos(data || [])
    }

    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [filtroEstado])

  async function cambiarEstado(item, nuevoEstado) {
    const payload = { estado: nuevoEstado }

    if (nuevoEstado !== 'rechazado') {
      payload.motivo_rechazo = null
    }

    const { error } = await supabase
      .from('devoluciones')
      .update(payload)
      .eq('id', item.id)

    if (error) {
      console.error('Error al actualizar estado:', error)
      alert('No se pudo actualizar el estado')
      return
    }

    await cargar()
  }

    async function marcarAprobado(item, valor) {
  const payload = {
    aprobado: valor,
    fecha_aprobado: new Date().toISOString(),
  }

  if (valor === 'SI') {
    payload.estado = 'pendiente'
  }

  const { error } = await supabase
    .from('devoluciones')
    .update(payload)
    .eq('id', item.id)

  if (error) {
    console.error('Error al actualizar aprobado:', error)
    alert('No se pudo actualizar el aprobado')
    return
  }

  // 👇 DEBUG (MUY IMPORTANTE)
  console.log('APROBANDO CASO:', {
    email: item.email,
    nombre: item.nombre,
    apellido: item.apellido,
  })

  // 👇 ACA VA EL FETCH
 if (valor === 'SI') {
  try {
    const resp = await fetch('/api/enviar-aprobado', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: (item.email || '').trim(),
        nombre: item.nombre || '',
        apellido: item.apellido || '',
      }),
    })

    const data = await resp.json().catch(() => ({}))
    console.log('RESPUESTA API APROBADO:', data)

if (!resp.ok) {
  alert(`Error mail aprobado: ${JSON.stringify(data.detalle || data.error || data, null, 2)}`)
}
  } catch (err) {
    console.error('ERROR FETCH APROBADO:', err)
    alert('Se aprobó, pero falló el envío del mail')
  }
}

  // 👇 ESTO SIEMPRE AL FINAL
  await cargar()
}

  async function rechazarCaso(item) {
    if (!textoRechazo.trim()) {
      alert('Tenés que indicar el motivo de rechazo')
      return
    }

    const { error } = await supabase
      .from('devoluciones')
      .update({
        estado: 'rechazado',
        motivo_rechazo: textoRechazo.trim(),
      })
      .eq('id', item.id)

    if (error) {
      console.error('Error al rechazar caso:', error)
      alert('No se pudo rechazar el caso')
      return
    }

    setTextoRechazo('')
    setRechazoAbiertoId(null)
    await cargar()
  }

  function abrirResolucion(item) {
    setResolucionAbiertaId(item.id)
    setEmpresaEnvio(item.empresa_envio || 'Correo Argentino')
    setCodigoSeguimiento(item.codigo_seguimiento || '')
    setFechaEnvio(item.fecha_envio || '')
  }

  function obtenerLinkSeguimiento(empresa) {
    if (empresa === 'Correo Argentino') {
      return 'https://www.correoargentino.com.ar/formularios/e-commerce'
    }

    if (empresa === 'Andreani') {
      return 'https://www.andreani.com/?tab=seguir-envio'
    }

    return ''
  }

  async function enviarEmailResolucion(item) {
    if (!item.email) {
      alert('Este reclamo no tiene email cargado')
      return false
    }

    let cuerpo = ''

    if (empresaEnvio !== 'Logistica Propia') {
      cuerpo = `Nos contactamos de TEMPTECH por el reclamo "${item.tracking_id}".

Primero que nada queremos pedirle disculpas por los inconvenientes ocasionados. A continuación le dejamos los datos para el seguimiento de su envío.

Empresa: ${empresaEnvio}
Código de seguimiento: ${codigoSeguimiento}
Link de seguimiento: ${obtenerLinkSeguimiento(empresaEnvio)}`
    } else {
      cuerpo = `Nos contactamos de TEMPTECH por el reclamo "${item.tracking_id}".

Primero que nada queremos pedirle disculpas por los inconvenientes ocasionados. A continuación le dejamos los datos para el seguimiento de su envío.

Empresa: Logistica Propia
Fecha de envío: ${fechaEnvio}`
    }

    try {
      const { data, error } = await supabase.functions.invoke('enviar-email-resolucion', {
        body: {
          to: String(item.email || '').trim(),
          subject: `TEMPTECH - Resolución de reclamo ${item.tracking_id}`,
          text: cuerpo,
          empresa: empresaEnvio,
          tracking: empresaEnvio === 'Logistica Propia' ? '' : codigoSeguimiento,
          fecha: empresaEnvio === 'Logistica Propia' ? fechaEnvio : '',
        },
      })

      if (error) {
        alert(`Error al enviar email: ${error.message || JSON.stringify(error)}`)
        return false
      }

      if (data?.error) {
        alert(`Error función email: ${JSON.stringify(data)}`)
        return false
      }

      return true
    } catch (err) {
      alert(`Error inesperado al enviar email: ${err.message || JSON.stringify(err)}`)
      return false
    }
  }

  const guardarResolucion = async (item) => {
    if (!empresaEnvio) {
      alert('Seleccioná una empresa')
      return
    }

    if (empresaEnvio !== 'Logistica Propia' && !codigoSeguimiento) {
      alert('Ingresá el código de seguimiento')
      return
    }

    if (empresaEnvio === 'Logistica Propia' && !fechaEnvio) {
      alert('Seleccioná una fecha de envío')
      return
    }

    try {
      const { error } = await supabase
        .from('devoluciones')
        .update({
          estado: 'Resolucion',
          empresa_envio: empresaEnvio,
          codigo_seguimiento: empresaEnvio === 'Logistica Propia' ? null : codigoSeguimiento,
          fecha_envio: empresaEnvio === 'Logistica Propia' ? fechaEnvio : null,
          fecha_resolucion: new Date().toISOString(),
        })
        .eq('id', item.id)

      if (error) {
        alert('Error al guardar resolución')
        console.error(error)
        return
      }

      const okEmail = await enviarEmailResolucion(item)

      if (!okEmail) {
        alert('Se guardó la resolución pero falló el envío del email')
        return
      }

      await cargar()

      setEmpresaEnvio('Correo Argentino')
      setCodigoSeguimiento('')
      setFechaEnvio('')
      setResolucionAbiertaId(null)

      alert('Resolución guardada y email enviado ✅')
    } catch (err) {
      console.error(err)
      alert('Error inesperado')
    }
  }

  return (
    <div style={{ padding: 30, fontFamily: 'Arial, sans-serif' }}>
      <h1>Panel Admin - Reclamos</h1>

      <div style={{ marginBottom: 20 }}>
        <label style={{ marginRight: 10 }}>Filtrar por estado:</label>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="Ingresado">Ingresado</option>
          <option value="pendiente">Pendiente</option>
          <option value="resolucion">Resolución</option>
          <option value="rechazado">Rechazado</option>
          <option value="cerrado">Cerrado</option>
        </select>
      </div>

      {errorTexto && (
        <div style={{ marginBottom: 20, color: 'red', fontWeight: 'bold' }}>
          Error: {errorTexto}
        </div>
      )}

      {cargando ? (
        <p>Cargando reclamos...</p>
      ) : datos.length === 0 ? (
        <p>No hay reclamos para mostrar.</p>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {datos.map((item) => (
            <div
              key={item.id}
              style={{
                position: 'relative',
                overflow: 'hidden',
                border: item.aprobado === 'SI' ? '2px solid #2e7d32' : '1px solid #ccc',
                borderRadius: 10,
                padding: 16,
                backgroundColor: '#fff',
              }}
            >
              {item.aprobado === 'SI' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-25deg)',
                    fontSize: 54,
                    fontWeight: 800,
                    color: 'rgba(46, 125, 50, 0.12)',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    zIndex: 0,
                  }}
                >
                  APROBADO
                </div>
              )}

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ marginBottom: 6 }}>
                  <strong>ID:</strong> {item.id || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Tracking:</strong> {item.tracking_id || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Fecha ingreso:</strong> {formatearFecha(item.fecha_ingreso)}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Fecha creación:</strong> {formatearFecha(item.fecha_creacion)}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Cliente:</strong> {item.nombre_apellido || item.nombre || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Dirección:</strong> {item.direccion || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Localidad:</strong> {item.localidad || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Provincia:</strong> {item.provincia || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Código postal:</strong> {item.codigo_postal || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Teléfono:</strong> {item.telefono || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Email:</strong> {item.email || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Fecha compra:</strong> {formatearFecha(item.fecha_compra)}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Canal:</strong> {item.canal || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Vendedor:</strong> {item.vendedor || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Número venta manual:</strong> {item.numero_venta_manual || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Producto:</strong> {item.producto || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Modelo:</strong> {item.modelo || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Motivo:</strong> {item.motivo || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Descripción de falla:</strong> {item.descripcion_falla || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Estado:</strong> {item.estado || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Aprobado:</strong> {item.aprobado || 'NO'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Fecha aprobado:</strong> {formatearFecha(item.fecha_aprobado)}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Garantía:</strong> {item.garantia || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Motivo rechazo:</strong> {item.motivo_rechazo || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Empresa envío:</strong> {item.empresa_envio || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Código seguimiento:</strong> {item.codigo_seguimiento || '-'}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Fecha envío:</strong> {formatearFecha(item.fecha_envio)}
                </div>

                <div style={{ marginBottom: 6 }}>
                  <strong>Fecha resolución:</strong> {formatearFecha(item.fecha_resolucion)}
                </div>

                {item.comprobante_url && (
                  <div style={{ marginTop: 12 }}>
                    <strong>Factura / Comprobante:</strong>
                    <div style={{ marginTop: 8 }}>
                      <a href={item.comprobante_url} target="_blank" rel="noreferrer">
                        Abrir comprobante
                      </a>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <img
                        src={item.comprobante_url}
                        alt="Comprobante"
                        style={{
                          width: 220,
                          maxWidth: '100%',
                          borderRadius: 8,
                          border: '1px solid #ccc',
                        }}
                      />
                    </div>
                  </div>
                )}

                {item.imagen_producto_url && (
                  <div style={{ marginTop: 12 }}>
                    <strong>Imagen del producto:</strong>
                    <div style={{ marginTop: 8 }}>
                      <a href={item.imagen_producto_url} target="_blank" rel="noreferrer">
                        Abrir imagen
                      </a>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <img
                        src={item.imagen_producto_url}
                        alt="Producto"
                        style={{
                          width: 220,
                          maxWidth: '100%',
                          borderRadius: 8,
                          border: '1px solid #ccc',
                        }}
                      />
                    </div>
                  </div>
                )}

                <div
                  style={{
                    marginTop: 16,
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <button onClick={() => cambiarEstado(item, 'pendiente')}>
                    Pendiente
                  </button>

                  <button
                    onClick={() => abrirResolucion(item)}
                    disabled={item.aprobado !== 'SI'}
                    style={{
                      opacity: item.aprobado !== 'SI' ? 0.6 : 1,
                      cursor: item.aprobado !== 'SI' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Resolución
                  </button>

                  <button
                    onClick={() => marcarAprobado(item, 'SI')}
                    disabled={item.aprobado === 'SI'}
                    style={{
                      opacity: item.aprobado === 'SI' ? 0.6 : 1,
                      cursor: item.aprobado === 'SI' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Aprobar
                  </button>

                  <button
                    onClick={() => marcarAprobado(item, 'NO')}
                    disabled={item.aprobado !== 'SI'}
                    style={{
                      opacity: item.aprobado !== 'SI' ? 0.6 : 1,
                      cursor: item.aprobado !== 'SI' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Desaprobar
                  </button>

                  <button onClick={() => setRechazoAbiertoId(item.id)}>
                    Rechazar
                  </button>

                  <button onClick={() => cambiarEstado(item, 'cerrado')}>
                    Cerrar
                  </button>
                </div>

                {rechazoAbiertoId === item.id && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: 12,
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      background: '#f8f8f8',
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <strong>Motivo de rechazo</strong>
                    </div>

                    <textarea
                      value={textoRechazo}
                      onChange={(e) => setTextoRechazo(e.target.value)}
                      rows={4}
                      style={{ width: '100%', marginBottom: 10 }}
                      placeholder="Escribí por qué se rechaza este caso"
                    />

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => rechazarCaso(item)}>
                        Confirmar rechazo
                      </button>

                      <button
                        onClick={() => {
                          setRechazoAbiertoId(null)
                          setTextoRechazo('')
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {resolucionAbiertaId === item.id && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: 12,
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      background: '#f8f8f8',
                    }}
                  >
                    <div style={{ marginBottom: 12 }}>
                      <strong>Datos de resolución</strong>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <label style={{ display: 'block', marginBottom: 6 }}>
                        Empresa
                      </label>
                      <select
                        value={empresaEnvio}
                        onChange={(e) => setEmpresaEnvio(e.target.value)}
                        style={{ width: '100%', padding: 8 }}
                      >
                        <option value="Correo Argentino">Correo Argentino</option>
                        <option value="Andreani">Andreani</option>
                        <option value="Logistica Propia">Logística Propia</option>
                      </select>
                    </div>

                    {empresaEnvio !== 'Logistica Propia' ? (
                      <>
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ display: 'block', marginBottom: 6 }}>
                            Código de seguimiento
                          </label>
                          <input
                            type="text"
                            value={codigoSeguimiento}
                            onChange={(e) => setCodigoSeguimiento(e.target.value)}
                            style={{ width: '100%', padding: 8 }}
                            placeholder="Ingresá el código de seguimiento"
                          />
                        </div>

                        <div style={{ marginBottom: 10 }}>
                          <strong>Link de seguimiento:</strong>{' '}
                          <a
                            href={obtenerLinkSeguimiento(empresaEnvio)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Abrir seguimiento
                          </a>
                        </div>
                      </>
                    ) : (
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ display: 'block', marginBottom: 6 }}>
                          Fecha de envío
                        </label>
                        <input
                          type="date"
                          value={fechaEnvio}
                          onChange={(e) => setFechaEnvio(e.target.value)}
                          style={{ width: '100%', padding: 8 }}
                        />
                      </div>
                    )}

                    <div
                      style={{
                        marginTop: 12,
                        marginBottom: 12,
                        padding: 10,
                        borderRadius: 8,
                        background: '#fff',
                        border: '1px solid #e0e0e0',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {empresaEnvio !== 'Logistica Propia'
                        ? `Nos contactamos de TEMPTECH por el reclamo "${item.tracking_id}".
Primero que nada queremos pedirle disculpas por los inconvenientes ocasionados. A continuación le dejamos los datos para el seguimiento de su envío.

Empresa: ${empresaEnvio}
Código de seguimiento: ${codigoSeguimiento || '[completar]'}
Link de seguimiento: ${obtenerLinkSeguimiento(empresaEnvio)}`
                        : `Nos contactamos de TEMPTECH por el reclamo "${item.tracking_id}".
Primero que nada queremos pedirle disculpas por los inconvenientes ocasionados. A continuación le dejamos los datos para el seguimiento de su envío.

Empresa: Logística Propia
Fecha de envío: ${fechaEnvio || '[seleccionar fecha]'}`}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => guardarResolucion(item)}>
                        Guardar resolución
                      </button>

                      <button
                        onClick={() => {
                          setResolucionAbiertaId(null)
                          setEmpresaEnvio('Correo Argentino')
                          setCodigoSeguimiento('')
                          setFechaEnvio('')
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}