import { Package, ShieldCheck, Store, Truck } from "lucide-react";
import { trustStats } from "@/lib/mock-data";

const icons = [Store, Package, ShieldCheck, Truck];

export function TrustSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-16 lg:px-8">
      <div className="rounded-3xl bg-primary px-6 py-10 text-white md:px-10 md:py-12">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            Güvenilir tedarik, şeffaf süreç
          </h2>
          <p className="mt-2 text-sm text-white/75 md:text-base">
            Satıcı doğrulama, güvenli ödeme ve takip edilebilir kargo ile B2B ve
            B2C alımları tek yerden yönetin.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustStats.map((stat, index) => {
            const Icon = icons[index] ?? ShieldCheck;
            return (
              <div key={stat.label} className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-display text-xl font-bold md:text-2xl">
                    {stat.value}
                  </p>
                  <p className="text-sm text-white/70">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
