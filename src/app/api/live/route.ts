// src/app/live/route.ts
import { NextResponse } from 'next/server';

interface LivenessCheck {
  alive: boolean;
  timestamp: string;
  uptime: number;
}

/**
 * Kubernetes-style liveness probe
 * Returns 200 OK as long as the application is running
 * Should be a simple, fast check that only verifies the process is alive
 */
export async function GET() {
  const result: LivenessCheck = {
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  return NextResponse.json(result, {
    status: 200,
    headers: {
      // Prevent caching
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}
