// src/app/api/health/db/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

interface DBHealthCheck {
  status: 'ok' | 'error'
  timestamp: string
  responseTime: number
  connection: {
    connected: boolean
    latencyMs: number
  }
  query: {
    executed: boolean
    rowsReturned: number
    error?: string
  }
  version?: string
  message?: string
}

export async function GET() {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()
  
  const result: DBHealthCheck = {
    status: 'ok',
    timestamp,
    responseTime: 0,
    connection: {
      connected: false,
      latencyMs: 0
    },
    query: {
      executed: false,
      rowsReturned: 0
    }
  }
  
  try {
    // Test connection with simple RPC call
    const connectionStart = Date.now()
    const { data: version, error: versionError } = await supabaseServer.rpc('version')
    result.connection.latencyMs = Date.now() - connectionStart
    result.connection.connected = !versionError
    
    if (versionError) {
      result.status = 'error'
      result.message = `Connection failed: ${versionError.message}`
      result.responseTime = Date.now() - startTime
      return NextResponse.json(result, { status: 503 })
    }
    
    result.version = version
    
    // Execute a simple query to test full functionality
    const queryStart = Date.now()
    const { data, error: queryError, count } = await supabaseServer
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .limit(1)
    
    result.query.executed = !queryError
    result.query.rowsReturned = count || 0
    
    if (queryError) {
      result.query.error = queryError.message
      result.status = 'error'
      result.message = `Query failed: ${queryError.message}`
      result.responseTime = Date.now() - startTime
      return NextResponse.json(result, { status: 503 })
    }
    
    result.responseTime = Date.now() - startTime
    result.status = 'ok'
    
    return NextResponse.json(result, { 
      status: 200,
      headers: {
        'X-Response-Time': `${result.responseTime}ms`
      }
    })
    
  } catch (err) {
    result.status = 'error'
    result.responseTime = Date.now() - startTime
    result.message = err instanceof Error ? err.message : 'Unknown database error'
    
    return NextResponse.json(result, { status: 503 })
  }
}
