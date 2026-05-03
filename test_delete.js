require('dotenv').config();
const db = require('./src/config/db');

async function testDelete() {
  const id = 52;
  try {
    console.log("Deleting order_items...");
    await db.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM grocery_orders WHERE user_id = $1)', [id]);
    console.log("Deleting grocery_orders...");
    await db.query('DELETE FROM grocery_orders WHERE user_id = $1', [id]);
    console.log("Success deleting grocery_orders");
  } catch (err) {
    console.error("Failed on grocery_orders:", err.message);
  } finally {
    process.exit(0);
  }
}
testDelete();
