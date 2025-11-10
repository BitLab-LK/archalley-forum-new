import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return redirectToCompetition(request)
}

export async function POST(request: NextRequest) {
  return redirectToCompetition(request)
}

export async function PUT(request: NextRequest) {
  return redirectToCompetition(request)
}

export async function DELETE(request: NextRequest) {
  return redirectToCompetition(request)
}

export async function PATCH(request: NextRequest) {
  return redirectToCompetition(request)
}

function redirectToCompetition(request: NextRequest) {
  // Redirect /competition to /events/archalley-competition-2025
  const url = new URL('/events/archalley-competition-2025', request.url)
  
  // Preserve query parameters if any
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value)
  })
  
  return NextResponse.redirect(url, 308) // 308 Permanent Redirect (preserves method)
}

