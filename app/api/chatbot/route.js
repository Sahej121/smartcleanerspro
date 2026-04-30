import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function POST(request) {
  const auth = await requireRole(request, ['owner', 'manager']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { message } = await request.json();
    const query = message.toLowerCase();
    
    let reply = "I'm your AI assistant. I can help with store insights, policies, and operational predictions.";

    if (query.includes('friday') && query.includes('order')) {
      reply = "Based on the historical data, you processed 142 orders last Friday. This is 15% above your weekly average.";
    } else if (query.includes('leather') || query.includes('policy')) {
      reply = "For damaged leather items, our policy is to request a signed customer consent form before treatment, and to use the solvent-free gentle cleaning cycle with an extended 48-hour air dry. A premium cleaning fee is recommended.";
    } else if (query.includes('schedule') || query.includes('busy')) {
      reply = "Saturdays and Mondays are consistently your busiest days. I recommend scheduling an extra front desk clerk during the 9 AM - 1 PM rush hours on these days.";
    } else if (query.includes('stain')) {
      reply = "The AI stain detector currently recognizes 7 major stain categories. Would you like a breakdown of the most common stains processed this week?";
    }

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process chat query' }, { status: 500 });
  }
}
