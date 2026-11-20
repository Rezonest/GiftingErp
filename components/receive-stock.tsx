"use client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { update, type Product } from "@/lib/store";

export function ReceiveStock({ product: p, onClose }: { product: Product | null; onClose: () => void }) {
  function receive(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const qty = +new FormData(e.currentTarget).get("qty")!;
    update((s) => ({ ...s, products: s.products.map((x) => (x.id === p!.id ? { ...x, stock: x.stock + qty } : x)) }));
    toast.success(`${qty} added to ${p!.name}`);
    onClose();
  }

  return (
    <Dialog open={!!p} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Receive stock · {p?.name}</DialogTitle></DialogHeader>
        <form onSubmit={receive} className="space-y-3">
          <p className="text-sm text-muted-foreground">Currently {p?.stock} in stock</p>
          <Input key={p?.id} name="qty" type="number" min={1} placeholder="Quantity received" required />
          <Button className="w-full">Add to stock</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
