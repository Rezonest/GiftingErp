"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Ban, Gift, Mail, MessageCircle, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CancelBill } from "@/components/cancel-bill";
import { ADDRESS, BILL_EMAIL, CONTACT, SHOP, emailInvoice, words } from "@/lib/invoice";
import { round, useStore } from "@/lib/store";

const inr = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Receipt() {
  const { id } = useParams<{ id: string }>();
  const { invoices, role } = useStore();
  const [ask, setAsk] = useState(false);
  const [sending, setSending] = useState(false);
  const i = invoices.find((x) => x.id === id);
  if (!i) return <p className="text-muted-foreground">Invoice not found.</p>;

  const due = i.cancelled ? 0 : round(i.total - i.paid);
  const status = i.cancelled ? "CANCELLED" : due > 0 ? (i.paid > 0 ? "PARTIAL" : "UNPAID") : "PAID";
  const statusColor = i.cancelled ? "#64748b" : due > 0 ? "#dc2626" : "#16a34a";
  const taxable = round(i.subtotal - i.discount);
  const lines = i.items.map((x) => {
    const t = round(x.price * x.qty - (i.subtotal ? (i.discount * x.price * x.qty) / i.subtotal : 0));
    const tax = round((t * i.gstRate) / 200);
    return { ...x, taxable: t, tax, total: round(t + tax * 2) };
  });

  const text = [
    `*${SHOP}* — Invoice ${i.id}`,
    `Hi ${i.customer}, thank you for shopping with us! 🎁`,
    "",
    ...i.items.map((x) => `• ${x.name} × ${x.qty} = ₹${x.price * x.qty}`),
    "",
    i.discount ? `Discount: -₹${i.discount}` : "",
    `GST ${i.gstRate}%: ₹${i.gst}`,
    `*Total: ₹${i.total}*`,
    due ? `Paid: ₹${i.paid} · *Due: ₹${due}*` : "Paid in full ✅",
  ].filter((l, n, a) => l || a[n - 1]).join("\n");
  const digits = i.phone.replace(/\D/g, "");
  const wa = `https://wa.me/${digits.length === 10 ? "91" + digits : digits}?text=${encodeURIComponent(text)}`;

  async function resend() {
    setSending(true);
    const err = await emailInvoice(i);
    setSending(false);
    if (err) toast.error(err);
    else toast.success(`Emailed to ${BILL_EMAIL}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button variant="ghost" asChild><Link href="/billing"><ArrowLeft /> Back</Link></Button>
        <Button variant="outline" onClick={() => window.print()}><Printer /> Print</Button>
        <Button variant="outline" asChild><a href={wa} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></Button>
        <Button variant="outline" disabled={sending} onClick={resend}><Mail /> {sending ? "Sending…" : "Email"}</Button>
        {role === "admin" && !i.cancelled && (
          <Button variant="outline" className="text-destructive" onClick={() => setAsk(true)}><Ban /> Cancel bill</Button>
        )}
      </div>
      <CancelBill invoice={ask ? i : null} onClose={() => setAsk(false)} />

      <div className="relative overflow-hidden rounded-lg border bg-white text-[13px] text-slate-900 shadow-sm print:rounded-none print:border-0 print:shadow-none [print-color-adjust:exact]">
        {/* header */}
        <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-white/15"><Gift className="size-6" /></div>
            <div>
              <p className="text-lg font-bold leading-tight">{SHOP}</p>
              <p className="text-xs text-blue-100">{CONTACT.web} · {CONTACT.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tracking-wide">TAX INVOICE</p>
            <p className="text-xs text-blue-100">Original for recipient</p>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-amber-400 via-rose-400 to-amber-400" />

        {/* meta */}
        <div className="grid gap-4 p-6 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Billed by</p>
            <p className="mt-1 font-semibold">{SHOP}</p>
            <p className="text-slate-600">{ADDRESS}</p>
            <p className="text-slate-600">{CONTACT.email}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Billed to</p>
            <p className="mt-1 font-semibold">{i.customer}</p>
            {i.phone && <p className="text-slate-600">{i.phone}</p>}
            {i.email && <p className="text-slate-600">{i.email}</p>}
          </div>
          <div className="space-y-1 sm:text-right">
            <p><span className="text-slate-500">Invoice No:</span> <b>{i.id}</b></p>
            <p><span className="text-slate-500">Date:</span> <b>{new Date(i.date).toLocaleDateString("en-GB").replaceAll("/", "-")}</b></p>
            <p><span className="text-slate-500">Place of supply:</span> <b>Maharashtra (27)</b></p>
            <span className="inline-block rounded-full px-3 py-0.5 text-xs font-bold text-white" style={{ background: statusColor }}>{status}</span>
          </div>
        </div>

        {/* items */}
        <div className="overflow-x-auto px-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[11px] uppercase tracking-wide text-slate-600 [&>th]:px-2 [&>th]:py-2 [&>th]:text-right">
                <th className="!text-left">#</th><th className="!text-left">Item</th><th>Qty</th><th>Rate</th><th>Taxable</th><th>GST %</th><th>CGST</th><th>SGST</th><th>Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, n) => (
                <tr key={l.pid} className="border-b [&>td]:px-2 [&>td]:py-2.5 [&>td]:text-right">
                  <td className="!text-left text-slate-500">{n + 1}</td><td className="!text-left font-medium">{l.name}</td>
                  <td>{l.qty}</td><td>{inr(l.price)}</td><td>{inr(l.taxable)}</td><td>{i.gstRate}</td>
                  <td>{inr(l.tax)}</td><td>{inr(l.tax)}</td><td className="font-semibold">{inr(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* totals */}
        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_260px]">
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Amount in words</p>
              <p className="font-medium">{words(i.total)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Payment</p>
              {i.payments.length ? i.payments.map((p) => (
                <p key={p.date} className="text-slate-600">{new Date(p.date).toLocaleDateString("en-GB")} · {p.method} · ₹{inr(p.amount)}</p>
              )) : <p className="text-slate-600">No payment received yet</p>}
            </div>
            <div className="flex items-center gap-3 print:break-inside-avoid">
              <QRCodeSVG value={`https://${CONTACT.web}`} size={64} />
              <p className="text-[11px] text-slate-500">Scan to visit {CONTACT.web}<br />Questions? Call {CONTACT.phone}</p>
            </div>
          </div>
          <div className="space-y-1.5 self-start rounded-lg bg-slate-50 p-4">
            <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span>₹{inr(i.subtotal)}</span></div>
            {i.discount > 0 && <div className="flex justify-between"><span className="text-slate-600">Discount</span><span>−₹{inr(i.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-slate-600">Taxable value</span><span>₹{inr(taxable)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">CGST {i.gstRate / 2}%</span><span>₹{inr(i.gst / 2)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">SGST {i.gstRate / 2}%</span><span>₹{inr(i.gst / 2)}</span></div>
            <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-bold text-blue-900"><span>Total</span><span>₹{inr(i.total)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Paid</span><span>₹{inr(i.paid)}</span></div>
            {due > 0 && <div className="flex justify-between font-bold text-red-600"><span>Balance due</span><span>₹{inr(due)}</span></div>}
          </div>
        </div>

        {i.cancelled && (
          <p className="mx-6 mb-4 rounded bg-slate-100 p-2 text-center font-semibold text-red-600">
            CANCELLED · {i.cancelled.reason}{i.cancelled.refund > 0 && ` · ₹${i.cancelled.refund} refunded via ${i.cancelled.method} on ${new Date(i.cancelled.date).toLocaleDateString("en-GB")}`}
          </p>
        )}

        {/* footer */}
        <div className="flex items-end justify-between gap-4 border-t px-6 py-5">
          <div className="text-[11px] text-slate-500">
            <p className="font-semibold text-slate-700">Terms</p>
            <p>1. This is a computer-generated invoice and needs no signature.</p>
            <p>2. Goods once sold can be exchanged only as per store policy.</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">For, {SHOP}</p>
            <p className="mt-8 border-t border-slate-400 pt-1 text-[11px] text-slate-500">Authorised Signatory</p>
          </div>
        </div>
        <div className="bg-blue-900 py-2 text-center text-xs text-blue-100">Thank you for your business! 🎁</div>

        {!i.cancelled && due <= 0 && (
          <p className="pointer-events-none absolute right-10 top-40 rotate-[-12deg] rounded border-4 border-green-600/40 px-4 py-1 text-3xl font-black tracking-widest text-green-600/40">PAID</p>
        )}
      </div>
    </div>
  );
}
