import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';

export async function POST(req) {
  try {
    const { code, subtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const { rows } = await query(
      `SELECT * FROM coupons 
       WHERE code = $1 AND is_active = TRUE 
       AND (expiry_date IS NULL OR expiry_date > NOW())`,
      [code.toUpperCase()]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired coupon' }, { status: 404 });
    }

    const coupon = rows[0];

    if (parseFloat(subtotal) < parseFloat(coupon.min_order_value)) {
      return NextResponse.json({ 
        error: `Minimum order value for this coupon is ₹${coupon.min_order_value}` 
      }, { status: 400 });
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percent') {
      discountAmount = (parseFloat(subtotal) * parseFloat(coupon.discount_value)) / 100;
    } else {
      discountAmount = parseFloat(coupon.discount_value);
    }

    // Cap discount at subtotal
    discountAmount = Math.min(discountAmount, parseFloat(subtotal));

    return NextResponse.json({ 
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discountAmount: discountAmount
    });
  } catch (err) {
    console.error('Coupon validation error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
