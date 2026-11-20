"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { CancelBill } from "@/components/cancel-bill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BILL_EMAIL, emailInvoice } from "@/lib/invoice";
import { payStatus, round, update, useStore, type Invoice } from "@/lib/store";

const select = "h-9 w-full rounded-md border bg-transparent px-3 text-sm";
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="grid gap-1 text-sm text-muted-foreground">{label}{children}</label>
);
const init = { customer: "", phone: "", email: "", discount: 0, pct: false, gst: 18, status: "Paid", method: "Cash", part: 0 };

export default function Billing() {
  const { products, invoices, role } = useStore();
  const [cancel, setCancel] = useState<Invoice | null>(null);
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(init);
  const set = (k: keyof typeof init, v: string | number | boolean) => setF((s) => ({ ...s, [k]: v }));
  const [pay, setPay] = useState<Invoice | null>(null);
  const [q, setQ] = useState("");
  const [iq, setIq] = useState("");
  const payDue = pay ? round(pay.total - pay.paid) : 0;

  function recordPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const amount = Math.min(+d.get("amount")!, payDue);
    update((s) => ({
      ...s,
      invoices: s.invoices.map((x) =>
        x.id === pay!.id
          ? { ...x, paid: round(x.paid + amount), payments: [...x.payments, { amount, method: String(d.get("method")), date: new Date().toISOString() }] }
          : x,
      ),
    }));
    toast.success(`₹${amount} received for ${pay!.id}`);
    setPay(null);
  }

  const shown = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()));
  const shownInv = invoices.filter((i) => `${i.id} ${i.customer} ${i.phone}`.toLowerCase().includes(iq.toLowerCase()));
  const lines = products.filter((p) => cart[p.id]);
  const subtotal = lines.reduce((s, p) => s + p.price * cart[p.id], 0);
  const discount = round(Math.min(subtotal, f.pct ? (subtotal * f.discount) / 100 : f.discount));
  const gst = round(((subtotal - discount) * f.gst) / 100);
  const total = round(subtotal - discount + gst);
  const paid = f.status === "Paid" ? total : f.status === "Partial" ? Math.min(f.part, total) : 0;

  const change = (id: string, d: number, max: number) =>
    setCart((c) => ({ ...c, [id]: Math.min(max, Math.max(0, (c[id] ?? 0) + d)) }));

  function createBill() {
    const id = `INV-${Math.max(1000, ...invoices.map((x) => parseInt(x.id.replace(/\D/g, "")) || 0)) + 1}`;
    const inv: Invoice = {
      id, date: new Date().toISOString(), customer: f.customer || "Walk-in", phone: f.phone, email: f.email,
      items: lines.map((p) => ({ pid: p.id, name: p.name, qty: cart[p.id], price: p.price })),
      subtotal, discount, gstRate: f.gst, gst, total, paid,
      payments: paid ? [{ amount: paid, method: f.method, date: new Date().toISOString() }] : [],
    };
    update((s) => ({
      ...s,
      products: s.products.map((p) => (cart[p.id] ? { ...p, stock: p.stock - cart[p.id] } : p)),
      invoices: [inv, ...s.invoices],
    }));
    emailInvoice(inv).then((err) =>
      err ? toast.error(`Bill saved, but email failed: ${err}`) : toast.success(`${id} emailed to ${BILL_EMAIL}`),
    );
    toast.success(`${id} created`);
    setCart({});
    setF(init);
    setOpen(false);
    router.push(`/billing/${id}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new">New bill</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
          <Input placeholder="Search products or SKU…" value={q} onChange={(e) => setQ(e.target.value)} className="bg-white/60" />
          <div className="grid gap-3 sm:grid-cols-2">
            {shown.map((p) => (
              <Card key={p.id} className={p.stock === 0 ? "opacity-50" : ""}>
                <CardContent className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">₹{p.price} · {p.stock} in stock</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={() => change(p.id, -1, p.stock)}><Minus /></Button>
                    <span className="w-5 text-center">{cart[p.id] ?? 0}</span>
                    <Button size="icon" variant="outline" disabled={p.stock === 0} onClick={() => change(p.id, 1, p.stock)}><Plus /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {shown.length === 0 && <p className="text-sm text-muted-foreground">No products match.</p>}
          </div>
          </div>
          <Card className="h-fit lg:sticky lg:top-8">
            <CardHeader><CardTitle>Cart</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {lines.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span>{p.name} × {cart[p.id]}</span><span>₹{p.price * cart[p.id]}</span>
                </div>
              ))}
              <div className="flex justify-between border-t pt-3 font-semibold"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <Button className="w-full" disabled={!subtotal} onClick={() => setOpen(true)}>Checkout</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4 space-y-3">
          <Input placeholder="Search by invoice, customer or phone…" value={iq} onChange={(e) => setIq(e.target.value)} className="max-w-sm bg-white/60" />
          <div className="glass overflow-hidden rounded-2xl p-1">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead /></TableRow>
            </TableHeader>
            <TableBody>
              {shownInv.map((i) => (
                <TableRow key={i.id} className="cursor-pointer" onClick={() => router.push(`/billing/${i.id}`)}>
                  <TableCell><Link href={`/billing/${i.id}`} className="font-medium underline-offset-4 hover:underline">{i.id}</Link></TableCell>
                  <TableCell>{i.customer}</TableCell>
                  <TableCell>₹{i.total}</TableCell>
                  <TableCell>
                    <Badge variant={payStatus(i) === "Paid" ? "outline" : payStatus(i) === "Cancelled" ? "secondary" : "destructive"}>
                      {payStatus(i)}{["Partial", "Unpaid"].includes(payStatus(i)) && ` · ₹${round(i.total - i.paid)} due`}
                      {i.cancelled && i.cancelled.refund > 0 && ` · ₹${i.cancelled.refund} refunded (${i.cancelled.method})`}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2 text-right" onClick={(e) => e.stopPropagation()}>
                    {["Partial", "Unpaid"].includes(payStatus(i)) && (
                      <Button size="sm" variant="outline" onClick={() => setPay(i)}>Receive payment</Button>
                    )}
                    {role === "admin" && !i.cancelled && (
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => setCancel(i)}>Cancel</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </TabsContent>
      </Tabs>

      <CancelBill invoice={cancel} onClose={() => setCancel(null)} />

      <Dialog open={!!pay} onOpenChange={(o) => !o && setPay(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Receive payment · {pay?.id}</DialogTitle></DialogHeader>
          <form onSubmit={recordPayment} className="grid gap-3">
            <p className="text-sm text-muted-foreground">{pay?.customer} · ₹{payDue} due</p>
            <Input key={pay?.id} name="amount" type="number" step="0.01" min={0.01} max={payDue} defaultValue={payDue} required />
            <select name="method" className={select}><option>Cash</option><option>UPI</option><option>Card</option></select>
            <Button>Received</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Checkout</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Customer name (optional)" value={f.customer} onChange={(e) => set("customer", e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="WhatsApp number" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
              <Input placeholder="Email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Discount">
                <div className="flex gap-2">
                  <Input type="number" min={0} value={f.discount} onChange={(e) => set("discount", +e.target.value)} />
                  <select className={`${select} w-20`} value={f.pct ? "%" : "₹"} onChange={(e) => set("pct", e.target.value === "%")}>
                    <option>₹</option><option>%</option>
                  </select>
                </div>
              </Field>
              <Field label="GST (CGST + SGST)">
                <select className={select} value={f.gst} onChange={(e) => set("gst", +e.target.value)}>
                  {[0, 5, 12, 18, 28].map((r) => <option key={r} value={r}>{r}%</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Payment">
                <select className={select} value={f.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="Paid">Paid in full</option><option value="Partial">Advance / part payment</option><option value="Unpaid">Unpaid</option>
                </select>
              </Field>
              <Field label="Method">
                <select className={select} value={f.method} onChange={(e) => set("method", e.target.value)}>
                  <option>Cash</option><option>UPI</option><option>Card</option>
                </select>
              </Field>
            </div>
            {f.status === "Partial" && (
              <Input type="number" min={0} placeholder="Advance received (₹)" onChange={(e) => set("part", +e.target.value)} />
            )}
            <div className="space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
              {discount > 0 && <div className="flex justify-between"><span>Discount</span><span>−₹{discount}</span></div>}
              <div className="flex justify-between"><span>CGST {f.gst / 2}%</span><span>₹{round(gst / 2)}</span></div>
              <div className="flex justify-between"><span>SGST {f.gst / 2}%</span><span>₹{round(gst / 2)}</span></div>
              <div className="flex justify-between pt-1 text-lg font-semibold"><span>Total</span><span>₹{total}</span></div>
              {paid < total && <div className="flex justify-between text-destructive"><span>Due</span><span>₹{round(total - paid)}</span></div>}
            </div>
            <Button onClick={createBill}>Create bill &amp; receipt</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
