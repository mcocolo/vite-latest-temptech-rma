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
    const tracking_id = (req.body?.tracking_id || '').trim()

    if (!email) {
      return res.status(400).json({ error: 'Falta email' })
    }

    const subject = `TEMPTECH - Desaprobado reclamo ${tracking_id}`

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <p>Estimado/a ${nombre || 'cliente'},</p>

        <p>Le comunicamos que su proceso <strong>${tracking_id}</strong> fue revisado por nuestro equipo y el mismo fue <strong>DESAPROBADO</strong>.</p>

        <p>Esto quiere decir que la información cargada se encuentra incompleta. Le solicitamos por favor volver a ingresar la información completando todos los campos requeridos.</p>

        <p>Saludos cordiales,<br/>Equipo Soporte TEMPTECH</p>
      </div>
    `

    const { data, error } = await resend.emails.send({
      from: 'TEMPTECH <notificaciones@temptech.com.ar>',
      to: [email],
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