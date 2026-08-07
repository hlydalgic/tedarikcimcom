-- =============================================================================
-- 00001_extensions_enums.sql
-- Extensions and shared enum types for tedarikcim.com
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ---------------------------------------------------------------------------
-- Shared / identity
-- ---------------------------------------------------------------------------

CREATE TYPE public.entity_status AS ENUM (
  'draft',
  'pending',
  'active',
  'inactive',
  'rejected',
  'archived'
);

CREATE TYPE public.shop_moderation_mode AS ENUM (
  'MANUAL',
  'AUTO'
);

-- ---------------------------------------------------------------------------
-- Taxonomy
-- ---------------------------------------------------------------------------

CREATE TYPE public.attribute_type AS ENUM (
  'SELECT',
  'MULTI_SELECT',
  'BOOLEAN',
  'NUMBER',
  'NUMBER_WITH_UNIT',
  'RANGE',
  'TEXT',
  'TEXTAREA',
  'COLOR',
  'DATE',
  'YEAR'
);

CREATE TYPE public.filter_display_type AS ENUM (
  'CHECKBOX',
  'RADIO',
  'SELECT',
  'MULTI_SELECT',
  'RANGE_SLIDER',
  'MIN_MAX',
  'TOGGLE',
  'COLOR_SWATCHES',
  'SEARCHABLE_CHECKBOX_LIST'
);

CREATE TYPE public.system_filter_key AS ENUM (
  'price',
  'seller',
  'brand',
  'in_stock',
  'free_shipping',
  'rating'
);

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

CREATE TYPE public.product_status AS ENUM (
  'DRAFT',
  'PENDING_REVIEW',
  'ACTIVE',
  'REJECTED',
  'SUSPENDED',
  'ARCHIVED'
);

CREATE TYPE public.product_condition AS ENUM (
  'new',
  'refurbished',
  'used'
);

CREATE TYPE public.shipping_type AS ENUM (
  'STANDARD',
  'FREE',
  'SELLER_DEFINED',
  'QUOTE_REQUIRED',
  'PICKUP'
);

CREATE TYPE public.quote_status AS ENUM (
  'open',
  'quoted',
  'accepted',
  'rejected',
  'expired',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

CREATE TYPE public.order_status AS ENUM (
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'PARTIALLY_FULFILLED',
  'FULFILLED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'DISPUTED'
);

CREATE TYPE public.seller_order_status AS ENUM (
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'DISPUTED'
);

CREATE TYPE public.fulfillment_status AS ENUM (
  'UNFULFILLED',
  'PARTIAL',
  'FULFILLED',
  'CANCELLED'
);

CREATE TYPE public.shipment_status AS ENUM (
  'NOT_APPLICABLE',
  'AWAITING_SHIPMENT',
  'LABEL_CREATED',
  'IN_TRANSIT',
  'DELIVERED',
  'RETURNED',
  'FAILED'
);

CREATE TYPE public.order_item_status AS ENUM (
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'RETURNED',
  'REFUNDED'
);

-- ---------------------------------------------------------------------------
-- Payments & settlements
-- ---------------------------------------------------------------------------

CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'requires_action',
  'authorized',
  'paid',
  'failed',
  'refunded',
  'partially_refunded',
  'cancelled'
);

CREATE TYPE public.settlement_status AS ENUM (
  'PENDING',
  'WAITING_DELIVERY',
  'ELIGIBLE',
  'RELEASE_REQUESTED',
  'SETTLED',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE public.settlement_risk_level AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'NEW_SELLER'
);

-- ---------------------------------------------------------------------------
-- Invoices
-- ---------------------------------------------------------------------------

CREATE TYPE public.invoice_type AS ENUM (
  'SALES',
  'COMMISSION',
  'REFUND_CREDIT',
  'E_ARCHIVE',
  'E_INVOICE'
);

CREATE TYPE public.invoice_status AS ENUM (
  'DRAFT',
  'ISSUED',
  'SENT',
  'CANCELLED',
  'SUPERSEDED'
);
