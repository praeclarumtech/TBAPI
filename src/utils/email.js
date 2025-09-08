import nodemailer from "nodemailer";

export const sendingEmail = async ({ email_to, subject, description }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER,  // your Gmail
        pass: process.env.PASS,  // your Gmail App Password
      },
    });

    const mailOptions = {
      from: process.env.FROM,     // sender email
      to: email_to,               // array or string of recipients
      subject,
      html: description,          // email body in HTML
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, info };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
