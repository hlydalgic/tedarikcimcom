import "server-only";

import { GeliverClient } from "@geliver/sdk";

const DEFAULT_BASE_URL = "https://api.geliver.io/api/v1";

export class GeliverApiError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, opts?: { code?: string; status?: number }) {
    super(message);
    this.name = "GeliverApiError";
    this.code = opts?.code;
    this.status = opts?.status;
  }
}

export function isGeliverEnabled(): boolean {
  return (
    process.env.GELIVER_ENABLED === "true" &&
    Boolean(process.env.GELIVER_API_KEY?.trim())
  );
}

export function createGeliverClient(): GeliverClient {
  const token = process.env.GELIVER_API_KEY?.trim();
  if (!token) {
    throw new GeliverApiError("GELIVER_API_KEY yapılandırılmamış.");
  }
  return new GeliverClient({
    token,
    baseUrl: process.env.GELIVER_API_BASE_URL?.trim() || DEFAULT_BASE_URL,
  });
}

type GeliverProviderRow = {
  id?: string;
  code?: string;
  name?: string;
  providerServiceCode?: string;
};

/** GET /providers — supported carrier list from Geliver marketplace. */
export async function geliverListProviders(): Promise<GeliverProviderRow[]> {
  const client = createGeliverClient();
  const http = (client as unknown as { http: { request: Function } }).http;
  const resp = await http.request("GET", "/providers");
  const data = resp?.data ?? resp;
  if (Array.isArray(data)) return data as GeliverProviderRow[];
  if (Array.isArray(data?.providers)) return data.providers;
  return [];
}

/** GET /priceList — estimate shipping prices for parcel dimensions. */
export async function geliverListPrices(input: {
  length: string;
  width: string;
  height: string;
  weight: string;
  distanceUnit?: string;
  massUnit?: string;
}) {
  const client = createGeliverClient();
  return client.prices.listPrices({
    paramType: "parcel",
    length: input.length,
    width: input.width,
    height: input.height,
    weight: input.weight,
    distanceUnit: input.distanceUnit ?? "cm",
    massUnit: input.massUnit ?? "kg",
  });
}

export async function geliverCreateSenderAddress(input: {
  name: string;
  email?: string;
  phone: string;
  address1: string;
  cityName: string;
  districtName: string;
  countryCode?: string;
  cityCode?: string;
  zip: string;
  shortName?: string;
}) {
  const client = createGeliverClient();
  return client.addresses.createSender({
    name: input.name,
    email: input.email ?? "noreply@marketplace.local",
    phone: input.phone,
    address1: input.address1,
    countryCode: input.countryCode ?? "TR",
    cityName: input.cityName,
    cityCode: input.cityCode ?? "34",
    districtName: input.districtName,
    zip: input.zip,
    shortName: input.shortName,
  });
}

export async function geliverCreateShipment(body: Record<string, unknown>) {
  const client = createGeliverClient();
  const useTest = process.env.GELIVER_USE_TEST_SHIPMENTS === "true";
  if (useTest) {
    return client.shipments.createTest(body as never);
  }
  return client.shipments.create(body as never);
}

export async function geliverAcceptOffer(offerId: string) {
  const client = createGeliverClient();
  return client.transactions.acceptOffer(offerId);
}

export async function geliverGetShipment(shipmentId: string) {
  const client = createGeliverClient();
  return client.shipments.get(shipmentId);
}

export async function geliverWaitForOffers(
  shipmentId: string,
  opts?: { timeoutMs?: number; intervalMs?: number }
) {
  const client = createGeliverClient();
  return client.shipments.waitForOffers(shipmentId, opts);
}

export { verifyWebhookSignature } from "@geliver/sdk";
