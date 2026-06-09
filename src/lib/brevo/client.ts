// src/lib/brevo/client.ts

import {logger} from "@/src/lib/logger";

export interface EmailContact {
    email: string;
    name?: string;
}

export interface EmailAttachment {
    url?: string;
    content?: string; // base64 encodierter String, falls die Datei direkt gesendet wird
    name: string;
}

export interface SendEmailOptions {
    to: EmailContact[];
    sender?: EmailContact;
    subject: string;
    htmlContent: string;
    attachment?: EmailAttachment[];
}

export interface SendSmsOptions {
    recipient: string; // Format: "+4915112345678"
    content: string;
    sender?: string;   // Max 11 Zeichen, alphanumerisch (z.B. "PflegeNav")
}

export class BrevoClient {
    private static instance: BrevoClient;
    private readonly apiKey: string;
    private readonly baseUrl = 'https://api.brevo.com/v3';

    // Privater Konstruktor verhindert Instanziierung mit 'new'
    private constructor() {
        const key = process.env.BREVO_API_KEY;
        if (!key) {
            logger.fatal({ action: 'brevo_init_failed' }, 'BREVO_API_KEY fehlt in den Umgebungsvariablen.');
            throw new Error('BREVO_API_KEY fehlt in den Umgebungsvariablen.');
        }
        this.apiKey = key;
        logger.debug({ action: 'brevo_client_initialized' }, 'BrevoClient Singleton-Instanz wurde erfolgreich erstellt.');
    }

    // Die Singleton-Instanz abrufen
    public static getInstance(): BrevoClient {
        if (!BrevoClient.instance) {
            BrevoClient.instance = new BrevoClient();
        }
        return BrevoClient.instance;
    }

    // Gemeinsame Header für alle Requests
    private get headers(): Record<string, string> {
        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': this.apiKey,
        };
    }

    public async sendEmail(options: SendEmailOptions): Promise<void> {
        const sender = options.sender || { name: 'PflegeNavigator EU', email: 'noreply@pflegenavigatoreu.com' };
        const payload = {
            sender,
            to: options.to,
            subject: options.subject,
            htmlContent: options.htmlContent,
            attachment: options.attachment,
        };

        // Info-Log vor dem Request (hilfreich um hängende Requests zu identifizieren)
        logger.info({
            action: 'brevo_email_start',
            subject: options.subject,
            recipientsCount: options.to.length,
            hasAttachments: !!options.attachment && options.attachment.length > 0
        }, 'Initiiere E-Mail-Versand über Brevo');

        try {
            const response = await fetch(`${this.baseUrl}/smtp/email`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json() as Record<string, unknown>;
                logger.error({
                    action: 'brevo_email_error',
                    status: response.status,
                    errorData
                }, 'Brevo API hat einen Fehler beim E-Mail-Versand gemeldet');

                throw new Error(`Brevo Email API Fehler: ${JSON.stringify(errorData)}`);
            }

            logger.info({ action: 'brevo_email_success' }, 'E-Mail erfolgreich via Brevo versendet');

        } catch (error) {
            // Fängt auch Netzwerkfehler (z.B. DNS Probleme, Timeouts) ab
            logger.error({ action: 'brevo_email_exception', err: error }, 'Unerwarteter Fehler beim E-Mail-Versand');
            throw error;
        }
    }

    public async sendSms(options: SendSmsOptions): Promise<void> {
        const payload = {
            sender: options.sender || 'PflegeNav',
            recipient: options.recipient,
            content: options.content,
        };

        // Nummer maskieren für den Log (z.B. +4915112345678 -> +4915112***678), um PII zu schützen
        const maskedRecipient = options.recipient.replace(/(?<=\+\d{5})\d+(?=\d{3})/, '***');

        logger.info({
            action: 'brevo_sms_start',
            sender: payload.sender,
            recipient: maskedRecipient
        }, 'Initiiere SMS-Versand über Brevo');

        try {
            const response = await fetch(`${this.baseUrl}/transactionalSMS/sms`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json() as Record<string, unknown>;
                logger.error({
                    action: 'brevo_sms_error',
                    status: response.status,
                    errorData
                }, 'Brevo API hat einen Fehler beim SMS-Versand gemeldet');

                throw new Error(`Brevo SMS API Fehler: ${JSON.stringify(errorData)}`);
            }

            logger.info({ action: 'brevo_sms_success' }, 'SMS erfolgreich via Brevo versendet');

        } catch (error) {
            logger.error({ action: 'brevo_sms_exception', err: error }, 'Unerwarteter Fehler beim SMS-Versand');
            throw error;
        }
    }
}