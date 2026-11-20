export const SHOP = "Rezonest Digital & Services";
export const ADDRESS = "Gera's Imperium Gateway, C Tower, C-340, Nashik Phata Metro, behind Bhosari Metro Station, Bhosari, Pune, Maharashtra 411034, India";
export const CONTACT = { phone: "+91 9730258208", email: "yogeshwar@rezonest.com", web: "rezonest.com" };
export const BILL_EMAIL = "rezonestdevelopers@gmail.com";

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const below100 = (n: number) => (n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]} ${ones[n % 10]}`.trim());
const below1000 = (n: number) => `${n >= 100 ? `${ones[Math.floor(n / 100)]} Hundred ` : ""}${below100(n % 100)}`.trim();
export function words(amount: number) {
  const rupees = Math.floor(amount), paise = Math.round((amount - rupees) * 100);
  const parts = [[10000000, "Crore"], [100000, "Lakh"], [1000, "Thousand"]] as const;
  let n = rupees, out = "";
  for (const [v, name] of parts) {
    if (n >= v) { out += `${below100(Math.floor(n / v))} ${name} `; n %= v; }
  }
  out += below1000(n);
  return `${out.trim() || "Zero"} Rupees${paise ? ` and ${below100(paise)} Paise` : ""} Only`;
}

export async function emailInvoice(inv: unknown): Promise<string | null> {
  try {
    const r = await fetch("/api/send-invoice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(inv) });
    return r.ok ? null : ((await r.json()).error ?? "Email failed");
  } catch { return "Email failed"; }
}
