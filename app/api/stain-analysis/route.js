import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { runStubStainAnalysis } from '@/lib/stain-analysis/stub';

export async function POST(request) {
  const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const imageBase64 = body?.image_base64;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: 'image_base64 is required' }, { status: 400 });
    }

    const payload = {
      image_base64: imageBase64,
      garment_type: body?.garment_type || '',
      fabric_hint: body?.fabric_hint || '',
      store_id: body?.store_id || auth.user.store_id || null,
      request_id: body?.request_id,
    };

    const provider = process.env.STAIN_ANALYSIS_PROVIDER || 'stub';
    const remoteUrl = process.env.STAIN_ANALYSIS_URL;

    if (provider === 'remote' && remoteUrl) {
      const headers = { 'Content-Type': 'application/json' };
      if (process.env.HF_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.HF_TOKEN}`;
      }

      const remoteRes = await fetch(remoteUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });
      const remoteData = await remoteRes.json();
      if (!remoteRes.ok) {
        return NextResponse.json(
          { error: remoteData?.error || 'Remote stain analysis failed' },
          { status: remoteRes.status || 502 }
        );
      }
      return NextResponse.json({ ...remoteData, provider: 'remote' });
    }

    const result = await runStubStainAnalysis(payload);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Stain analysis failed:', error);
    return NextResponse.json({ error: 'Failed to analyze stain image' }, { status: 500 });
  }
}
