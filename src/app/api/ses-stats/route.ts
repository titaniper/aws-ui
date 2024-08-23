import { NextResponse } from 'next/server';
import { ses } from '@/lib/ses-client';

export async function GET() {
  try {
    const [sendStatistics, sendQuota] = await Promise.all([
      ses.getSendStatistics().promise(),
      ses.getSendQuota().promise()
    ]);

    return NextResponse.json({ sendStatistics, sendQuota });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch SES statistics' }, { status: 500 });
  }
}