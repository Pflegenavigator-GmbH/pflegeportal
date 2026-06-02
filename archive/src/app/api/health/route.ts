// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { writeFile } from 'fs/promises'
import os from 'os'
import path from 'path'
import { sendHealthAlert } from '@/lib/health-alerts'

const VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0'

interface HealthCheck {
  status: 'ok' | 'degraded' | 'error'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: {
      status: 'ok' | 'error'
      responseTime: number
      message?: string
    }
    filesystem: {
      status: 'ok' | 'error'
      writable: boolean
      message?: string
    }
    memory: {
      status: 'ok' | 'warning' | 'error'
      freeMB: number
      totalMB: number
      usedPercent: number
      message?: string
    }
    cpu: {
      status: 'ok' | 'warning' | 'error'
      loadAverage: number[]
      usagePercent: number
      message?: string
    }
  }
}

async function checkDatabase(): Promise<HealthCheck['checks']['database']> {
  const start = Date.now()
  try {
    const { error } = await supabaseServer.rpc('health_check')
    const responseTime = Date.now() - start
    
    if (error) {
      return {
        status: 'error',
        responseTime,
        message: error.message
      }
    }
    
    return {
      status: 'ok',
      responseTime
    }
  } catch (err) {
    return {
      status: 'error',
      responseTime: Date.now() - start,
      message: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

async function checkFilesystem(): Promise<HealthCheck['checks']['filesystem']> {
  const testPath = path.join(process.cwd(), 'tmp', 'health-test-' + Date.now())
  try {
    await writeFile(testPath, 'test', 'utf-8')
    await import('fs/promises').then(fs => fs.unlink(testPath).catch(() => {}))
    return {
      status: 'ok',
      writable: true
    }
  } catch (err) {
    return {
      status: 'error',
      writable: false,
      message: err instanceof Error ? err.message : 'Filesystem not writable'
    }
  }
}

function checkMemory(): HealthCheck['checks']['memory'] {
  const total = os.totalmem()
  const free = os.freemem()
  const used = total - free
  const usedPercent = Math.round((used / total) * 100)
  const freeMB = Math.round(free / 1024 / 1024)
  const totalMB = Math.round(total / 1024 / 1024)
  
  const status: 'ok' | 'warning' | 'error' = freeMB < 100 ? 'error' : freeMB < 500 ? 'warning' : 'ok'
  
  return {
    status,
    freeMB,
    totalMB,
    usedPercent,
    message: status !== 'ok' ? `Nur ${freeMB}MB freier Speicher verfügbar` : undefined
  }
}

function checkCPU(): HealthCheck['checks']['cpu'] {
  const loadAvg = os.loadavg()
  const cpuCount = os.cpus().length
  const loadPercent = Math.round((loadAvg[0] / cpuCount) * 100)
  
  const status: 'ok' | 'warning' | 'error' = loadPercent > 95 ? 'error' : loadPercent > 80 ? 'warning' : 'ok'
  
  return {
    status,
    loadAverage: loadAvg,
    usagePercent: loadPercent,
    message: status !== 'ok' ? `CPU-Auslastung bei ${loadPercent}%` : undefined
  }
}

export async function GET() {
  const checks = await Promise.all([
    checkDatabase(),
    checkFilesystem(),
    Promise.resolve(checkMemory()),
    Promise.resolve(checkCPU())
  ])
  
  const [database, filesystem, memory, cpu] = checks
  
  const hasError = database.status === 'error' || filesystem.status === 'error'
  const hasWarning = memory.status !== 'ok' || cpu.status !== 'ok' || database.status !== 'ok'
  
  const status: 'ok' | 'degraded' | 'error' = hasError ? 'error' : hasWarning ? 'degraded' : 'ok'
  
  const health: HealthCheck = {
    status,
    timestamp: new Date().toISOString(),
    version: VERSION,
    uptime: process.uptime(),
    checks: {
      database,
      filesystem,
      memory,
      cpu
    }
  }
  
  // Log health check
  await logHealthCheck(health)
  
  // Send alerts for failures
  if (database.status === 'error') {
    await sendHealthAlert('database', 'fail', database.message || 'Database connection failed', 'critical')
  }
  if (filesystem.status === 'error') {
    await sendHealthAlert('filesystem', 'fail', filesystem.message || 'Filesystem not writable', 'critical')
  }
  if (memory.status === 'error') {
    await sendHealthAlert('memory', 'fail', memory.message || 'Critical memory shortage', 'critical')
  }
  if (cpu.status === 'error') {
    await sendHealthAlert('cpu', 'fail', cpu.message || 'CPU overload', 'critical')
  }
  
  // Send recovery alerts
  if (database.status === 'ok') await sendRecoveryAlert('database')
  if (filesystem.status === 'ok') await sendRecoveryAlert('filesystem')
  if (memory.status === 'ok') await sendRecoveryAlert('memory')
  if (cpu.status === 'ok') await sendRecoveryAlert('cpu')
  
  const statusCode = status === 'error' ? 503 : status === 'degraded' ? 200 : 200
  
  return NextResponse.json(health, { status: statusCode })
}

async function sendRecoveryAlert(service: string) {
  const { getFailureCount, resetFailureCount } = await import('@/lib/health-alerts')
  if (getFailureCount(service) > 0) {
    await sendHealthAlert(service, 'recover', `${service} is back to normal`, 'warning')
    resetFailureCount(service)
  }
}

async function logHealthCheck(health: HealthCheck) {
  try {
    const logDir = path.join(process.cwd(), 'logs')
    const logPath = path.join(logDir, 'health-check.log')
    
    await import('fs/promises').then(fs => 
      fs.mkdir(logDir, { recursive: true }).catch(() => {})
    )
    
    const logEntry = {
      timestamp: health.timestamp,
      status: health.status,
      checks: health.checks
    }
    
    await import('fs/promises').then(fs => 
      fs.appendFile(logPath, JSON.stringify(logEntry) + '\n', 'utf-8').catch(() => {})
    )
  } catch {
    // Silent fail for logging
  }
}
