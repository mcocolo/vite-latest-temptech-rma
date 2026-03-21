import { Resend } from 'resend'

console.log('RECHAZO TIENE RESEND_API_KEY?', !!process.env.RESEND_API_KEY)
console.log('RECHAZO PRIMEROS 6 CHARS KEY:', process.env.RESEND_API_KEY?.slice(0, 6))

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  console.log('--- INICIO enviar-rechazo ---')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Body crudo rechazo:', req.body)

    const to = (req.body?.to || '').trim()
    const producto = (req.body?.producto || '').trim()
    const modelo = (req.body?.modelo || '').trim()
    const textoRechazo = (req.body?.textoRechazo || '').trim()

    console.log('Datos limpios rechazo:', { to, producto, modelo, textoRechazo })

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
          <b>Rechazado</b> dado que ${textoRechazo}.
        </p>

        <p>Saludos cordiales,<br/>Equipo Soporte TEMPTECH</p>
      `,
    })

    console.log('RESPUESTA RESEND RECHAZO:', { data, error })

    if (error) {
      return res.status(500).json({
        error: 'Error enviando email',
        detalle: error?.message || JSON.stringify(error),
      })
    }

    return res.status(200).json({ ok: true, data })
  } catch (err) {
    console.error('CATCH RECHAZO:', err)
    return res.status(500).json({
      error: 'Error enviando email',
      detalle: err?.message || String(err),
    })
  }
}