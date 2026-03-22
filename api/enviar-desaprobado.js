import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('BODY enviar-desaprobado:', req.body)

    const email = (req.body?.email || '').trim()
    const nombre = (req.body?.nombre || '').trim()
    const producto = (req.body?.producto || '').trim()
    const modelo = (req.body?.modelo || '').trim()
    const tracking_id = (req.body?.tracking_id || '').trim()

    if (!email) {
      return res.status(400).json({ error: 'Falta email' })
    }

    const subject = `Actualización de su caso${tracking_id ? ' #' + tracking_id : ''}`

    const html = `
      <p>Estimado cliente${nombre ? ' ' + nombre : ''},</p>

      <p>
        Su caso${tracking_id ? ' ' + tracking_id : ''} no fue aprobado debido a algún faltante de información adjuntada.
      </p>

      <p>
        Le solicitamos verificar la documentación enviada y volver a cargar la solicitud con la información completa.
      </p>

      <p><strong>Producto:</strong> ${producto || ''} ${modelo || ''}</p>

      <p>Saludos cordiales.</p>
      <p><strong>TEMPTECH</strong></p>
    `

    const { data, error } = await resend.emails.send({
      from: 'TEMPTECH <notificaciones@temptech.com.ar>',
      to: [email],
      cc: ['notificaciones@temptech.com.ar'],
      subject,
      html,
    })

    console.log('EMAIL DESAPROBADO OK:', data)
    console.log('ERROR RESEND:', error)

    if (error) {
      return res.status(500).json({
        ok: false,
        error: error.message || JSON.stringify(error),
      })
    }

    return res.status(200).json({ ok: true, data })

  } catch (error) {
    console.error('ERROR enviar-desaprobado:', error)

    return res.status(500).json({
      ok: false,
      error: error.message,
    })
  }
}