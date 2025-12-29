import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Basic health check
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };

    // Optional: Add database health check
    // try {
    //   await prisma.$queryRaw`SELECT 1`;
    //   healthCheck.database = 'connected';
    // } catch (error) {
    //   healthCheck.database = 'disconnected';
    //   healthCheck.status = 'degraded';
    // }

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
