const { query } = require('./lib/db/db');

async function migrate() {
  console.log('--- Starting Order Sequence Migration ---');
  
  try {
    // 1. Fetch all order numbers to determine the true max numeric value
    const res = await query('SELECT order_number FROM orders');
    let maxNum = 1000;

    res.rows.forEach(row => {
      const numMatch = row.order_number.match(/\d+$/); // Match digits at the end
      if (numMatch) {
        const num = parseInt(numMatch[0]);
        if (num > maxNum) maxNum = num;
      }
    });

    console.log(`Current max order number found: ${maxNum}`);
    const nextVal = maxNum + 1;

    // 2. Create the sequence
    console.log('Creating/resetting sequence to:', nextVal);
    await query(`CREATE SEQUENCE IF NOT EXISTS order_number_seq START ${nextVal}`);
    await query(`SELECT setval('order_number_seq', ${maxNum})`); // Sets current value to maxNum, next nextval() will be maxNum+1

    // 3. Fix the CF-NaN entry if it exists
    await query("UPDATE orders SET order_number = 'CF-FIXED-' || id WHERE order_number = 'CF-NaN'");
    
    console.log('--- Migration Successful ---');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
