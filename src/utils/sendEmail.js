const transporter = require("../config/email");

const sendEmail = async (to, name) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: to,
    subject: "Devora Account Created Successfully 🎉",

    text: `Hi ${name},

Your Devora account has been created successfully!

Welcome to Devora. 🚀

Thanks,
Devora Team`,

    html: `
      <h2>Welcome to Devora, ${name}! 🎉</h2>

      <p>Your account has been created successfully.</p>

      <p>We're happy to have you on Devora. 🚀</p>

      <br>

      <p>Thanks,<br>
      Devora Team</p>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log("Account creation email sent:", info.messageId);

  return info;
};

module.exports = sendEmail;
