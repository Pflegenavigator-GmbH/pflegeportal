// src/lib/qr-delivery.ts
// QR-CODE DELIVERY SYSTEM - Für jeden Kunden mit Fallnummer
// Versand via Email, Download, WhatsApp, Wallet

import { createPortalQRCode, createPermanentQR, createMiniQR, createWalletCard } from './portal-qr';

export interface QROptions {
  caseCode: string;
  format: 'email' | 'download' | 'wallet' | 'print' | 'whatsapp';
  recipientEmail?: string;
  recipientName?: string;
  recipientPhone?: string;
  language?: 'de' | 'en' | 'tr' | 'pl' | 'ru';
}

export interface QRDeliveryResult {
  success: boolean;
  method: string;
  qrDataUrl?: string;
  portalLink: string;
  message?: string;
  error?: string;
}

/**
 * Generiert personalisierten QR-Code für einen Kunden
 */
export async function generateCustomerQR(
  caseCode: string,
  options?: {
    size?: 'small' | 'medium' | 'large';
    includeInstructions?: boolean;
  }
): Promise<{
  qrDataUrl: string;
  portalLink: string;
  printTemplate: string;
  walletData: any;
}> {
  // QR-Code in gewünschter Größe
  const size = options?.size === 'small' ? 200 : options?.size === 'large' ? 500 : 300;
  const { qrDataUrl, link } = await createPortalQRCode(caseCode, { size });
  
  // Wallet-Daten für Apple/Google Wallet
  const walletData = createWalletCard(caseCode, qrDataUrl);
  
  // Druck-Vorlage mit Anleitung
  const printTemplate = createPrintTemplateWithInstructions(caseCode, qrDataUrl);
  
  return {
    qrDataUrl,
    portalLink: link,
    printTemplate,
    walletData
  };
}

/**
 * Versandt QR-Code per Email
 */
export async function sendQRViaEmail(
  options: QROptions & { recipientEmail: string; recipientName: string }
): Promise<QRDeliveryResult> {
  try {
    const { qrDataUrl, portalLink, printTemplate } = await generateCustomerQR(options.caseCode, { size: 'medium' });
    
    // Email-Vorlage in verschiedenen Sprachen
    const emailContent = getEmailTemplate(options.language || 'de', {
      name: options.recipientName,
      caseCode: options.caseCode,
      portalLink,
      qrDataUrl
    });

    // API-Call zum Email-Versand (z.B. Resend, SendGrid, oder eigener SMTP)
    const emailResult = await fetch('/api/send-qr-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: options.recipientEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        attachments: [{
          filename: `PflegeNavigator-${options.caseCode}-QR.png`,
          content: qrDataUrl.split(',')[1], // Base64 ohne Prefix
          encoding: 'base64'
        }]
      })
    });

    if (emailResult.ok) {
      return {
        success: true,
        method: 'email',
        portalLink,
        message: `QR-Code an ${options.recipientEmail} gesendet`
      };
    }
    
    throw new Error('Email konnte nicht gesendet werden');
  } catch (error) {
    return {
      success: false,
      method: 'email',
      portalLink: `${process.env.NEXT_PUBLIC_APP_URL}/pflegegrad/start?case=${options.caseCode}`,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    };
  }
}

/**
 * WhatsApp QR-Code Versand
 */
export async function sendQRViaWhatsApp(
  options: QROptions & { recipientPhone: string }
): Promise<QRDeliveryResult> {
  try {
    const { qrDataUrl, portalLink } = await generateCustomerQR(options.caseCode, { size: 'medium' });
    
    // WhatsApp Business API oder einfacher Link
    const message = encodeURIComponent(
      `🏥 Ihr PflegeNavigator EU Zugang\n\n` +
      `Fallnummer: ${options.caseCode}\n\n` +
      `QR-Code scannen oder Link öffnen:\n${portalLink}\n\n` +
      `Gespeichert für dauerhaften Zugriff!`
    );
    
    const whatsappUrl = `https://wa.me/${options.recipientPhone.replace(/\D/g, '')}?text=${message}`;
    
    // QR-Code als Bild für WhatsApp
    // Hier würde man WhatsApp Business API nutzen
    
    return {
      success: true,
      method: 'whatsapp',
      qrDataUrl,
      portalLink,
      message: `WhatsApp Link generiert: ${whatsappUrl}`
    };
  } catch (error) {
    return {
      success: false,
      method: 'whatsapp',
      portalLink: `${process.env.NEXT_PUBLIC_APP_URL}/pflegegrad/start?case=${options.caseCode}`,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    };
  }
}

