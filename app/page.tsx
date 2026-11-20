"use client";
import Link from "next/link";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleDollarSign, Gift, IndianRupee, Package, type LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";

export default function Dashboard() {
  const { products, invoices: all, gifts } = useStore();
  const invoices = all.filter((i) => !i.cancelled);
  const today = new Date().toDateString();
  const todaySales = invoices.filter((i) => new Date(i.date).toDateString() === today).reduce((s, i) => s + i.total, 0);
  const low = products.filter((p) => p.stock <= p.min);
  const stockValue = products.reduce((s, p) => s + p.stock * p.price, 0);
  const chart = Array.from({ length: 7 }, (_, n) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - n));
    return {
      day: d.toLocaleDateString("en", { weekday: "short" }),
      sales: invoices.filter((i) => new Date(i.date).toDateString() === d.toDateString()).reduce((s, i) => s + i.total, 0),
    };
  });

  const owing = invoices.filter((i) => i.paid < i.total);
  const dues = owing.reduce((s, i) => s + i.total - i.paid, 0);

  const month = new Date().getMonth();
  const gifted = gifts.filter((g) => new Date(g.date).getMonth() === month).reduce((s, g) => s + g.qty * g.cost, 0);

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const stats: [string, string, LucideIcon, string][] = [
    ["Today's sales", fmt(todaySales), IndianRupee, "from-blue-700 to-blue-500"],
    ["Dues", fmt(dues), CircleDollarSign, "from-rose-600 to-orange-400"],
    ["Gifted this month", fmt(gifted), Gift, "from-fuchsia-600 to-pink-400"],
    ["Stock value", fmt(stockValue), Package, "from-emerald-600 to-teal-400"],
  ];
  const top = Object.values(
    invoices.flatMap((i) => i.items).reduce<Record<string, { name: string; qty: number }>>((a, x) => {
      (a[x.pid] ??= { name: x.name, qty: 0 }).qty += x.qty;
      return a;
    }, {}),
  ).sort((a, b) => b.qty - a.qty).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([label, value, Icon, grad]) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
              </div>
              <div className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg ${grad}`}><Icon className="size-5" /></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Last 7 days</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer>
              <BarChart data={chart}>
                <defs><linearGradient id="bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#1e3a8a" /></linearGradient></defs>
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <Tooltip cursor={false} />
                <Bar dataKey="sales" fill="url(#bar)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top sellers</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {top.length === 0 && <p className="text-sm text-muted-foreground">No sales yet</p>}
            {top.map((t, n) => (
              <div key={t.name} className="flex items-center justify-between text-sm">
                <span><span className="mr-2 text-muted-foreground">{n + 1}</span>{t.name}</span>
                <Badge variant="secondary">{t.qty} sold</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Payments due</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {owing.length === 0 && <p className="text-sm text-muted-foreground">Nobody owes you 🎉</p>}
            {owing.map((i) => (
              <Link key={i.id} href={`/billing/${i.id}`} className="flex items-center justify-between text-sm hover:underline">
                <span>{i.customer} · {i.id}</span>
                <Badge variant="destructive">₹{Math.round((i.total - i.paid) * 100) / 100}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Needs restocking</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {low.length === 0 && <p className="text-sm text-muted-foreground">All stocked up 🎉</p>}
            {low.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span>{p.name}</span>
                <Badge variant={p.stock === 0 ? "destructive" : "secondary"}>{p.stock === 0 ? "Out" : `${p.stock} left`}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
