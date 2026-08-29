export type ShippingAddress = {
  name: string;
  email?: string;
  phone: string;
  address1: string;
  address2?: string;
  cityName: string;
  cityCode?: string;
  districtName: string;
  countryCode?: string;
  zip?: string;
};

export type CarrierOption = {
  code: string;
  name: string;
  providerServiceCode?: string;
};

export type PriceQuoteInput = {
  length: number;
  width: number;
  height: number;
  weight: number;
  distanceUnit?: "cm" | "in";
  massUnit?: "kg" | "lb";
};

export type PriceQuoteOption = {
  offerId: string;
  providerCode: string;
  providerName: string;
  providerServiceCode: string;
  amount: number;
  currency: string;
  estimatedDays?: number;
};

export type CreateShipmentInput = {
  senderAddressId: string;
  recipient: ShippingAddress;
  providerServiceCode: string;
  parcel: PriceQuoteInput;
  orderNumber: string;
  orderTotal: number;
  currency?: string;
  sourceIdentifier?: string;
  test?: boolean;
};

export type ShipmentResult = {
  shipmentId: string;
  transactionId?: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  labelUrl: string | null;
  barcode: string | null;
  carrierCode: string;
  carrierName: string;
  raw?: unknown;
};

export type TrackingEvent = {
  statusCode: string;
  subStatusCode?: string;
  description?: string;
  occurredAt?: string;
};

export type TrackingResult = {
  shipmentId: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  statusCode: string;
  subStatusCode?: string;
  isDelivered: boolean;
  events: TrackingEvent[];
  raw?: unknown;
};

export interface ShippingProvider {
  readonly name: string;
  isEnabled(): boolean;
  listCarriers(): Promise<CarrierOption[]>;
  getPriceQuotes(input: PriceQuoteInput): Promise<PriceQuoteOption[]>;
  createShipment(input: CreateShipmentInput): Promise<ShipmentResult>;
  getTracking(shipmentId: string): Promise<TrackingResult>;
}
