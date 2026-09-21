import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const host = process.env.NOCODB_HOST;
    const token = process.env.NOCODB_API_TOKEN || process.env.NOCODB_TOKEN;
    const tableId = process.env.NOCODB_TABLE_ID;

    if (!host || !token || !tableId) {
      console.error("Missing NocoDB environment variables");
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const url = `${host.replace(/\/$/, '')}/api/v2/tables/${tableId}/records`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xc-token': token
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NocoDB Error:", response.status, errorText);
      return NextResponse.json({ error: 'Failed to submit form' }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
