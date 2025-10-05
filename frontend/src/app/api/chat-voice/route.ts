import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Basic handler, can be expanded later
    const body = await req.json();
    const { message } = body;

    console.log('Received message:', message);

    return NextResponse.json({ reply: `You said: ${message}` });
  } catch (error) {
    console.error('Error in chat-voice API:', error);
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 });
  }
}
