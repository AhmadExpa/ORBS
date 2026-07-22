import assert from "node:assert/strict";
import test from "node:test";
import { getCartStorageKey, normalizeCart, readCart, removeCart, writeCart } from "../lib/cart/use-cart.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

const cartItem = {
  plan: { id: "plan_1", slug: "managed-vps", name: "Managed VPS" },
  payload: { productPlanId: "plan_1", billingCycle: "monthly" },
  dueToday: 49,
};

test("cart drafts are stored per customer and can be restored", () => {
  const storage = createStorage();
  const saved = writeCart("user_1", cartItem, storage);

  assert.equal(saved.version, 1);
  assert.equal(readCart("user_1", storage)?.item.plan.slug, "managed-vps");
  assert.equal(readCart("user_2", storage), null);
  assert.match(getCartStorageKey("user_1"), /user_1/);
});

test("invalid or removed cart data is treated as empty", () => {
  const storage = createStorage();
  storage.setItem(getCartStorageKey("user_1"), "not-json");
  assert.equal(readCart("user_1", storage), null);
  assert.equal(normalizeCart({ version: 1, item: {} }), null);

  writeCart("user_1", cartItem, storage);
  removeCart("user_1", storage);
  assert.equal(readCart("user_1", storage), null);
});
