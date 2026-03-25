import { enviarMail } from './_mailer'

export default async function handler(req, res) {
  console.log('--- INICIO enviar-aprobado ---')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})

    const to = String(body.to || '').trim()
    const nombre = String(body.nombre || '').trim()
    const tracking_id = String(body.tracking_id || '').trim()

    const saludo = nombre ? `Estimado/a ${nombre},` : 'Estimado/a cliente,'

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <p>${saludo}</p>
        <p>
          Le comunicamos que su solicitud <strong>${tracking_id || '-'}</strong>
          fue revisada por nuestro equipo y resultó <b>APROBADA</b>.
        </p>
        <p>
          La información cargada se encuentra completa y en condiciones.
          A la brevedad nos estaremos comunicando para brindarle novedades sobre su resolución.
        </p>
        <p>Saludos cordiales,<br/>Equipo Soporte TEMPTECH</p>
      </div>
    `

    const data = await enviarMail({
      to,
      subject: 'TEMPTECH - Solicitud aprobada',
      html,
    })

    return res.status(200).json({ ok: true, data })
  } catch (err) {
    console.error('ERROR APROBADO:', err)
    return res.status(500).json({
      error: 'Error enviando email',
      detalle: err?.message || String(err),
    })
  }
}