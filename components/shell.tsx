"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, Gift, LayoutDashboard, Package, Receipt } from "lucide-react";
import { update, useStore } from "@/lib/store";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/stocks", label: "Stocks", icon: Boxes },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/gifts", label: "Gifts", icon: Gift },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { role } = useStore();
  return (
    <div className="min-h-screen md:flex">
      <nav className="glass fixed bottom-0 inset-x-0 z-10 flex rounded-none print:hidden md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:flex-col md:gap-1 md:border-y-0 md:border-l-0 md:p-4">
        <div className="hidden items-center gap-3 px-2 pb-6 md:flex">
          <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-800 to-blue-500 text-white shadow-lg shadow-blue-500/30"><Gift className="size-5" /></div>
          <div className="leading-tight"><p className="font-bold">Gifting ERP</p><p className="text-xs text-muted-foreground">Rezonest</p></div>
        </div>
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 p-3 text-xs md:flex-none md:flex-row md:gap-3 md:rounded-xl md:text-sm md:transition ${
              (href === "/" ? path === "/" : path.startsWith(href))
                ? "font-semibold text-primary md:bg-white/80 md:shadow-md md:shadow-blue-900/10"
                : "text-muted-foreground hover:text-foreground md:hover:bg-white/50"
            }`}
          >
            <Icon className="size-5 md:size-4" />
            {label}
          </Link>
        ))}
      </nav>
      <main className="flex-1 p-4 pb-24 md:p-8">
        <label className="mb-4 flex items-center justify-end gap-2 text-xs text-muted-foreground print:hidden">
          Role (demo)
          <select
            className="rounded-lg border bg-white/60 px-2 py-1 text-foreground"
            value={role}
            onChange={(e) => update((s) => ({ ...s, role: e.target.value as "admin" | "staff" }))}
          >
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
        </label>
        {children}
      </main>
    </div>
  );
}
