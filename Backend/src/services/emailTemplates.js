

const LOGO = `
  <div style="width:56px;height:56px;border-radius:16px;background:#111114;display:flex;align-items:center;justify-content:center;margin:0 auto 28px auto;">
    <span style="font-family:'Space Grotesk',Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;color:#ffffff;line-height:56px;">K</span>
  </div>
`;

export function verificationEmailTemplate({ username, verifyUrl }) {
    return `
  <div style="background:#ffffff;padding:56px 24px;font-family:Helvetica,Arial,sans-serif;">
    <div style="max-width:440px;margin:0 auto;text-align:center;">
      ${LOGO}
      <h1 style="font-family:'Space Grotesk',Helvetica,Arial,sans-serif;font-size:28px;font-weight:600;color:#111114;margin:0 0 16px 0;">
        Confirm your account
      </h1>
      <p style="font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#55565f;margin:0 0 32px 0;">
        Hi ${username}, thanks for signing up for Kairis AI. To confirm your account, please click the button below.
      </p>
      <a href="${verifyUrl}"
         style="display:inline-block;background:#111114;color:#ffffff;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:999px;">
        Confirm account
      </a>
      <p style="font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#9a9ba3;margin:40px 0 0 0;">
        If you didn't create this account, you can safely ignore this email.
      </p>
    </div>
  </div>
  `;
}

export function verifiedSuccessPage({ loginUrl }) {
    return `
  <html>
    <body style="background:#ffffff;padding:56px 24px;font-family:Helvetica,Arial,sans-serif;margin:0;">
      <div style="max-width:440px;margin:0 auto;text-align:center;">
        ${LOGO}
        <h1 style="font-family:'Space Grotesk',Helvetica,Arial,sans-serif;font-size:26px;font-weight:600;color:#111114;margin:0 0 16px 0;">
          Email verified
        </h1>
        <p style="font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#55565f;margin:0 0 32px 0;">
          Your email has been verified successfully. You can now log in to your account.
        </p>
        <a href="${loginUrl}"
           style="display:inline-block;background:#111114;color:#ffffff;font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:999px;">
          Go to Login
        </a>
      </div>
    </body>
  </html>
  `;
}
