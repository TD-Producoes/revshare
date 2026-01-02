import { NextRequest, NextResponse } from 'next/server'
import { scrapeWebsite } from '@/lib/services/website-scraper'

/**
 * API endpoint to scrape website information
 * POST /api/projects/scrape
 * Body: { url: string }
 */
export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Scrape the website using the service
    const result = await scrapeWebsite(url)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to scrape website' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Error in scrape API:', error)

    return NextResponse.json(
      { error: 'Failed to scrape website' },
      { status: 500 }
    )
  }
}

