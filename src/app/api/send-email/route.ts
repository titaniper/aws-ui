import { NextResponse } from 'next/server';
import { ses } from '@/lib/ses-client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, message } = body;

    const params = {
      Destination: { ToAddresses: [to] },
      Message: {
        Body: { Text: { Data: message } },
        Subject: { Data: subject },
      },
      Source: 'sender@example.com', // 발신자 이메일 주소
    };
    console.log('11');
    const result = await ses.sendEmail(params).promise();
    return NextResponse.json({ messageId: result.MessageId });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}