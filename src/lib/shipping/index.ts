import "server-only";

import {
  GeliverShippingProvider,
  ManualShippingProvider,
} from "@/lib/shipping/geliver/provider";
import type { ShippingProvider } from "@/lib/shipping/types";
import { isGeliverEnabled } from "@/lib/shipping/geliver";

let geliverProvider: GeliverShippingProvider | null = null;
let manualProvider: ManualShippingProvider | null = null;

export function getShippingProvider(): ShippingProvider {
  if (isGeliverEnabled()) {
    if (!geliverProvider) geliverProvider = new GeliverShippingProvider();
    return geliverProvider;
  }
  if (!manualProvider) manualProvider = new ManualShippingProvider();
  return manualProvider;
}

export function isShippingIntegrationEnabled(): boolean {
  return isGeliverEnabled();
}
