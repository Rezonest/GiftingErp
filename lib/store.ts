"use client";
import { useSyncExternalStore } from "react";

export type Product = { id: string; name: string; sku: string; price: number; cost: number; stock: number; min: number; photo?: string };
export type Invoice = {
  id: string; date: string; customer: string; phone: string; email: string;
  items: { pid: string; name: string; qty: number; price: number }[];
  subtotal: number; discount: number; gstRate: number; gst: number; total: number;
  paid: number; payments: { amount: number; method: string; date: string }[];
  cancelled?: { date: string; reason: string; refund: number; method: string };
};
export type Gift = { id: string; date: string; pid: string; name: string; qty: number; cost: number; reason: string; note: string };
type State = { products: Product[]; invoices: Invoice[]; gifts: Gift[]; role: "admin" | "staff" };

export const round = (n: number) => Math.round(n * 100) / 100;
export const payStatus = (i: Invoice) => (i.cancelled ? "Cancelled" : i.paid >= i.total ? "Paid" : i.paid > 0 ? "Partial" : "Unpaid");

const KEY = "gifting-erp";
const seed: State = {
  products: [
    { id: "1", name: "Gift Hamper Classic", sku: "GH-101", price: 1499, cost: 900, stock: 12, min: 5 },
    { id: "2", name: "Scented Candle Set", sku: "SC-204", price: 699, cost: 400, stock: 3, min: 5 },
    { id: "3", name: "Personalised Mug", sku: "PM-310", price: 349, cost: 150, stock: 40, min: 10 },
    { id: "4", name: "Chocolate Box", sku: "CB-415", price: 899, cost: 500, stock: 0, min: 5 },
  ],
  invoices: [],
  gifts: [],
  role: "admin",
};

let state: State = seed;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "");
    state = {
      ...seed,
      ...saved,
      products: saved.products.map((p: Product) => ({ ...p, cost: p.cost ?? 0 })),
      invoices: saved.invoices.filter((i: Invoice) => "payments" in i && i.items.every((x) => "pid" in x)),
    };
  } catch {}
}

export function update(fn: (s: State) => State) {
  state = fn(state);
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export const useStore = () =>
  useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => state,
    () => seed,
  );
