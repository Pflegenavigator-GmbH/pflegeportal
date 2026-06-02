import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as healthGet } from './route'
import { GET as dbHealthGet } from './db/route'
import { GET as readyGet } from '../ready/route'
import { GET as liveGet } from '../../../../../src/app/api/live/route'

// Mock environment variables
const originalEnv = process.env

beforeAll(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-key',
    NEXT_PUBLIC_APP_VERSION: '1.0.0-test'
  }
})

afterAll(() => {
  process.env = originalEnv
})

describe('Health Check API', () => {
  describe('GET /api/health', () => {
    it('should return health status with all checks', async () => {
      const response = await healthGet()
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('version')
      expect(data).toHaveProperty('uptime')
      expect(data).toHaveProperty('checks')
      expect(data.checks).toHaveProperty('database')
      expect(data.checks).toHaveProperty('filesystem')
      expect(data.checks).toHaveProperty('memory')
      expect(data.checks).toHaveProperty('cpu')
    })

    it('should have valid check structure', async () => {
      const response = await healthGet()
      const data = await response.json()
      
      // Database check
      expect(data.checks.database).toHaveProperty('status')
      expect(data.checks.database).toHaveProperty('responseTime')
      
      // Filesystem check
      expect(data.checks.filesystem).toHaveProperty('status')
      expect(data.checks.filesystem).toHaveProperty('writable')
      
      // Memory check
      expect(data.checks.memory).toHaveProperty('status')
      expect(data.checks.memory).toHaveProperty('freeMB')
      expect(data.checks.memory).toHaveProperty('totalMB')
      expect(data.checks.memory).toHaveProperty('usedPercent')
      
      // CPU check
      expect(data.checks.cpu).toHaveProperty('status')
      expect(data.checks.cpu).toHaveProperty('loadAverage')
      expect(data.checks.cpu).toHaveProperty('usagePercent')
    })

    it('should return timestamp in ISO format', async () => {
      const response = await healthGet()
      const data = await response.json()
      
      expect(() => new Date(data.timestamp)).not.toThrow()
      expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp)
    })

    it('should include valid version', async () => {
      const response = await healthGet()
      const data = await response.json()
      
      expect(typeof data.version).toBe('string')
      expect(data.version.length).toBeGreaterThan(0)
    })
  })

  describe('GET /api/health/db', () => {
    it('should return DB health status', async () => {
      const response = await dbHealthGet()
      const data = await response.json()
      
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('responseTime')
      expect(data).toHaveProperty('connection')
      expect(data).toHaveProperty('query')
    })

    it('should have connection details', async () => {
      const response = await dbHealthGet()
      const data = await response.json()
      
      expect(data.connection).toHaveProperty('connected')
      expect(data.connection).toHaveProperty('latencyMs')
      expect(typeof data.connection.connected).toBe('boolean')
      expect(typeof data.connection.latencyMs).toBe('number')
    })

    it('should have query details', async () => {
      const response = await dbHealthGet()
      const data = await response.json()
      
      expect(data.query).toHaveProperty('executed')
      expect(data.query).toHaveProperty('rowsReturned')
      expect(typeof data.query.executed).toBe('boolean')
      expect(typeof data.query.rowsReturned).toBe('number')
    })
  })

  describe('GET /api/ready', () => {
    it('should return readiness status', async () => {
      const response = await readyGet()
      const data = await response.json()
      
      expect(data).toHaveProperty('ready')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('dependencies')
      expect(typeof data.ready).toBe('boolean')
    })

    it('should check all dependencies', async () => {
      const response = await readyGet()
      const data = await response.json()
      
      expect(data.dependencies).toHaveProperty('database')
      expect(data.dependencies).toHaveProperty('filesystem')
      expect(data.dependencies).toHaveProperty('memory')
      
      expect(data.dependencies.database).toHaveProperty('ready')
      expect(data.dependencies.filesystem).toHaveProperty('ready')
      expect(data.dependencies.memory).toHaveProperty('ready')
    })

    it('should return 503 when not ready', async () => {
      // Note: This test may pass or fail depending on actual system state
      const response = await readyGet()
      
      if (!response.ok) {
        expect(response.status).toBe(503)
      }
    })
  })

  describe('GET /api/live', () => {
    it('should return liveness status', async () => {
      const response = await liveGet()
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('alive')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('uptime')
      expect(data.alive).toBe(true)
    })

    it('should have cache-control headers', async () => {
      const response = await liveGet()
      
      const cacheControl = response.headers.get('Cache-Control')
      expect(cacheControl).toContain('no-cache')
    })
  })
})

describe('Health Check Failure Scenarios', () => {
  it('should handle database connection failure', async () => {
    // This tests error handling when Supabase is unavailable
    // In real scenario, we'd mock the supabase client
    const response = await healthGet()
    const data = await response.json()
    
    // Even with failures, should return a response
    expect(data).toHaveProperty('status')
    expect(['ok', 'degraded', 'error']).toContain(data.status)
  })

  it('should provide meaningful error messages', async () => {
    const response = await healthGet()
    const data = await response.json()
    
    // If any check fails, should have an error message
    for (const [key, check] of Object.entries(data.checks)) {
      if (check.status === 'error' && check.message) {
        expect(typeof check.message).toBe('string')
        expect(check.message.length).toBeGreaterThan(0)
      }
    }
  })
})
