// =============================================================================
// CUSTOM ERROR CLASSES - PflegeNavigator
// Zentrale Fehlerbehandlung für Frontend und API
// =============================================================================
// src/app/lib/api/errors
export enum ErrorCode {
  // Client-Fehler (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  
  // Server-Fehler (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Spezifische Fehler
  SUPABASE_ERROR = 'SUPABASE_ERROR',
  STRIPE_ERROR = 'STRIPE_ERROR',
  N8N_ERROR = 'N8N_ERROR',
  
  // Allgemein
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

export interface ErrorDetails {
  code: ErrorCode
  message: string
  userMessage: string // Anzeige für Nutzer
  statusCode?: number
  retryable?: boolean // Kann der User es nochmal versuchen?
  logLevel: 'debug' | 'info' | 'warning' | 'error' | 'critical'
}

// Basis-Error-Klasse
export class PflegeNavigatorError extends Error {
  public readonly code: ErrorCode
  public readonly userMessage: string
  public readonly statusCode: number
  public readonly retryable: boolean
  public readonly logLevel: ErrorDetails['logLevel']
  public readonly timestamp: string
  public readonly context?: Record<string, any>

  constructor(details: ErrorDetails, context?: Record<string, any>) {
    super(details.message)
    this.name = 'PflegeNavigatorError'
    this.code = details.code
    this.userMessage = details.userMessage
    this.statusCode = details.statusCode || 500
    this.retryable = details.retryable ?? false
    this.logLevel = details.logLevel
    this.timestamp = new Date().toISOString()
    this.context = context
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      statusCode: this.statusCode,
      retryable: this.retryable,
      timestamp: this.timestamp,
      context: this.context
    }
  }
}

// Spezifische Error-Klassen
export class ValidationError extends PflegeNavigatorError {
  constructor(message: string, context?: Record<string, any>) {
    super({
      code: ErrorCode.VALIDATION_ERROR,
      message,
      userMessage: 'Bitte überprüfen Sie Ihre Eingaben.',
      statusCode: 400,
      retryable: true,
      logLevel: 'info'
    }, context)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends PflegeNavigatorError {
  constructor(resource: string, identifier?: string) {
    super({
      code: ErrorCode.NOT_FOUND,
      message: `${resource} nicht gefunden: ${identifier || 'unbekannt'}`,
      userMessage: 'Die angeforderte Ressource wurde nicht gefunden.',
      statusCode: 404,
      retryable: false,
      logLevel: 'info'
    }, { resource, identifier })
    this.name = 'NotFoundError'
  }
}

export class DatabaseError extends PflegeNavigatorError {
  constructor(message: string, originalError?: any) {
    super({
      code: ErrorCode.DATABASE_ERROR,
      message: `Datenbankfehler: ${message}`,
      userMessage: 'Ein technischer Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
      statusCode: 500,
      retryable: true,
      logLevel: 'error'
    }, { originalError: originalError?.message || originalError })
    this.name = 'DatabaseError'
  }
}

export class SupabaseError extends PflegeNavigatorError {
  constructor(message: string, supabaseCode?: string) {
    super({
      code: ErrorCode.SUPABASE_ERROR,
      message: `Supabase Fehler: ${message}`,
      userMessage: 'Verbindungsproblem mit der Datenbank. Bitte laden Sie die Seite neu.',
      statusCode: 503,
      retryable: true,
      logLevel: 'error'
    }, { supabaseCode })
    this.name = 'SupabaseError'
  }
}

export class NetworkError extends PflegeNavigatorError {
  constructor(message: string = 'Netzwerkfehler') {
    super({
      code: ErrorCode.NETWORK_ERROR,
      message,
      userMessage: 'Keine Internetverbindung. Bitte überprüfen Sie Ihre Verbindung.',
      statusCode: 0,
      retryable: true,
      logLevel: 'warning'
    })
    this.name = 'NetworkError'
  }
}

export class TimeoutError extends PflegeNavigatorError {
  constructor(operation: string, timeoutMs: number) {
    super({
      code: ErrorCode.TIMEOUT_ERROR,
      message: `Operation "${operation}" timed out after ${timeoutMs}ms`,
      userMessage: 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.',
      statusCode: 504,
      retryable: true,
      logLevel: 'warning'
    }, { operation, timeoutMs })
    this.name = 'TimeoutError'
  }
}

// Helper: Error aus beliebiger Quelle normalisieren
export function normalizeError(error: unknown): PflegeNavigatorError {
  if (error instanceof PflegeNavigatorError) {
    return error
  }

  if (error instanceof Error) {
    // Netzwerk-Fehler erkennen
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new NetworkError(error.message)
    }
    
    // Timeout erkennen
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return new TimeoutError('request', 30000)
    }

    return new PflegeNavigatorError({
      code: ErrorCode.UNKNOWN_ERROR,
      message: error.message,
      userMessage: 'Ein unerwarteter Fehler ist aufgetreten.',
      statusCode: 500,
      retryable: false,
      logLevel: 'error'
    }, { stack: error.stack })
  }

  return new PflegeNavigatorError({
    code: ErrorCode.UNKNOWN_ERROR,
    message: String(error),
    userMessage: 'Ein unerwarteter Fehler ist aufgetreten.',
    statusCode: 500,
    retryable: false,
    logLevel: 'error'
  })
}

// Helper: Ist der Fehler retryable?
export function isRetryableError(error: unknown): boolean {
  if (error instanceof PflegeNavigatorError) {
    return error.retryable
  }
  return false
}

// Helper: Sollte der Fehler geloggt werden?
export function shouldLogError(error: unknown): boolean {
  if (error instanceof PflegeNavigatorError) {
    return error.logLevel !== 'debug'
  }
  return true
}
