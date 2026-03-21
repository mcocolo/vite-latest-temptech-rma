import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      to,
      producto,
      modelo,
      textoRechazo,
    } = req.body

    if (!to) {
      return res.status(400).json({ error: 'Falta email del destinatario' })
    }

    const { data, error } = await resend.emails.send({
      from: 'TempTech <onboarding@resend.dev>',
      to: [to],
      subject: `Resultado del control de su ${producto || 'producto'} ${modelo || ''}`.trim(),
      html: `
        <p>Estimado cliente,</p>

        <p>
          Por medio de la presente le comunicamos que el día de la fecha se realizó el control correspondiente a su
          <b>${producto || '-'} ${modelo || ''}</b>, siendo el resultado del mismo
          <b> Rechazado </b>
          dado que ${textoRechazo}
        </p>

        <p>Saludos cordiales,<br/>TempTech</p>
      `,
    })

    if (error) {
      return res.status(500).json({ error })
    }

    return res.status(200).json({ ok: true, data })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error enviando email' })
  }
}