/**
 * Download QR-Code als PNG/PDF
 */
export async function downloadQR(
  caseCode: string,
  format: 'png' | 'pdf' | 'wallet' = 'png'
): Promise<QRDeliveryResult> {
  try {
    const { qrDataUrl, printTemplate, walletData } = await generateCustomerQR(caseCode, { size: 'large' });
    
    if (format === 'png') {
      // Trigger Browser Download
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `PflegeNavigator-${caseCode}-QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return {
        success: true,
        method: 'download-png',
        qrDataUrl,
        portalLink: `${process.env.NEXT_PUBLIC_APP_URL}/pflegegrad/start?case=${caseCode}`,
        message: 'QR-Code als PNG heruntergeladen'
      };
    }
    
    if (format === 'pdf') {
      // PDF mit Anleitung
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printTemplate);
        printWindow.document.close();
        printWindow.print();
      }
      
      return {
        success: true,
        method: 'download-pdf',
        portalLink: `${process.env.NEXT_PUBLIC_APP_URL}/pflegegrad/start?case=${caseCode}`,
        message: 'Druckvorlage geöffnet'
      };
    }
    
    if (format === 'wallet') {
      // Apple/Google Wallet Pass
      // Hier würde man Wallet API nutzen
      return {
        success: true,
        method: 'wallet',
        portalLink: walletData.barcode.message,
        message: 'Wallet-Pass generiert (API-Integration nötig)'
      };
    }
    
    throw new Error('Unbekanntes Format');
  } catch (error) {
    return {
      success: false,
      method: format,
      portalLink: `${process.env.NEXT_PUBLIC_APP_URL}/pflegegrad/start?case=${caseCode}`,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    };
  }
}

/**
 * Email Templates in verschiedenen Sprachen
 */
function getEmailTemplate(lang: string, data: { name: string; caseCode: string; portalLink: string; qrDataUrl: string }) {
  const templates: Record<string, { subject: string; html: string }> = {
    de: {
      subject: `🏥 Ihr PflegeNavigator EU Zugang - Fall ${data.caseCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0f2744;">Hallo ${data.name},</h1>
          <p>willkommen bei <strong>PflegeNavigator EU</strong>!</p>
          
          <div style="background: #f0f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #20b2aa; margin-top: 0;">Ihre Fallnummer: ${data.caseCode}</h2>
            <p>Scannen Sie den angehängten QR-Code mit Ihrem Handy, um direkt ins Portal zu gelangen.</p>
            <p>Oder öffnen Sie diesen Link:<br>
            <a href="${data.portalLink}" style="color: #0f2744; word-break: break-all;">${data.portalLink}</a></p>
          </div>
          
          <h3>So funktioniert's:</h3>
          <ol>
            <li>QR-Code scannen oder Link klicken</li>
            <li>Sie landen direkt im PflegeNavigator Portal</li>
            <li>Ihre Daten werden automatisch geladen</li>
            <li>Kein Passwort nötig!</li>
          </ol>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Tipp: Speichern Sie den QR-Code auf Ihrem Handy oder drucken Sie ihn aus.<br>
            Er funktioniert immer – auch in 5 Jahren noch!
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 11px;">
            PflegeNavigator EU gUG | Dies ist eine automatische Nachricht.
          </p>
        </div>
      `
    },
    en: {
      subject: `🏥 Your PflegeNavigator EU Access - Case ${data.caseCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0f2744;">Hello ${data.name},</h1>
          <p>welcome to <strong>PflegeNavigator EU</strong>!</p>
          
          <div style="background: #f0f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #20b2aa; margin-top: 0;">Your Case Number: ${data.caseCode}</h2>
            <p>Scan the attached QR-Code with your phone to access the portal directly.</p>
            <p>Or open this link:<br>
            <a href="${data.portalLink}" style="color: #0f2744; word-break: break-all;">${data.portalLink}</a></p>
          </div>
          
          <h3>How it works:</h3>
          <ol>
            <li>Scan QR-Code or click link</li>
            <li>You'll enter the PflegeNavigator portal directly</li>
            <li>Your data loads automatically</li>
            <li>No password needed!</li>
          </ol>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Tip: Save the QR-Code on your phone or print it out.<br>
            It works forever – even in 5 years!
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 11px;">
            PflegeNavigator EU gUG | This is an automated message.
          </p>
        </div>
      `
    },
    tr: {
      subject: `🏥 PflegeNavigator EU Erişiminiz - Vaka ${data.caseCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0f2744;">Merhaba ${data.name},</h1>
          <p><strong>PflegeNavigator EU</strong>'ya hoş geldiniz!</p>
          
          <div style="background: #f0f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #20b2aa; margin-top: 0;">Vaka Numaranız: ${data.caseCode}</h2>
            <p>Doğrudan portala erişmek için telefonunuzla ekli QR kodu tarayın.</p>
            <p>Veya bu bağlantıyı açın:<br>
            <a href="${data.portalLink}" style="color: #0f2744; word-break: break-all;">${data.portalLink}</a></p>
          </div>
          
          <h3>Nasıl çalışır:</h3>
          <ol>
            <li>QR kodu tarayın veya bağlantıya tıklayın</li>
            <li>Doğrudan PflegeNavigator portalına girersiniz</li>
            <li>Verileriniz otomatik yüklenir</li>
            <li>Şifre gerekmez!</li>
          </ol>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            İpucu: QR kodu telefonunza kaydedin veya yazdırın.<br>
            5 yıl sonra bile çalışır!
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 11px;">
            PflegeNavigator EU gUG | Bu otomatik bir mesajdır.
          </p>
        </div>
      `
    }
  };
  
  return templates[lang] || templates.de;
}

/**
 * Druckvorlage mit Anleitung
 */
function createPrintTemplateWithInstructions(caseCode: string, qrDataUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>PflegeNavigator EU - ${caseCode}</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
        .header { background: linear-gradient(135deg, #0f2744 0%, #20b2aa 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 30px; }
        .qr-container { margin: 30px 0; }
        .qr-container img { width: 300px; height: 300px; border: 10px solid #0f2744; border-radius: 20px; }
        .instructions { background: #f0f9f9; padding: 20px; border-radius: 10px; margin: 30px 0; text-align: left; max-width: 500px; margin-left: auto; margin-right: auto; }
        .case-number { font-size: 24px; color: #0f2744; font-weight: bold; background: #e0f2f1; padding: 15px; border-radius: 10px; margin: 20px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; color: #666; font-size: 12px; }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏥 PflegeNavigator EU</h1>
        <p>Ihr persönlicher Zugang zum Portal</p>
      </div>
      
      <div class="case-number">
        Fallnummer: ${caseCode}
      </div>
      
      <div class="qr-container">
        <img src="${qrDataUrl}" alt="QR-Code für direkten Zugang" />
      </div>
      
      <div class="instructions">
        <h3>📱 So gelangen Sie ins Portal:</h3>
        <ol>
          <li><strong>QR-Code scannen</strong> mit Handy-Kamera</li>
          <li><strong>Link öffnen</strong> – Sie sind sofort im Portal</li>
          <li><strong>Daten werden automatisch geladen</strong></li>
          <li><strong>Kein Passwort nötig!</strong></li>
        </ol>
        <p><strong>Tipp:</strong> Diesen QR-Code laminieren oder im Portemonnaie aufbewahren. Er funktioniert immer!</p>
      </div>
      
      <div class="footer">
        <p><strong>PflegeNavigator EU gUG</strong></p>
        <p>Keine Rechtsberatung – nur Orientierungshilfe</p>
        <p class="no-print">Gedruckt am ${new Date().toLocaleDateString('de-DE')}</p>
      </div>
      
      <div class="no-print" style="margin-top: 30px;">
        <button onclick="window.print()" style="padding: 15px 30px; background: #0f2744; color: white; border: none; border-radius: 10px; font-size: 16px; cursor: pointer;">
          🖨️ Jetzt drucken
        </button>
      </div>
    </body>
    </html>
  `;
}
