import { NextResponse } from 'next/server';
import { ses } from '@/lib/ses-client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, message, simulationType } = body;

    const params = {
      Destination: { ToAddresses: [to] },
      Message: {
        Body: { Text: { Data: message } },
        Subject: { Data: subject },
      },
      Source: 'sender@example.com', // 발신자 이메일 주소
    };

    const result = await ses.sendEmail(params).promise();

    // 시뮬레이션 타입에 따른 응답
    switch (simulationType) {
      case 'bounce':
        return NextResponse.json({ error: 'Simulated bounce', messageId: result.MessageId }, { status: 400 });
      case 'complaint':
        return NextResponse.json({ message: 'Email sent, but simulated complaint received', messageId: result.MessageId });
      case 'reject':
        return NextResponse.json({ error: 'Simulated reject', messageId: result.MessageId }, { status: 403 });
      default:
        return NextResponse.json({ messageId: result.MessageId });
    }
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}