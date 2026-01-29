const nodemailer = require("nodemailer")

 const sendPasswordEmail = async (toEmail, password) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Institution App" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Your Account Password",
      html: `
        <h2>Welcome 🎉</h2>
        <p>Your account has been created successfully.</p>
        <p><strong>Password:</strong> ${password}</p>
        <p>Please change your password after login.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Password email sent successfully");
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};


module.exports = sendPasswordEmail
