import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id, email, nombre, producto, modelo } = req.body

    console.log('BODY enviar-desaprobado:', req.body)

    const subject = `Actualización de su caso #${id}`

    const html = `
      <p>Estimado cliente,</p>

      <p>Su caso no fue aprobado debido a algún faltante de información adjuntada.</p>

      <p>Le solicitamos verificar la documentación enviada y volver a cargar la solicitud con la información completa.</p>

      <p><strong>Producto:</strong> ${producto || ''} ${modelo || ''}</p>

      <p>Saludos cordiales.</p>
      <p><strong>TempTech</strong></p>
    `

    const result = await resend.emails.send({
      from: 'TempTech <notificaciones@temptech.com.ar>',
      to: [email],
      cc: ['notificaciones@temptech.com.ar'],
      subject,
      html,
    })

    console.log('EMAIL DESAPROBADO OK:', result)

    return res.status(200).json({ ok: true })

  } catch (error) {
    console.error('ERROR enviar-desaprobado:', error)

    return res.status(500).json({
      ok: false,
      error: error.message,
    })
  }
}