"use client";

import { useCallback, useEffect, useState } from "react";

const CART_VERSION = 1;
const CART_EVENT = "elevenorbits:cart-change";
const CART_PREFIX = "elevenorbits:managed-service-cart";

export function getCartStorageKey(userId) {
  return `${CART_PREFIX}:${encodeURIComponent(String(userId || "guest"))}:v${CART_VERSION}`;
}

export function normalizeCart(value) {
  if (!value || value.version !== CART_VERSION || !value.item?.plan?.id || !value.item?.payload?.productPlanId) {
    return null;
  }

  return {
    version: CART_VERSION,
    item: value.item,
    updatedAt: value.updatedAt || value.item.updatedAt || new Date(0).toISOString(),
  };
}

export function readCart(userId, storage) {
  if (!userId || !storage) {
    return null;
  }

  try {
    return normalizeCart(JSON.parse(storage.getItem(getCartStorageKey(userId)) || "null"));
  } catch {
    return null;
  }
}

export function writeCart(userId, item, storage) {
  if (!userId || !storage || !item) {
    return null;
  }

  const updatedAt = new Date().toISOString();
  const cart = {
    version: CART_VERSION,
    item: {
      ...item,
      updatedAt,
    },
    updatedAt,
  };

  storage.setItem(getCartStorageKey(userId), JSON.stringify(cart));
  return cart;
}

export function removeCart(userId, storage) {
  if (!userId || !storage) {
    return;
  }

  storage.removeItem(getCartStorageKey(userId));
}

function announceCartChange(userId) {
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { userId } }));
}

export function useCart(userId) {
  const [cart, setCart] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!userId) {
      setCart(null);
      setIsHydrated(false);
      return undefined;
    }

    const sync = (event) => {
      if (event?.type === CART_EVENT && event.detail?.userId && event.detail.userId !== userId) {
        return;
      }

      if (event?.type === "storage" && event.key && event.key !== getCartStorageKey(userId)) {
        return;
      }

      setCart(readCart(userId, window.localStorage));
      setIsHydrated(true);
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(CART_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CART_EVENT, sync);
    };
  }, [userId]);

  const saveItem = useCallback(
    (item) => {
      const nextCart = writeCart(userId, item, window.localStorage);
      setCart(nextCart);
      announceCartChange(userId);
      return nextCart;
    },
    [userId],
  );

  const clearCart = useCallback(() => {
    removeCart(userId, window.localStorage);
    setCart(null);
    announceCartChange(userId);
  }, [userId]);

  return {
    cart,
    item: cart?.item || null,
    itemCount: cart?.item ? 1 : 0,
    isHydrated,
    saveItem,
    clearCart,
  };
}
