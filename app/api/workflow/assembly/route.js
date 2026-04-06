import { query, logSystemEvent } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { STAGE_THRESHOLDS } from '@/lib/workflow-thresholds';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const storeId = auth.user.store_id;

    // Fetch all active order items with workflow history and last transition timestamp
    const res = await query(`
      SELECT 
        oi.id,
        oi.order_id,
        oi.garment_type,
        oi.service_type,
        oi.quantity,
        oi.price,
        oi.status,
        oi.tag_id,
        oi.bag_id,
        oi.incident_status,
        oi.incident_notes,
        oi.notes as item_notes,
        oi.created_at as item_created_at,
        o.order_number,
        o.status as order_status,
        o.pickup_date,
        o.delivery_date,
        o.created_at as order_created_at,
        c.name as customer_name,
        c.phone as customer_phone,
        (SELECT MAX(timestamp) FROM garment_workflow gw WHERE gw.order_item_id = oi.id) as last_stage_change,
        (SELECT STRING_AGG(gw.stage || ':' || gw.timestamp, '|' ORDER BY gw.timestamp) 
         FROM garment_workflow gw WHERE gw.order_item_id = oi.id) as workflow_history,
        (SELECT COUNT(*) FROM garment_workflow gw WHERE gw.order_item_id = oi.id) as stage_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.store_id = $1
        AND o.status NOT IN ('cancelled')
        AND oi.status != 'delivered'
      ORDER BY oi.created_at DESC
    `, [storeId]);

    // Process bottlenecks
    const activeItems = res.rows.map(item => {
      const now = new Date();
      const lastChange = new Date(item.last_stage_change || item.item_created_at);
      const dwellTimeMinutes = Math.floor((now - lastChange) / (1000 * 60));
      const threshold = STAGE_THRESHOLDS[item.status];
      const isBottleneck = threshold && dwellTimeMinutes > threshold;

      return {
        ...item,
        dwell_time_minutes: dwellTimeMinutes,
        is_bottleneck: isBottleneck,
        threshold: threshold
      };
    });

    // Logging new bottlenecks (async/fire-and-forget for performance)
    activeItems.forEach(async (item) => {
      if (item.is_bottleneck) {
        // Check if we've already logged this specific bottleneck (item + stage)
        // This prevents spamming logs on every refresh
        const logCheck = await query(`
          SELECT id FROM system_logs 
          WHERE event_type = 'PRODUCTION_BOTTLENECK' 
            AND description LIKE $1 
            AND created_at > (SELECT MAX(timestamp) FROM garment_workflow WHERE order_item_id = $2)
          LIMIT 1
        `, [`%Item ${item.tag_id}%Stage ${item.status}%`, item.id]);

        if (logCheck.rows.length === 0) {
          logSystemEvent(
            'PRODUCTION_BOTTLENECK',
            `Item ${item.tag_id} (${item.garment_type}) is stuck in Stage ${item.status} for ${item.dwell_time_minutes}m (Limit: ${item.threshold}m)`,
            'warning',
            storeId
          );
        }
      }
    });

    // Also fetch recently completed items
    const completedRes = await query(`
      SELECT 
        oi.id,
        oi.order_id,
        oi.garment_type,
        oi.service_type,
        oi.quantity,
        oi.price,
        oi.status,
        oi.tag_id,
        oi.bag_id,
        oi.incident_status,
        oi.notes as item_notes,
        oi.created_at as item_created_at,
        o.order_number,
        o.status as order_status,
        o.created_at as order_created_at,
        c.name as customer_name,
        c.phone as customer_phone
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.store_id = $1
        AND (oi.status = 'delivered' OR oi.status = 'ready')
        AND oi.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY oi.created_at DESC
      LIMIT 20
    `, [storeId]);

    // Summary stats
    const statsRes = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE oi.status = 'received') as received_count,
        COUNT(*) FILTER (WHERE oi.status IN ('sorting', 'washing', 'dry_cleaning', 'drying')) as processing_count,
        COUNT(*) FILTER (WHERE oi.status IN ('ironing', 'quality_check')) as finishing_count,
        COUNT(*) FILTER (WHERE oi.status = 'ready') as ready_count,
        COUNT(*) as total_active
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.store_id = $1 AND o.status NOT IN ('cancelled', 'delivered')
    `, [storeId]);

    return NextResponse.json({
      active: activeItems,
      completed: completedRes.rows,
      stats: statsRes.rows[0] || {},
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
