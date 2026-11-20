"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, PackagePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReceiveStock } from "@/components/receive-stock";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, type Product } from "@/lib/store";

export default function LowStock() {
  const { products, role } = useStore();
  const [recv, setRecv] = useState<Product | null>(null);
  const items = products.filter((p) => p.stock <= p.min).sort((a, b) => a.stock - b.stock);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild><Link href="/stocks"><ArrowLeft /></Link></Button>
        <h1 className="text-2xl font-semibold">Low &amp; out of stock ({items.length})</h1>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>In stock</TableHead><TableHead>Alert at</TableHead>
            <TableHead>Status</TableHead>{role === "admin" && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{p.sku}</TableCell>
              <TableCell>{p.stock}</TableCell>
              <TableCell>{p.min}</TableCell>
              <TableCell><Badge variant={p.stock === 0 ? "destructive" : "secondary"}>{p.stock === 0 ? "Out of stock" : "Low stock"}</Badge></TableCell>
              {role === "admin" && (
                <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setRecv(p)}><PackagePlus /> Receive stock</Button></TableCell>
              )}
            </TableRow>
          ))}
          {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Everything is well stocked 🎉</TableCell></TableRow>}
        </TableBody>
      </Table>
      <ReceiveStock product={recv} onClose={() => setRecv(null)} />
    </div>
  );
}
