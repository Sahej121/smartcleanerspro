import { NextResponse } from 'next/server';

export async function GET(request) {
  // Protect with a simple secret if needed, but for a keep-alive it's mostly harmless
  const authHeader = request.headers.get('Authorization');
  // Optional: if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) ...

  const results = [];
  
  // 1. Ping Hugging Face Space
  const hfUrl = process.env.STAIN_ANALYSIS_URL;
  if (hfUrl) {
    try {
      const hfRes = await fetch(hfUrl, { 
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${process.env.HF_TOKEN}`
        }
      });
      results.push({ service: 'huggingface', status: hfRes.status });
    } catch (err) {
      results.push({ service: 'huggingface', status: 'error', message: err.message });
    }
  }

  // 2. Self-ping to keep Vercel function warm (if needed)
  results.push({ service: 'app', status: 'warm' });

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results
  });
}
