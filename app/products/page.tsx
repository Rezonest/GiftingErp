"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { update, useStore, type Product } from "@/lib/store";

const fields = [["name", "Name"], ["sku", "SKU"], ["price", "Selling price (₹)"], ["cost", "Cost price (₹)"], ["stock", "Stock"], ["min", "Low-stock alert at"]] as const;

export default function Products() {
  const { products, role } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [adj, setAdj] = useState<Product | null>(null);
  const shown = products.filter((p) => (p.name + p.sku).toLowerCase().includes(q.toLowerCase()));

  function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    update((s) => ({
      ...s,
      products: [...s.products, { id: crypto.randomUUID(), name: f.name, sku: f.sku, price: +f.price, cost: +f.cost, stock: +f.stock, min: +f.min }],
    }));
    toast.success(`${f.name} added`);
    setOpen(false);
  }

  function adjust(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const stock = +new FormData(e.currentTarget).get("stock")!;
    update((s) => ({ ...s, products: s.products.map((p) => (p.id === adj!.id ? { ...p, stock } : p)) }));
    toast.success(`${adj!.name} stock set to ${stock}`);
    setAdj(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus /> Add product</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New product</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-3">
              {fields.map(([name, label]) => (
                <Input key={name} name={name} placeholder={label} required type={name === "name" || name === "sku" ? "text" : "number"} min={0} />
              ))}
              <Button className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Input placeholder="Search name or SKU…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      <Table>
        <TableHeader>
          <TableRow><TableHead>Name</TableHead><TableHead>SKU</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead>{role === "admin" && <TableHead />}</TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{p.sku}</TableCell>
              <TableCell>₹{p.price}</TableCell>
              <TableCell>
                <Badge variant={p.stock === 0 ? "destructive" : p.stock <= p.min ? "secondary" : "outline"}>{p.stock}</Badge>
              </TableCell>
              {role === "admin" && (
                <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setAdj(p)}>Adjust stock</Button></TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={!!adj} onOpenChange={(o) => !o && setAdj(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust stock · {adj?.name}</DialogTitle></DialogHeader>
          <form onSubmit={adjust} className="space-y-3">
            <Input key={adj?.id} name="stock" type="number" min={0} defaultValue={adj?.stock} required />
            <Button className="w-full">Update stock</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
