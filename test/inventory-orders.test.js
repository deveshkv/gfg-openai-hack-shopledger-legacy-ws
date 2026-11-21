const { test } = require('node:test');
const assert = require('node:assert/strict');

const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

test('stock check allows ordering exactly all sellable units but rejects exceeding stock', () => {
  const products = [{ id: 7, name: 'In-memory item', stock: 1, reserved: 0 }];
  const items = [{ id: 7, qty: 1 }];

  assert.deepEqual(inventory.check(products, items), { ok: true });
  assert.equal(inventory.check(products, [{ id: 7, qty: 2 }]).ok, false);
});

test('cancelling an order restores deducted stock using the order line ID', () => {
  const items = [{ id: 7, sku: 'ITEM-7', name: 'In-memory item', price: 10, qty: 1 }];
  const db = {
    products: [{ id: 7, name: 'In-memory item', stock: 5, reserved: 0 }],
    orders: [{ id: 44, status: 'completed', items }]
  };

  inventory.reserve(db.products, items);
  assert.equal(db.products[0].stock, 4);

  const result = orders.cancel(db, 44, 'in-memory test');

  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.equal(db.products[0].stock, 5);
});

test('cancelling an order restores stock when a legacy line uses productId', () => {
  const db = {
    products: [{ id: 7, name: 'In-memory item', stock: 4, reserved: 0 }],
    orders: [{
      id: 45,
      status: 'completed',
      items: [{ productId: 7, name: 'In-memory item', qty: 1 }]
    }]
  };

  const result = orders.cancel(db, 45, 'in-memory legacy-shape test');

  assert.equal(result.ok, true);
  assert.equal(db.products[0].stock, 5);
});
