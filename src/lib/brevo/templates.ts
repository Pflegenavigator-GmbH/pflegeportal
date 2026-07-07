// src/lib/brevo/templates.ts

interface AccessEmailProps {
  caseCode: string;
  portalLink: string;
}

export const EmailTemplates = {
  /**
   * Template für den Erstzugang nach Kauf oder manuellem Teilen
   */
  getAccessEmailHtml: ({ caseCode, portalLink }: AccessEmailProps): string => `
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ihr Zugang zum PflegeNavigator</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #0f2744; background-color: #f4f7f6; padding: 20px;">
            <div style="max-w-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                
                <div style="background-color: #0f2744; padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">PflegeNavigator EU</h1>
                </div>

                <div style="padding: 30px 20px;">
                    <h2 style="margin-top: 0; color: #0f2744;">Vielen Dank für Ihr Vertrauen!</h2>
                    <p>Ihre Zahlung war erfolgreich. Die Premium-Funktionen für Ihren Fall wurden soeben freigeschaltet.</p>
                    
                    <div style="background-color: #f0f9f9; border-left: 4px solid #20b2aa; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                        <h3 style="margin-top: 0; color: #20b2aa; font-size: 16px;">Ihr dauerhafter Zugang</h3>
                        <p style="margin: 0 0 10px 0;"><strong>Fallnummer:</strong> ${caseCode}</p>
                        <p style="margin: 0 0 20px 0; font-size: 14px;">Bewahren Sie diese E-Mail gut auf. Über den Button können Sie Ihr Pflegetagebuch jederzeit passwortlos öffnen.</p>
                        
                        <a href="${portalLink}" style="background-color: #20b2aa; color: #0f2744; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; text-align: center;">
                            Zum PflegeNavigator
                        </a>
                    </div>
                    
                    <p>Im Anhang dieser E-Mail finden Sie Ihre Rechnung als PDF-Dokument für Ihre Unterlagen.</p>
                    <p style="margin-top: 30px; font-size: 14px; color: #666;">Herzliche Grüße,<br>Ihr Team vom PflegeNavigator</p>
                </div>
                
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                        PflegeNavigator GmbH &copy; ${new Date().getFullYear()}<br>
                        Dies ist eine automatisch generierte E-Mail. Bitte antworten Sie nicht darauf.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `,
};
