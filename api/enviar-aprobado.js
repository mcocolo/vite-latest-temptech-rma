import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    const { email, nombre, apellido } = req.body

    console.log('DATOS RECIBIDOS EN APROBADO:', { email, nombre, apellido })

    if (!email) {
      return res.status(400).json({ error: 'Falta email del destinatario' })
    }

   const resultado = await resend.emails.send({
  from: 'Soporte TEMPTECH <notificaciones@temptech.com.ar>',
  to: [email],
  subject: 'TEMPTECH - Solicitud aprobada',
  text: `Estimado cliente ${nombre || ''} ${apellido || ''},

Le comunicamos que su proceso fue revisado por nuestro equipo y el mismo fue Aprobado. Esto quiere decir de que la información cargada se encuentra completa y en condiciones. A la brevedad nos estaremos comunicando para brindarle novedades para su resolución.

Saludos
Equipo Soporte TEMPTECH`,
})

console.log('RESPUESTA COMPLETA RESEND APROBADO:', JSON.stringify(resultado, null, 2))

if (resultado?.error) {
  return res.status(500).json({
    error: 'Resend devolvió error',
    detalle: resultado.error,
  })
}

return res.status(200).json({
  ok: true,
  resultado,
})
  } catch (error) {
    console.error('ERROR EMAIL APROBADO:', error)
    return res.status(500).json({
      error: 'Error enviando email',
      detalle: error?.message || String(error),
    })
  }
}