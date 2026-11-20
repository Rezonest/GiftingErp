import nodemailer from "nodemailer";
import { BILL_EMAIL, CONTACT, SHOP, words } from "@/lib/invoice";
import type { Invoice } from "@/lib/store";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const money = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function html(i: Invoice) {
  const due = Math.round((i.total - i.paid) * 100) / 100;
  const row = (a: string, b: string, bold = false) =>
    `<tr><td style="padding:6px 0;color:#475569;${bold ? "font-weight:700;color:#0f172a;font-size:16px" : ""}">${a}</td><td style="padding:6px 0;text-align:right;${bold ? "font-weight:700;font-size:16px" : ""}">${b}</td></tr>`;
  return `<div style="font-family:Arial,sans-serif;background:#f1f5f9;padding:24px">
<div style="max-width:620px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0">
<div style="background:#1e3a8a;color:#fff;padding:20px 24px"><div style="font-size:20px;font-weight:700">${esc(SHOP)}</div><div style="opacity:.8;font-size:13px">Tax Invoice ${esc(i.id)}</div></div>
<div style="padding:24px;font-size:14px;color:#0f172a">
<p style="margin:0 0 4px"><b>Customer:</b> ${esc(i.customer)}${i.phone ? ` · ${esc(i.phone)}` : ""}${i.email ? ` · ${esc(i.email)}` : ""}</p>
<p style="margin:0 0 16px;color:#475569">Date: ${new Date(i.date).toLocaleDateString("en-GB")}</p>
<table style="width:100%;border-collapse:collapse;font-size:14px"><tr style="background:#f1f5f9;text-align:left"><th style="padding:8px">Item</th><th style="padding:8px;text-align:right">Qty</th><th style="padding:8px;text-align:right">Rate</th><th style="padding:8px;text-align:right">Amount</th></tr>
${i.items.map((x) => `<tr style="border-bottom:1px solid #e2e8f0"><td style="padding:8px">${esc(x.name)}</td><td style="padding:8px;text-align:right">${x.qty}</td><td style="padding:8px;text-align:right">${money(x.price)}</td><td style="padding:8px;text-align:right">${money(x.price * x.qty)}</td></tr>`).join("")}</table>
<table style="width:100%;margin-top:12px;font-size:14px">
${row("Subtotal", money(i.subtotal))}${i.discount ? row("Discount", `−${money(i.discount)}`) : ""}${row(`CGST ${i.gstRate / 2}%`, money(i.gst / 2))}${row(`SGST ${i.gstRate / 2}%`, money(i.gst / 2))}${row("Total", money(i.total), true)}${row("Paid", money(i.paid))}${due > 0 ? row("<span style='color:#dc2626'>Balance due</span>", `<b style='color:#dc2626'>${money(due)}</b>`) : ""}</table>
<p style="color:#475569;font-size:12px;margin-top:12px">${esc(words(i.total))}</p>
<p style="margin-top:20px;font-size:13px;color:#475569">Thank you for your business!<br>${esc(CONTACT.phone)} · ${esc(CONTACT.email)} · ${esc(CONTACT.web)}</p>
</div></div></div>`;
}

export async function POST(req: Request) {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD)
    return Response.json({ error: "Email not configured: set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local" }, { status: 500 });
  const inv = (await req.json()) as Invoice;
  if (!inv?.id || !Array.isArray(inv.items)) return Response.json({ error: "Invalid invoice" }, { status: 400 });
  try {
    const t = nodemailer.createTransport({ service: "gmail", auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } });
    await t.sendMail({
      from: `"${SHOP}" <${GMAIL_USER}>`,
      to: BILL_EMAIL,
      subject: `${inv.cancelled ? "[CANCELLED] " : ""}Invoice ${inv.id} · ${inv.customer} · ₹${inv.total}`,
      html: html(inv),
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Send failed" }, { status: 502 });
  }
}
