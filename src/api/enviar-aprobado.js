import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  try {
    const { email, nombre, apellido } = req.body;

    await resend.emails.send({
      from: "Soporte TEMPTECH <notificaciones@temptech.com.ar>",
      to: [email],
      subject: "TEMPTECH - Solicitud aprobada",
      text: `
Estimado cliente ${nombre} ${apellido},

Le comunicamos que su proceso fue revisado por nuestro equipo y el mismo fue Aprobado. Esto quiere decir de que la información cargada se encuentra completa y en condiciones. A la brevedad nos estaremos comunicando para brindarle novedades para su resolución.

Saludos
Equipo Soporte TEMPTECH
      `,
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("ERROR EMAIL APROBADO:", error);
    res.status(500).json({ error: "Error enviando email" });
  }
}