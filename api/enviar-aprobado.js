import { Resend } from 'resend'

console.log('APROBADO TIENE RESEND_API_KEY?', !!process.env.RESEND_API_KEY)
console.log('APROBADO PRIMEROS 6 CHARS KEY:', process.env.RESEND_API_KEY?.slice(0, 6))

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  console.log('--- INICIO enviar-aprobado ---')

  if (req.method !== 'POST') {
    console.log('Método inválido:', req.method)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Body crudo:', req.body)

    const to = (req.body?.to || '').trim()
    const nombre = (req.body?.nombre || '').trim()
    const apellido = (req.body?.apellido || '').trim()

    console.log('Datos limpios:', { to, nombre, apellido })

    if (!to) {
      console.log('Falta email del destinatario')
      return res.status(400).json({ error: 'Falta email del destinatario' })
    }

    console.log('Antes de resend.emails.send')

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

    console.log('Después de resend.emails.send')
    console.log('Data resend:', data)
    console.log('Error resend:', error)

    if (error) {
      return res.status(500).json({
        error: 'Error enviando email',
        detalle: error?.message || JSON.stringify(error),
      })
    }

    return res.status(200).json({ ok: true, data })
  } catch (err) {
    console.error('CATCH APROBADO:', err)
    return res.status(500).json({
      error: 'Error enviando email',
      detalle: err?.message || String(err),
    })
  }
}