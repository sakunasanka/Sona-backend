const createEmailTemplate = (content: string, logoUrl?: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sona</title>
      <!--[if gte mso 9]>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG/>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <!-- Main container -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: #667eea; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  ${logoUrl ? `
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-bottom: 20px;">
                        <img src="${logoUrl}" alt="Sona Logo" style="max-width: 120px; height: auto; display: block;">
                      </td>
                    </tr>
                  </table>
                  ` : ''}
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; font-family: Arial, sans-serif;">Sona</h1>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px;">
                  ${content}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 10px 0; color: #718096; font-size: 14px; font-family: Arial, sans-serif;">
                    This email was sent by Sona. If you have any questions, please contact our support team.
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center">
                        <a href="#" style="color: #667eea; text-decoration: none; font-size: 14px; margin: 0 8px; font-family: Arial, sans-serif;">Privacy Policy</a>
                        <span style="color: #cbd5e0; margin: 0 4px;">|</span>
                        <a href="#" style="color: #667eea; text-decoration: none; font-size: 14px; margin: 0 8px; font-family: Arial, sans-serif;">Terms of Service</a>
                        <span style="color: #cbd5e0; margin: 0 4px;">|</span>
                        <a href="#" style="color: #667eea; text-decoration: none; font-size: 14px; margin: 0 8px; font-family: Arial, sans-serif;">Contact Support</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export { createEmailTemplate };