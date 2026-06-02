// src/app/api/ready/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { access } from 'fs/promises'
import { constants } from 'fs'
import os from 'os'

interface ReadinessCheck {
  ready: boolean
  timestamp: string
  dependencies: {
    database: {
      ready: boolean
      message?: string
    }
    filesystem: {
      ready: boolean
      message?: string
    }
    memory: {
      ready: boolean
      message?: string
    }
  }
}

export async function GET() {
  const timestamp = new Date().toISOString()
  const dependencies: ReadinessCheck['dependencies'] = {
    database: { ready: false },
    filesystem: { ready: false },
    memory: { ready: false }
  }
  
  // Check database
  try {
    const { error } = await supabaseServer.rpc('health_check')
    if (error) {
      dependencies.database.message = error.message
    } else {
      dependencies.database.ready = true
    }
  } catch (err) {
    dependencies.database.message = err instanceof Error ? err.message : 'Database connection failed'
  }
  
  // Check filesystem
  try {
    await access(process.cwd(), constants.R_OK | constants.W_OK)
    dependencies.filesystem.ready = true
  } catch (err) {
    dependencies.filesystem.message = 'Filesystem not accessible'
  }
  
  // Check memory (need at least 500MB free)
  const freeMB = Math.round(os.freemem() / 1024 / 1024)
  if (freeMB >= 500) {
    dependencies.memory.ready = true
  } else {
    dependencies.memory.message = `Insufficient memory: ${freeMB}MB free (minimum 500MB required)`
  }
  
  const ready = dependencies.database.ready && dependencies.filesystem.ready && dependencies.memory.ready
  
  const result: ReadinessCheck = {
    ready,
    timestamp,
    dependencies
  }
  
  // Kubernetes readiness probe returns 200 if ready, otherwise non-2xx
  return NextResponse.json(result, { status: ready ? 200 : 503 })
}
