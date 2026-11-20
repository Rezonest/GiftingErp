"use client";
import { useState } from "react";
import { PackagePlus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReceiveStock } from "@/components/receive-stock";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { round, useStore, type Product } from "@/lib/store";

const level = (p: Product) => (p.stock === 0 ? "Out" : p.stock <= p.min ? "Low" : "OK");

export default function Stocks() {
  const { products, invoices, role } = useStore();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [recv, setRecv] = useState<Product | null>(null);

  const sold: Record<string, number> = {};
  invoices.filter((i) => !i.cancelled).forEach((i) => i.items.forEach((x) => (sold[x.pid] = (sold[x.pid] ?? 0) + x.qty)));

  const units = products.reduce((s, p) => s + p.stock, 0);
  const costValue = round(products.reduce((s, p) => s + p.stock * p.cost, 0));
  const retailValue = round(products.reduce((s, p) => s + p.stock * p.price, 0));
  const low = products.filter((p) => level(p) === "Low").length;
  const out = products.filter((p) => level(p) === "Out").length;

  const shown = products
    .filter((p) => (p.name + p.sku).toLowerCase().includes(q.toLowerCase()))
    .filter((p) => tab === "all" || (tab === "low" ? level(p) !== "OK" : level(p) === "OK"));

  const stats: [string, string | number, string?][] = [
    ["Total units", units],
    ["Stock value (cost)", `₹${costValue}`],
    ["Stock value (retail)", `₹${retailValue}`],
    ["Low / out of stock", `${low} / ${out}`, "/stocks/low"],
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Stocks</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, value, href]) => {
          const card = (
            <Card className={href ? "h-full transition-colors hover:bg-muted" : ""}>
              <CardContent>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xl font-semibold">{value}</p>
                {href && <p className="text-xs text-muted-foreground">View items →</p>}
              </CardContent>
            </Card>
          );
          return href ? <Link key={label} href={href}>{card}</Link> : <div key={label}>{card}</div>;
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input placeholder="Search name or SKU…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="low">Needs restock ({low + out})</TabsTrigger>
            <TabsTrigger value="ok">In stock</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>In stock</TableHead><TableHead>Alert at</TableHead>
            <TableHead>Sold</TableHead><TableHead>Value (cost)</TableHead><TableHead>Status</TableHead>{role === "admin" && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{p.sku}</TableCell>
              <TableCell>{p.stock}</TableCell>
              <TableCell>{p.min}</TableCell>
              <TableCell>{sold[p.id] ?? 0}</TableCell>
              <TableCell>₹{round(p.stock * p.cost)}</TableCell>
              <TableCell><Badge variant={level(p) === "Out" ? "destructive" : level(p) === "Low" ? "secondary" : "outline"}>{level(p) === "OK" ? "In stock" : level(p) === "Low" ? "Low stock" : "Out of stock"}</Badge></TableCell>
              {role === "admin" && (
                <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setRecv(p)}><PackagePlus /> Receive stock</Button></TableCell>
              )}
            </TableRow>
          ))}
          {shown.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No products match.</TableCell></TableRow>}
        </TableBody>
      </Table>
      <ReceiveStock product={recv} onClose={() => setRecv(null)} />
    </div>
  );
}
