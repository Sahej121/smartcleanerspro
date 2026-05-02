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
      request_id: body?.request_id || `req_${Date.now()}`,
    };

    const provider = process.env.STAIN_ANALYSIS_PROVIDER || 'stub';
    const remoteUrl = process.env.STAIN_ANALYSIS_URL;

    if (provider === 'remote' && remoteUrl) {
      const headers = { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (process.env.HF_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.HF_TOKEN}`;
      }

      // Retry logic for "Space sleeping" or temporary network issues
      let lastError = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`[Stain Analysis] Attempt ${attempt} to connect to ${remoteUrl}`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

          const remoteRes = await fetch(remoteUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          const remoteData = await remoteRes.json();
          if (remoteRes.ok) {
            return NextResponse.json({ ...remoteData, provider: 'remote', attempts: attempt });
          }

          lastError = remoteData?.error || `Remote failed with status ${remoteRes.status}`;
          
          // If it's a 502/503/504, it might be waking up, so wait and retry
          if ([502, 503, 504].includes(remoteRes.status)) {
            console.warn(`[Stain Analysis] Remote space is busy/waking (Status ${remoteRes.status}). Retrying...`);
            await new Promise(r => setTimeout(r, 2000 * attempt));
            continue;
          }
          
          // Other errors (4xx) usually shouldn't be retried
          break;
        } catch (err) {
          lastError = err.message;
          console.error(`[Stain Analysis] Attempt ${attempt} failed:`, err.message);
          if (attempt < 3) await new Promise(r => setTimeout(r, 1000));
        }
      }

      return NextResponse.json(
        { error: lastError || 'Remote stain analysis failed after retries', provider: 'remote' },
        { status: 502 }
      );
    }

    // Fallback to stub if provider is not remote
    const result = await runStubStainAnalysis(payload);
    return NextResponse.json({ ...result, provider: 'stub' });

  } catch (error) {
    console.error('[Stain Analysis API Error]', error);
    return NextResponse.json({ error: 'Failed to analyze stain image' }, { status: 500 });
  }
}
