/** Supabase Usage Monitoring Module
 *  Monitors Free Tier limits and alerts on thresholds
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration interfaces
interface SupabaseMonitorConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  emailTo?: string;
  emailFrom?: string;
  quietHoursStart: number; // 23 = 11 PM
  quietHoursEnd: number;   // 7 = 7 AM
}

interface UsageStats {
  databaseSize: number;    // bytes
  storageSize: number;     // bytes
  edgeFunctionInvocations: number;
  authUsers: number;
  connections: {
    active: number;
    max: number;
  };
  rateLimits: {
    requestsPerSecond: number;
    remaining: number;
  };
}

interface AlertState {
  lastAlertSent: { [key: string]: string };
  dailyReportSent: string | null;
}

// Free Tier Limits
const FREE_TIER_LIMITS = {
  DATABASE_SIZE_BYTES: 500 * 1024 * 1024, // 500MB
  DATABASE_SIZE_MB: 500,
  STORAGE_SIZE_BYTES: 1 * 1024 * 1024 * 1024, // 1GB
  STORAGE_SIZE_GB: 1,
  EDGE_FUNCTION_INVOCATIONS: 500000, // 500K
  CONNECTION_POOL_SIZE: 10, // Max concurrent connections
  API_RATE_LIMIT_PER_SECOND: 25,
};

// Alert thresholds
const ALERT_THRESHOLDS = {
  DATABASE_SIZE_PERCENT: 80,
  STORAGE_SIZE_PERCENT: 80,
  CONNECTION_POOL_PERCENT: 70,
  RATE_LIMIT_PERCENT: 80,
};

export class SupabaseUsageMonitor {
  private config: SupabaseMonitorConfig;
  private supabase: SupabaseClient;
  private alertState: AlertState;

  constructor(config: SupabaseMonitorConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    this.alertState = this.loadAlertState();
  }

  /**
   * Check all usage metrics and send alerts if needed
   */
  public async checkUsage(): Promise<void> {
    console.log('[Supabase Monitor] Starting usage check...');

    try {
      const stats = await this.fetchUsageStats();
      await this.evaluateAlerts(stats);
      this.saveAlertState();
      
      console.log('[Supabase Monitor] Check completed successfully');
    } catch (error) {
      console.error('[Supabase Monitor] Error during usage check:', error);
      await this.sendAlert(
        '❌ Supabase Monitor Error',
        `Fehler beim Abrufen der Nutzungsdaten:\n${error}`,
        'high'
      );
    }
  }

  /**
   * Fetch current usage statistics from Supabase
   */
  private async fetchUsageStats(): Promise<UsageStats> {
    // Database size query
    const { data: dbSizeData, error: dbSizeError } = await this.supabase
      .rpc('get_database_size');
    
    if (dbSizeError) {
      console.warn('[Supabase Monitor] Could not fetch DB size:', dbSizeError);
    }

    // Alternative: Query pg_size_pretty(pg_database_size(current_database()))
    const { data: dbSizeResult, error: dbSizeQueryError } = await this.supabase
      .from('_monitoring_database_size')
      .select('*')
      .limit(1);

    // Storage usage (requires storage API)
    const { data: storageData } = await this.supabase
      .storage
      .listBuckets();

    // Auth users count
    const { count: userCount, error: userError } = await this.supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true });

    if (userError) {
      console.warn('[Supabase Monitor] Could not fetch user count:', userError);
    }

    // Connection pool info (via pg_stat_activity)
    const { data: connectionData } = await this.supabase
      .rpc('get_connection_stats');

    // Construct stats object
    const stats: UsageStats = {
      databaseSize: dbSizeData || dbSizeResult?.[0]?.size_bytes || 0,
      storageSize: await this.calculateStorageSize(storageData),
      edgeFunctionInvocations: 0, // Requires Supabase CLI or analytics API
      authUsers: userCount || 0,
      connections: {
        active: connectionData?.active_connections || 0,
        max: FREE_TIER_LIMITS.CONNECTION_POOL_SIZE,
      },
      rateLimits: {
        requestsPerSecond: 0, // Would need edge function or API monitoring
        remaining: 25,
      },
    };

    console.log('[Supabase Monitor] Stats:', JSON.stringify(stats, null, 2));
    return stats;
  }

  /**
   * Calculate total storage size across all buckets
   */
  private async calculateStorageSize(buckets: any[] | null): Promise<number> {
    let totalSize = 0;
    
    if (!buckets) return totalSize;

    for (const bucket of buckets) {
      try {
        const { data: files } = await this.supabase
          .storage
          .from(bucket.name)
          .list();
        
        // This is simplified - actual size calculation would need file metadata
        totalSize += files?.length || 0;
      } catch (e) {
        console.warn(`Could not list bucket ${bucket.name}:`, e);
      }
    }

    return totalSize;
  }

  /**
   * Evaluate all metrics and trigger alerts
   */
  private async evaluateAlerts(stats: UsageStats): Promise<void> {
    const dbSizeMB = stats.databaseSize / (1024 * 1024);
    const dbSizePercent = (dbSizeMB / FREE_TIER_LIMITS.DATABASE_SIZE_MB) * 100;

    // Database size alert
    if (dbSizePercent >= ALERT_THRESHOLDS.DATABASE_SIZE_PERCENT) {
      const alertKey = 'database_size_alert';
      const today = new Date().toISOString().split('T')[0];
      
      if (!this.hasAlertBeenSent(alertKey, today)) {
        const message = this.formatDatabaseAlert(dbSizeMB, dbSizePercent);
        await this.sendAlert('⚠️ Supabase Database Size Warning', message, 'high');
        this.markAlertSent(alertKey, today);
      }
    }

    // Connection pool alert
    const connectionPercent = (stats.connections.active / stats.connections.max) * 100;
    if (connectionPercent >= ALERT_THRESHOLDS.CONNECTION_POOL_PERCENT) {
      const alertKey = 'connection_pool_alert';
      const today = new Date().toISOString().split('T')[0];
      
      if (!this.hasAlertBeenSent(alertKey, today)) {
        const message = this.formatConnectionAlert(stats.connections.active, connectionPercent);
        await this.sendAlert('⚠️ Supabase Connection Pool Warning', message, 'high');
        this.markAlertSent(alertKey, today);
      }
    }

    // Critical threshold (95%)
    if (dbSizePercent >= 95) {
      const message = `🆘 **Kritischer Speicherplatz!**\n\n` +
        `Datenbank: ${dbSizeMB.toFixed(2)}MB / ${FREE_TIER_LIMITS.DATABASE_SIZE_MB}MB (${dbSizePercent.toFixed(1)}%)\n\n` +
        `**Sofortige Maßnahmen erforderlich:**\n` +
        `• Alte Logs löschen\n` +
        `• Unnötige Daten archivieren\n` +
        `• Datenbank aufräumen (VACUUM)\n` +
        `• Upgrade auf Pro prüfen`;
      
      await this.sendAlert('🆘 SUPABASE CRITICAL', message, 'high');
    }

    // Daily report (once per day)
    await this.sendDailyReport(stats);
  }

  /**
   * Format database size alert message
   */
  private formatDatabaseAlert(sizeMB: number, percent: number): string {
    const remainingMB = FREE_TIER_LIMITS.DATABASE_SIZE_MB - sizeMB;
    
    return `Datenbank-Nutzung: ${sizeMB.toFixed(2)}MB / ${FREE_TIER_LIMITS.DATABASE_SIZE_MB}MB (${percent.toFixed(1)}%)\n\n` +
      `*Verbleibend:* ${remainingMB.toFixed(2)}MB\n\n` +
      `*Empfohlene Aktionen:*\n` +
      `• Alte Logs und Events archivieren\n` +
      `• Temporäre Tabellen aufräumen\n` +
      `• Indizes optimieren (REINDEX)\n` +
      `• Nicht benutzte Daten löschen`;
  }

  /**
   * Format connection pool alert message
   */
  private formatConnectionAlert(active: number, percent: number): string {
    const remaining = FREE_TIER_LIMITS.CONNECTION_POOL_SIZE - active;
    
    return `Connection Pool: ${active} / ${FREE_TIER_LIMITS.CONNECTION_POOL_SIZE} (${percent.toFixed(1)}%)\n\n` +
      `*Verfügbar:* ${remaining} Verbindungen\n\n` +
      `*Empfohlene Aktionen:*\n` +
      `• Connection Pooling prüfen\n` +
      `• Datenbank-Verbindungen optimieren\n` +
      `• Idle Connections schließen\n` +
      `• Connection Timeout anpassen`;
  }

  /**
   * Send daily usage report
   */
  private async sendDailyReport(stats: UsageStats): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    if (this.alertState.dailyReportSent === today) {
      return; // Already sent today
    }

    const dbSizeMB = stats.databaseSize / (1024 * 1024);
    const dbPercent = (dbSizeMB / FREE_TIER_LIMITS.DATABASE_SIZE_MB) * 100;
    const storageGB = stats.storageSize / (1024 * 1024 * 1024);

    const message = `📊 Supabase Daily Report\n\n` +
      `*Datenbank:* ${dbSizeMB.toFixed(2)}MB / ${FREE_TIER_LIMITS.DATABASE_SIZE_MB}MB (${dbPercent.toFixed(1)}%)\n` +
      `*Storage:* ${storageGB.toFixed(2)}GB / ${FREE_TIER_LIMITS.STORAGE_SIZE_GB}GB\n` +
      `*Connections:* ${stats.connections.active} / ${FREE_TIER_LIMITS.CONNECTION_POOL_SIZE}\n` +
      `*Auth Users:* ${stats.authUsers}\n\n` +
      `*Free Tier Status:* ${dbPercent < 50 ? '✅ Optimal' : dbPercent < 80 ? '⚠️ Beobachten' : '🔴 Nahe Limit'}`;

    await this.sendAlert('📊 Supabase Daily Report', message, 'normal');
    this.alertState.dailyReportSent = today;
  }

  /**
   * Send alert via Telegram and/or Email
   */
  private async sendAlert(title: string, message: string, priority: 'high' | 'normal' = 'normal'): Promise<void> {
    const isQuietHours = this.isQuietHours();
    
    if (isQuietHours && priority !== 'high') {
      console.log(`[Supabase Monitor] Quiet hours - skipping ${priority} alert`);
      return;
    }

    // Try Telegram first
    if (this.config.telegramBotToken && this.config.telegramChatId) {
      try {
        await this.sendTelegramAlert(title, message, priority);
      } catch (e) {
        console.warn('[Supabase Monitor] Telegram failed, trying email:', e);
        await this.sendEmailAlert(title, message);
      }
    } else if (this.config.emailTo) {
      await this.sendEmailAlert(title, message);
    } else {
      console.warn('[Supabase Monitor] No alert channel configured');
    }
  }

  /**
   * Send Telegram alert
   */
  private async sendTelegramAlert(title: string, message: string, priority: 'high' | 'normal'): Promise<void> {
    const escapedTitle = title.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
    const escapedMessage = message.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
    
    const fullMessage = `*${escapedTitle}*\n\n${escapedMessage}`;
    
    const url = `https://api.telegram.org/bot${this.config.telegramBotToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: this.config.telegramChatId,
        text: fullMessage,
        parse_mode: 'MarkdownV2',
        disable_notification: priority !== 'high',
      }),
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status} ${await response.text()}`);
    }

    console.log('[Supabase Monitor] Telegram alert sent');
  }

  /**
   * Send Email alert (simplified - would use actual email service)
   */
  private async sendEmailAlert(title: string, message: string): Promise<void> {
    console.log('[Supabase Monitor] Would send email:', { title, to: this.config.emailTo });
    // Implementation would use SMTP or email service
  }

  /**
   * Check if currently in quiet hours
   */
  private isQuietHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    return hour >= this.config.quietHoursStart || hour < this.config.quietHoursEnd;
  }

  /**
   * Check if alert was already sent today
   */
  private hasAlertBeenSent(key: string, date: string): boolean {
    return this.alertState.lastAlertSent[key] === date;
  }

  /**
   * Mark alert as sent
   */
  private markAlertSent(key: string, date: string): void {
    this.alertState.lastAlertSent[key] = date;
  }

  /**
   * Load alert state from storage
   */
  private loadAlertState(): AlertState {
    // In production, load from file or database
    // For now, use in-memory state
    return {
      lastAlertSent: {},
      dailyReportSent: null,
    };
  }

  /**
   * Save alert state to storage
   */
  private saveAlertState(): void {
    // In production, save to file or database
    // Implementation depends on storage choice
  }

  /**
   * Get current usage summary
   */
  public async getUsageSummary(): Promise<{
    database: { used: number; limit: number; percent: number };
    storage: { used: number; limit: number; percent: number };
    connections: { active: number; limit: number; percent: number };
  }> {
    const stats = await this.fetchUsageStats();
    
    return {
      database: {
        used: stats.databaseSize / (1024 * 1024),
        limit: FREE_TIER_LIMITS.DATABASE_SIZE_MB,
        percent: (stats.databaseSize / FREE_TIER_LIMITS.DATABASE_SIZE_BYTES) * 100,
      },
      storage: {
        used: stats.storageSize / (1024 * 1024 * 1024),
        limit: FREE_TIER_LIMITS.STORAGE_SIZE_GB,
        percent: (stats.storageSize / FREE_TIER_LIMITS.STORAGE_SIZE_BYTES) * 100,
      },
      connections: {
        active: stats.connections.active,
        limit: stats.connections.max,
        percent: (stats.connections.active / stats.connections.max) * 100,
      },
    };
  }
}

// Usage example
async function main() {
  const monitor = new SupabaseUsageMonitor({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    quietHoursStart: parseInt(process.env.QUIET_HOURS_START || '23'),
    quietHoursEnd: parseInt(process.env.QUIET_HOURS_END || '7'),
  });

  await monitor.checkUsage();
}

// Export for use in Next.js API routes or scheduled jobs
export default SupabaseUsageMonitor;
export { FREE_TIER_LIMITS, ALERT_THRESHOLDS };
