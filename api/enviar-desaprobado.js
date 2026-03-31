import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://temptech-portal.vercel.app')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('BODY enviar-desaprobado:', req.body)

    const email = (req.body?.email || '').trim()
    const tracking_id = (req.body?.tracking_id || '').trim()
    const texto = (req.body?.texto || '').trim()

    if (!email) {
      return res.status(400).json({ error: 'Falta email' })
    }

    const subject = `TEMPTECH - Desaprobado reclamo ${tracking_id}`

    const html = `<div style="font-family: Arial, sans-serif; color: #111; white-space: pre-line;">${texto}</div>`

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