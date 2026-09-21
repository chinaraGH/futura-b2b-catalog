import { NextResponse } from 'next/server';

// ─── Типы ────────────────────────────────────────────────────────────────────

interface ContactFormData {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  service?: unknown;
  intent?: unknown;
  message?: unknown;
}

// ─── Вспомогательные функции ─────────────────────────────────────────────────

/** Приводит значение к строке; возвращает undefined, если пустое */
function toStr(val: unknown): string | undefined {
  if (val === null || val === undefined) return undefined;
  const s = String(val).trim();
  return s.length > 0 ? s : undefined;
}

/** Простая валидация email */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // 1. Читаем тело запроса
    const body: ContactFormData = await req.json();

    // 2. Проверяем env-переменные (только серверные — не попадут в браузер)
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[contact] Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // 3. Санитизация и маппинг полей формы → колонки таблицы `leads`
    const name = toStr(body.name);
    const email = toStr(body.email);

    if (!name) {
      return NextResponse.json({ error: 'Field "name" is required' }, { status: 400 });
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid "email" is required' }, { status: 400 });
    }

    const payload = {
      name,
      email,
      phone: toStr(body.phone) ?? null,
      service: toStr(body.service) ?? null,
      intent: toStr(body.intent) ?? null,
      message: toStr(body.message) ?? null,
      source: 'landing',
      status: 'new',
    };

    // 4. Вставка в Supabase через PostgREST REST API
    //    Используем service_role ключ — только на сервере, никогда в браузер.
    const supabaseEndpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/leads`;

    const response = await fetch(supabaseEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal', // не возвращать вставленную строку (быстрее)
      },
      body: JSON.stringify(payload),
    });

    // 5. Обработка ответа Supabase
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[contact] Supabase insert error:', response.status, errorBody);
      return NextResponse.json(
        { error: 'Failed to submit form' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[contact] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
