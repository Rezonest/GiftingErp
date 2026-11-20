"use client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { update, type Invoice } from "@/lib/store";

export function CancelBill({ invoice: i, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  function cancel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const refund = i!.paid > 0 ? Math.min(+d.get("refund")!, i!.paid) : 0;
    const cancelled = { date: new Date().toISOString(), reason: String(d.get("reason")), refund, method: refund ? String(d.get("method")) : "" };
    update((s) => ({
      ...s,
      products: s.products.map((p) => {
        const x = i!.items.find((it) => it.pid === p.id);
        return x ? { ...p, stock: p.stock + x.qty } : p;
      }),
      invoices: s.invoices.map((x) => (x.id === i!.id ? { ...x, cancelled } : x)),
    }));
    toast.success(`${i!.id} cancelled · stock restored`);
    onClose();
  }

  return (
    <Dialog open={!!i} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Cancel {i?.id}?</DialogTitle></DialogHeader>
        <form onSubmit={cancel} className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            The items go back into stock.{i && i.paid > 0 && ` The customer paid ₹${i.paid}.`}
          </p>
          <Input name="reason" placeholder="Reason (e.g. customer changed mind)" required />
          {i && i.paid > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <Input name="refund" type="number" step="0.01" min={0} max={i.paid} defaultValue={i.paid} aria-label="Refund amount" required />
              <select name="method" className="h-9 rounded-md border bg-transparent px-3 text-sm"><option>Cash</option><option>UPI</option><option>Card</option></select>
            </div>
          )}
          <Button variant="destructive">Cancel bill &amp; restore stock</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
