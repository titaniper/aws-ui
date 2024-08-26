// app/api/ses-messages/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');
  
  const url = email
    ? `http://localhost:4566/_aws/ses?email=${encodeURIComponent(email)}`
    : 'http://localhost:4566/_aws/ses';

  try {
    const response = await fetch(url);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching SES messages:', error);
    return NextResponse.json({ error: 'Failed to fetch SES messages' }, { status: 500 });
  }
}