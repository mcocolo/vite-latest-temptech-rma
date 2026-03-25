import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  console.log('--- INICIO enviar-rechazo ---')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})

    console.log('Body recibido RECHAZO:', body)

    const to = String(body.to || body.email || '').trim()
    const nombre = String(body.nombre || '').trim()
    const apellido = String(body.apellido || '').trim()
    const tracking_id = String(body.tracking_id || body.trackingId || '').trim()
    const motivo = String(body.motivo || body.textoRechazo || '').trim()
    const producto = String(body.producto || '').trim()
    const modelo = String(body.modelo || '').trim()

    if (!to) {
      return res.status(400).json({ error: 'Falta email del destinatario' })
    }

    const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ')
    const saludo = nombreCompleto ? `Estimado/a ${nombreCompleto},` : 'Estimado/a cliente,'

    const response = await resend.emails.send({
      from: 'TempTech <notificaciones@temptech.com.ar>',
      to: [to],
      subject: 'TEMPTECH - Solicitud rechazada',
      html: `
        <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
          <p>${saludo}</p>

          <p>
            Por medio de la presente le comunicamos que en el día de la fecha se realizó el control correspondiente
            a su producto <b>${producto || '-'}</b> ${modelo ? `- <b>${modelo}</b>` : ''},
            y el resultado del mismo fue <b>RECHAZADO</b>.
          </p>

          ${
            motivo
              ? `<p><b>Motivo:</b> ${motivo}</p>`
              : ''
          }

          ${
            tracking_id
              ? `<p><b>ID de seguimiento:</b> ${tracking_id}</p>`
              : ''
          }

          <p>Saludos cordiales,<br/>Equipo Soporte TEMPTECH</p>
        </div>
      `,
    })

    console.log('RESPUESTA RESEND RECHAZO:', response)

    if (response?.error) {
      return res.status(500).json({
        error: 'Error enviando email',
        detalle: response.error?.message || JSON.stringify(response.error),
      })
    }

    return res.status(200).json({ ok: true, data: response?.data || response })
  } catch (err) {
    console.error('ERROR RECHAZO:', err)
    return res.status(500).json({
      error: 'Error enviando email',
      detalle: err?.message || String(err),
    })
  }
}