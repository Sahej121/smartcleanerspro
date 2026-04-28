import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db/db';

export async function POST(request) {
  const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { images, store_id } = await request.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Images are required' }, { status: 400 });
    }

    // In a real scenario, we would send these images to Gemini Pro Vision.
    // Here we simulate the AI logic.
    
    // Fetch store pricing to match recognized items
    const pricingRes = await query(
      'SELECT id, garment_type, service_type, price FROM pricing WHERE store_id = $1',
      [store_id || auth.user.store_id]
    );
    const pricing = pricingRes.rows;

    // Simulated AI Recognition Logic
    // We "recognize" 1-2 items per photo for demo purposes
    const recognizedItems = [];
    
    const possibleItems = [
      { garment: 'Shirt', service: 'Dry Cleaning' },
      { garment: 'Trousers', service: 'Dry Cleaning' },
      { garment: 'Suit', service: 'Dry Cleaning' },
      { garment: 'Dress', service: 'Dry Cleaning' },
      { garment: 'Saree', service: 'Dry Cleaning' },
      { garment: 'Blanket', service: 'Laundry' },
    ];

    images.forEach((img, index) => {
      // Pick a random item from the list
      const random = possibleItems[Math.floor(Math.random() * possibleItems.length)];
      
      // Find matching price in store pricing
      const match = pricing.find(p => 
        p.garment_type.toLowerCase().includes(random.garment.toLowerCase()) &&
        p.service_type.toLowerCase().includes(random.service.toLowerCase())
      ) || pricing[0]; // Fallback to first pricing item if no match

      if (match) {
        recognizedItems.push({
          ...match,
          confidence: 0.85 + (Math.random() * 0.1), // 85-95% confidence
          photo_index: index,
          quantity: 1,
          notes: 'Auto-detected from photo'
        });
      }
    });

    return NextResponse.json({
      items: recognizedItems,
      message: 'AI recognition complete',
      model: 'Gemini-1.5-Flash (Simulated)'
    });

  } catch (error) {
    console.error('Recognition failed:', error);
    return NextResponse.json({ error: 'Failed to process images' }, { status: 500 });
  }
}
