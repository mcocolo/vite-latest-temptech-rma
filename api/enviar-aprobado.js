import { Resend } from 'resend'

console.log('APROBADO TIENE RESEND_API_KEY?', !!process.env.RESEND_API_KEY)
console.log('APROBADO PRIMEROS 6 CHARS KEY:', process.env.RESEND_API_KEY?.slice(0, 6))

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
   const to = (req.body?.to || '').trim()
const nombre = (req.body?.nombre || '').trim()
const apellido = (req.body?.apellido || '').trim()

    if (!to) {
      return res.status(400).json({ error: 'Falta email del destinatario' })
    }

    const { data, error } = await resend.emails.send({
      from: 'TempTech <onboarding@resend.dev>',
      to: [to],
      subject: 'TEMPTECH - Solicitud aprobada',
      html: `
        <p>Estimado cliente ${nombre || ''} ${apellido || ''},</p>

        <p>
          Le comunicamos que su proceso fue revisado por nuestro equipo y el mismo fue
          <b>Aprobado</b>.
          Esto quiere decir que la información cargada se encuentra completa y en condiciones.
          A la brevedad nos estaremos comunicando para brindarle novedades para su resolución.
        </p>

        <p>Saludos cordiales,<br/>Equipo Soporte TEMPTECH</p>
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