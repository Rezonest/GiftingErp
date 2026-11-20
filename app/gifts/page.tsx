"use client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { update, useStore } from "@/lib/store";

const field = "h-9 w-full rounded-md border bg-transparent px-3 text-sm";

export default function Gifts() {
  const { products, gifts } = useStore();

  function give(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    const p = products.find((x) => x.id === d.get("pid"))!;
    const qty = Math.min(+d.get("qty")!, p.stock);
    update((s) => ({
      ...s,
      products: s.products.map((x) => (x.id === p.id ? { ...x, stock: x.stock - qty } : x)),
      gifts: [
        { id: crypto.randomUUID(), date: new Date().toISOString(), pid: p.id, name: p.name, qty, cost: p.cost, reason: String(d.get("reason")), note: String(d.get("note")) },
        ...s.gifts,
      ],
    }));
    toast.success(`${qty} × ${p.name} given away`);
    form.reset();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Gifts &amp; stock out</h1>
      <Card className="max-w-xl">
        <CardHeader><CardTitle>Give away</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={give} className="grid gap-3 sm:grid-cols-2">
            <select name="pid" className={`${field} sm:col-span-2`} required>
              {products.filter((p) => p.stock > 0).map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.stock} in stock)</option>
              ))}
            </select>
            <Input name="qty" type="number" min={1} defaultValue={1} required />
            <select name="reason" className={field}>
              <option>Guest gift</option><option>Sample</option><option>Damaged</option><option>Staff use</option><option>Other</option>
            </select>
            <Input name="note" placeholder="Note, e.g. Mr. Sharma visit" className="sm:col-span-2" />
            <Button className="sm:col-span-2">Give away &amp; deduct stock</Button>
          </form>
        </CardContent>
      </Card>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Date</TableHead><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Reason</TableHead><TableHead>Value</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {gifts.map((g) => (
            <TableRow key={g.id}>
              <TableCell>{new Date(g.date).toLocaleDateString()}</TableCell>
              <TableCell className="font-medium">{g.name}{g.note && <span className="block text-xs font-normal text-muted-foreground">{g.note}</span>}</TableCell>
              <TableCell>{g.qty}</TableCell>
              <TableCell>{g.reason}</TableCell>
              <TableCell>₹{g.qty * g.cost}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
