import { NextResponse } from 'next/server';

/**
 * POST /api/chat
 *
 * Проксирует запрос от браузерного виджета на Express chatbot-сервер.
 * Chatbot-сервер адресован через серверную env-переменную CHATBOT_URL —
 * она никогда не попадает в браузер.
 *
 * Body:  { sessionId?: string; text: string }
 * Reply: { sessionId: string; reply: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const chatbotUrl = process.env.CHATBOT_URL;
    if (!chatbotUrl) {
      console.error('[api/chat] CHATBOT_URL не задан');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const upstream = `${chatbotUrl.replace(/\/$/, '')}/api/chat`;

    const upstream_res = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // Таймаут 30 сек — Gemini может думать долго
      signal: AbortSignal.timeout(30_000),
    });

    const data = await upstream_res.json();

    if (!upstream_res.ok) {
      console.error('[api/chat] Upstream error:', upstream_res.status, data);
      return NextResponse.json(
        { error: data?.error ?? 'Upstream error' },
        { status: upstream_res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[api/chat] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
