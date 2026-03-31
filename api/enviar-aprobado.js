import { Resend } from 'resend'

console.log('APROBADO TIENE RESEND_API_KEY?', !!process.env.RESEND_API_KEY)
console.log('APROBADO PRIMEROS 6 CHARS KEY:', process.env.RESEND_API_KEY?.slice(0, 6))

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://temptech-portal.vercel.app')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  console.log('--- INICIO enviar-aprobado ---')

  if (req.method !== 'POST') {
    console.log('Método inválido:', req.method)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})

    console.log('Body recibido:', body)

    const to = String(body.to || body.email || '').trim()
    const nombre = String(body.nombre || '').trim()
    const apellido = String(body.apellido || '').trim()
    const tracking_id = String(body.tracking_id || body.trackingId || '').trim()

    console.log('Datos limpios:', { to, nombre, apellido, tracking_id })

    if (!to) {
      console.log('Falta email del destinatario')
      return res.status(400).json({ error: 'Falta email del destinatario' })
    }

    const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ')
    const saludo = nombreCompleto ? `Estimado/a ${nombreCompleto},` : 'Estimado/a cliente,'

    console.log('Antes de resend.emails.send')

    let response

    try {
      response = await resend.emails.send({
        from: 'TempTech <notificaciones@temptech.com.ar>',
        to: [to],
        subject: 'TEMPTECH - Solicitud aprobada',
        html: `
          <div style="font-family: Arial, sans-serif; color: #111;">
            <p>${saludo}</p>

            <p>
              Le comunicamos que su proceso <strong>${tracking_id || '-'}</strong>
              fue revisado por nuestro equipo y el mismo fué <b>ADMITIDO</b> para revisión.
            </p>

            <p>
              Esto quiere decir que la información cargada se encuentra completa y en condiciones.
              A la brevedad nos estaremos comunicando para brindarle novedades para su resolución.
            </p>

            <p>Saludos cordiales,<br/>Equipo Soporte TEMPTECH</p>
          </div>
        `,
      })
    } catch (e) {
      console.error('ERROR CRUDO RESEND:', e)
      return res.status(500).json({
        error: 'Error enviando email',
        detalle: e?.message || JSON.stringify(e),
      })
    }

    console.log('Después de resend.emails.send')
    console.log('Respuesta completa resend:', response)

    if (response?.error) {
      console.error('ERROR RESEND DETALLE:', response.error)
      return res.status(500).json({
        error: 'Error enviando email',
        detalle: response.error?.message || JSON.stringify(response.error),
      })
    }

    return res.status(200).json({
      ok: true,
      data: response?.data || response,
    })
  } catch (err) {
    console.error('CATCH APROBADO:', err)
    return res.status(500).json({
      error: 'Error enviando email',
      detalle: err?.message || String(err),
    })
  }
}