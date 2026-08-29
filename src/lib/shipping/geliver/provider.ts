import "server-only";

import {
  createGeliverClient,
  geliverAcceptOffer,
  geliverCreateShipment,
  geliverGetShipment,
  geliverListPrices,
  geliverListProviders,
  geliverWaitForOffers,
  isGeliverEnabled,
} from "@/lib/shipping/geliver";
import type {
  CarrierOption,
  CreateShipmentInput,
  PriceQuoteInput,
  PriceQuoteOption,
  ShipmentResult,
  ShippingProvider,
  TrackingResult,
} from "@/lib/shipping/types";

function num(value: string | number | undefined | null): number {
  if (value == null) return 0;
  return Number(value) || 0;
}

function mapTrackingStatus(code?: string): boolean {
  if (!code) return false;
  return code.toUpperCase() === "DELIVERED";
}

export class GeliverShippingProvider implements ShippingProvider {
  readonly name = "geliver";

  isEnabled(): boolean {
    return isGeliverEnabled();
  }

  async listCarriers(): Promise<CarrierOption[]> {
    const rows = await geliverListProviders();
    return rows
      .filter((r) => r.code && r.name)
      .map((r) => ({
        code: String(r.code),
        name: String(r.name),
        providerServiceCode: r.providerServiceCode
          ? String(r.providerServiceCode)
          : undefined,
      }));
  }

  async getPriceQuotes(input: PriceQuoteInput): Promise<PriceQuoteOption[]> {
    const resp = await geliverListPrices({
      length: String(input.length),
      width: String(input.width),
      height: String(input.height),
      weight: String(input.weight),
      distanceUnit: input.distanceUnit ?? "cm",
      massUnit: input.massUnit ?? "kg",
    });

    const rows = (resp as { data?: unknown[] })?.data ?? resp;
    if (!Array.isArray(rows)) return [];

    return rows.map((row: Record<string, unknown>, index) => ({
      offerId: String(row.id ?? row.offerID ?? `price-${index}`),
      providerCode: String(row.providerCode ?? row.code ?? ""),
      providerName: String(row.providerName ?? row.name ?? row.providerCode ?? ""),
      providerServiceCode: String(
        row.providerServiceCode ?? row.serviceCode ?? row.code ?? ""
      ),
      amount: num(row.amount as string | number),
      currency: String(row.currency ?? row.currencyLocal ?? "TRY"),
      estimatedDays: row.averageEstimatedTime
        ? Number(row.averageEstimatedTime)
        : undefined,
    }));
  }

  async createShipment(input: CreateShipmentInput): Promise<ShipmentResult> {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
      "https://marketplace.local";

    const created = await geliverCreateShipment({
      senderAddressID: input.senderAddressId,
      providerServiceCode: input.providerServiceCode,
      recipientAddress: {
        name: input.recipient.name,
        email: input.recipient.email,
        phone: input.recipient.phone,
        address1: input.recipient.address1,
        address2: input.recipient.address2,
        countryCode: input.recipient.countryCode ?? "TR",
        cityName: input.recipient.cityName,
        cityCode: input.recipient.cityCode,
        districtName: input.recipient.districtName,
        zip: input.recipient.zip,
      },
      length: String(input.parcel.length),
      width: String(input.parcel.width),
      height: String(input.parcel.height),
      weight: String(input.parcel.weight),
      distanceUnit: input.parcel.distanceUnit ?? "cm",
      massUnit: input.parcel.massUnit ?? "kg",
      order: {
        orderNumber: input.orderNumber,
        sourceIdentifier: input.sourceIdentifier ?? siteUrl,
        totalAmount: String(input.orderTotal),
        totalAmountCurrency: input.currency ?? "TRY",
      },
      test: input.test,
    });

    const shipment = created as Record<string, unknown>;
    const shipmentId = String(shipment.id ?? "");
    if (!shipmentId) {
      throw new Error("Geliver gönderi ID alınamadı.");
    }

    // If providerServiceCode given, offers may already exist; otherwise wait
    let offers = shipment.offers as Record<string, unknown> | undefined;
    if (!offers?.cheapest && !offers?.fastest) {
      const waited = await geliverWaitForOffers(shipmentId, { timeoutMs: 20000 });
      offers = (waited as Record<string, unknown>).offers as Record<string, unknown>;
    }

    const offerList = Array.isArray(offers?.list)
      ? (offers.list as Record<string, unknown>[])
      : [];
    const selected =
      offerList.find(
        (o) => String(o.providerServiceCode ?? "") === input.providerServiceCode
      ) ??
      (offers?.cheapest as Record<string, unknown>) ??
      (offers?.fastest as Record<string, unknown>) ??
      offerList[0] ??
      null;

    if (!selected?.id) {
      throw new Error("Geliver teklif bulunamadı.");
    }

    const tx = await geliverAcceptOffer(String(selected.id));
    const txData = tx as unknown as Record<string, unknown>;
    const txShipment = (txData.shipment ?? txData) as Record<string, unknown>;

    return {
      shipmentId,
      transactionId: txData.id ? String(txData.id) : undefined,
      trackingNumber: txShipment.trackingNumber
        ? String(txShipment.trackingNumber)
        : null,
      trackingUrl: txShipment.trackingUrl ? String(txShipment.trackingUrl) : null,
      labelUrl: txShipment.labelURL ? String(txShipment.labelURL) : null,
      barcode: txShipment.barcode ? String(txShipment.barcode) : null,
      carrierCode: String(
        txShipment.providerCode ?? selected.providerCode ?? input.providerServiceCode
      ),
      carrierName: String(
        txShipment.providerName ?? selected.providerName ?? input.providerServiceCode
      ),
      raw: tx,
    };
  }

  async getTracking(shipmentId: string): Promise<TrackingResult> {
    const shipment = (await geliverGetShipment(shipmentId)) as Record<string, unknown>;
    const ts = (shipment.trackingStatus ?? {}) as Record<string, unknown>;
    const statusCode = String(ts.trackingStatusCode ?? shipment.statusCode ?? "");
    const subStatusCode = ts.trackingSubStatusCode
      ? String(ts.trackingSubStatusCode)
      : undefined;

    const history = Array.isArray(ts.history) ? ts.history : [];
    const events = history.map((h: Record<string, unknown>) => ({
      statusCode: String(h.trackingStatusCode ?? h.status ?? ""),
      subStatusCode: h.trackingSubStatusCode
        ? String(h.trackingSubStatusCode)
        : undefined,
      description: h.description ? String(h.description) : undefined,
      occurredAt: h.eventDate ? String(h.eventDate) : undefined,
    }));

    return {
      shipmentId,
      trackingNumber: shipment.trackingNumber
        ? String(shipment.trackingNumber)
        : null,
      trackingUrl: shipment.trackingUrl ? String(shipment.trackingUrl) : null,
      statusCode,
      subStatusCode,
      isDelivered: mapTrackingStatus(statusCode),
      events,
      raw: shipment,
    };
  }
}

/** Dev/mock provider when Geliver disabled — manual tracking only. */
export class ManualShippingProvider implements ShippingProvider {
  readonly name = "manual";

  isEnabled(): boolean {
    return true;
  }

  async listCarriers(): Promise<CarrierOption[]> {
    return [];
  }

  async getPriceQuotes(): Promise<PriceQuoteOption[]> {
    return [];
  }

  async createShipment(): Promise<ShipmentResult> {
    throw new Error("Manuel kargo modunda otomatik etiket oluşturulamaz.");
  }

  async getTracking(): Promise<TrackingResult> {
    throw new Error("Manuel kargo modunda API takibi yok.");
  }
}
