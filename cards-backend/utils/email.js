const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendVerificationEmail = async (email, token) => {
  /*const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;    
    //change back to this once frontend is up
*/  
  const verificationLink = `http://localhost:5000/api/auth/verify/${encodeURIComponent(token)}`;
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: email,
    subject: 'Verify your email',
    html: `
      <h2>Welcome!</h2>
      <p>Please verify your email by clicking below:</p>
      <a href="${verificationLink}">Verify Email</a>
    `
  });
};

// Send password reset link
exports.sendPasswordResetEmail = async (email, token) => {
  const resetLink =
    `${process.env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: email,
    subject: 'Reset your Calendar App password',
    html: `
      <h2>Password Reset</h2>
      <p>We received a request to reset your password.</p>
      <p>Click below to choose a new password.</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link expires in one hour.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
