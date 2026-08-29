import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  AdminQuoteRequestRow,
  QuoteCheckoutDetail,
  QuoteRequestDetail,
  QuoteRequestListItem,
  SellerQuoteRequestDetail,
  SellerQuoteRequestListItem,
  SellerQuoteRow,
  QuoteAddressSnapshot,
} from "@/lib/quotes/types";

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function primaryImage(
  images: { url: string; is_primary: boolean; sort_order: number }[] | null | undefined
): string | null {
  if (!images?.length) return null;
  const primary = images.find((i) => i.is_primary);
  if (primary) return primary.url;
  return [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
}

async function mapSellerQuotes(
  supabase: ReturnType<typeof createClient>,
  requestId: string
): Promise<SellerQuoteRow[]> {
  const { data, error } = await supabase
    .from("seller_quotes")
    .select(
      `id, quote_request_id, seller_id, shop_id, price, currency,
       estimated_days, note, status, created_at, updated_at,
       shops(name, slug)`
    )
    .eq("quote_request_id", requestId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const shop = unwrapOne(row.shops as { name: string; slug: string } | { name: string; slug: string }[]);
    return {
      id: row.id,
      quote_request_id: row.quote_request_id,
      seller_id: row.seller_id,
      shop_id: row.shop_id,
      shop_name: shop?.name ?? "Mağaza",
      shop_slug: shop?.slug ?? "",
      price: Number(row.price),
      currency: row.currency,
      estimated_days: row.estimated_days,
      note: row.note,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });
}

export async function listBuyerQuoteRequests(): Promise<QuoteRequestListItem[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  await supabase.rpc("expire_old_quotes");

  const { data, error } = await supabase
    .from("quote_requests")
    .select(
      `id, product_id, quantity, status, note, expires_at, created_at,
       products(title, slug, product_images(url, is_primary, sort_order)),
       seller_quotes(id)`
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const product = unwrapOne(
      row.products as
        | {
            title: string;
            slug: string;
            product_images: { url: string; is_primary: boolean; sort_order: number }[];
          }
        | {
            title: string;
            slug: string;
            product_images: { url: string; is_primary: boolean; sort_order: number }[];
          }[]
    );
    const images = product?.product_images ?? [];
    return {
      id: row.id,
      product_id: row.product_id,
      product_title: product?.title ?? "Ürün",
      product_slug: product?.slug ?? "",
      product_image: primaryImage(images),
      quantity: row.quantity,
      status: row.status,
      note: row.note,
      expires_at: row.expires_at,
      created_at: row.created_at,
      quote_count: Array.isArray(row.seller_quotes) ? row.seller_quotes.length : 0,
    };
  });
}

export async function getBuyerQuoteRequest(
  requestId: string
): Promise<QuoteRequestDetail | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  await supabase.rpc("expire_old_quotes");

  const { data: row, error } = await supabase
    .from("quote_requests")
    .select(
      `id, customer_id, product_id, quantity, delivery_address, note,
       status, expires_at, created_at,
       products(title, slug, price, currency, product_images(url, is_primary, sort_order))`
    )
    .eq("id", requestId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) return null;

  const product = unwrapOne(
    row.products as
      | {
          title: string;
          slug: string;
          price: number;
          currency: string;
          product_images: { url: string; is_primary: boolean; sort_order: number }[];
        }
      | {
          title: string;
          slug: string;
          price: number;
          currency: string;
          product_images: { url: string; is_primary: boolean; sort_order: number }[];
        }[]
  );

  const seller_quotes = await mapSellerQuotes(supabase, requestId);

  return {
    id: row.id,
    customer_id: row.customer_id,
    product_id: row.product_id,
    product_title: product?.title ?? "Ürün",
    product_slug: product?.slug ?? "",
    product_image: primaryImage(product?.product_images ?? []),
    product_price: Number(product?.price ?? 0),
    product_currency: product?.currency ?? "TRY",
    quantity: row.quantity,
    delivery_address: row.delivery_address as QuoteAddressSnapshot,
    note: row.note,
    status: row.status,
    expires_at: row.expires_at,
    created_at: row.created_at,
    seller_quotes,
  };
}

export async function listSellerQuoteRequests(): Promise<SellerQuoteRequestListItem[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  await supabase.rpc("expire_old_quotes");

  const { data: products } = await supabase
    .from("products")
    .select("id")
    .eq("seller_id", user.id);

  const productIds = (products ?? []).map((p) => p.id);
  if (!productIds.length) return [];

  const { data, error } = await supabase
    .from("quote_requests")
    .select(
      `id, quantity, status, note, expires_at, created_at, delivery_address,
       products(title, slug),
       users(full_name),
       seller_quotes!inner(id, seller_id, status, price)`
    )
    .in("product_id", productIds)
    .eq("seller_quotes.seller_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    // Fallback: requests for seller's products without inner join filter
    const { data: reqs, error: reqErr } = await supabase
      .from("quote_requests")
      .select(
        `id, quantity, status, note, expires_at, created_at,
         products(title, slug),
         users(full_name)`
      )
      .in("product_id", productIds)
      .in("status", ["open", "quoted", "accepted"])
      .order("created_at", { ascending: false });

    if (reqErr) throw new Error(reqErr.message);

    const results: SellerQuoteRequestListItem[] = [];
    for (const row of reqs ?? []) {
      const { data: myQuote } = await supabase
        .from("seller_quotes")
        .select("status, price")
        .eq("quote_request_id", row.id)
        .eq("seller_id", user.id)
        .maybeSingle();

      const product = unwrapOne(
        row.products as { title: string; slug: string } | { title: string; slug: string }[]
      );
      const customer = unwrapOne(
        row.users as { full_name: string | null } | { full_name: string | null }[]
      );

      results.push({
        id: row.id,
        product_title: product?.title ?? "Ürün",
        product_slug: product?.slug ?? "",
        quantity: row.quantity,
        status: row.status,
        note: row.note,
        expires_at: row.expires_at,
        created_at: row.created_at,
        customer_name: customer?.full_name ?? null,
        my_quote_status: myQuote?.status ?? null,
        my_quote_price: myQuote?.price != null ? Number(myQuote.price) : null,
      });
    }
    return results;
  }

  return (data ?? []).map((row) => {
    const product = unwrapOne(
      row.products as { title: string; slug: string } | { title: string; slug: string }[]
    );
    const customer = unwrapOne(
      row.users as { full_name: string | null } | { full_name: string | null }[]
    );
    const quotes = Array.isArray(row.seller_quotes) ? row.seller_quotes : [row.seller_quotes];
    const mine = quotes.find((q) => q?.seller_id === user.id) ?? quotes[0];

    return {
      id: row.id,
      product_title: product?.title ?? "Ürün",
      product_slug: product?.slug ?? "",
      quantity: row.quantity,
      status: row.status,
      note: row.note,
      expires_at: row.expires_at,
      created_at: row.created_at,
      customer_name: customer?.full_name ?? null,
      my_quote_status: mine?.status ?? null,
      my_quote_price: mine?.price != null ? Number(mine.price) : null,
    };
  });
}

export async function listOpenSellerQuoteRequests(): Promise<SellerQuoteRequestListItem[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  await supabase.rpc("expire_old_quotes");

  const { data: products } = await supabase
    .from("products")
    .select("id")
    .eq("seller_id", user.id);

  const productIds = (products ?? []).map((p) => p.id);
  if (!productIds.length) return [];

  const { data: reqs, error } = await supabase
    .from("quote_requests")
    .select(
      `id, quantity, status, note, expires_at, created_at,
       products(title, slug),
       users(full_name)`
    )
    .in("product_id", productIds)
    .in("status", ["open", "quoted"])
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const results: SellerQuoteRequestListItem[] = [];
  for (const row of reqs ?? []) {
    const { data: myQuote } = await supabase
      .from("seller_quotes")
      .select("status, price")
      .eq("quote_request_id", row.id)
      .eq("seller_id", user.id)
      .maybeSingle();

    const product = unwrapOne(
      row.products as { title: string; slug: string } | { title: string; slug: string }[]
    );
    const customer = unwrapOne(
      row.users as { full_name: string | null } | { full_name: string | null }[]
    );

    results.push({
      id: row.id,
      product_title: product?.title ?? "Ürün",
      product_slug: product?.slug ?? "",
      quantity: row.quantity,
      status: row.status,
      note: row.note,
      expires_at: row.expires_at,
      created_at: row.created_at,
      customer_name: customer?.full_name ?? null,
      my_quote_status: myQuote?.status ?? null,
      my_quote_price: myQuote?.price != null ? Number(myQuote.price) : null,
    });
  }
  return results;
}

export async function getSellerQuoteRequest(
  requestId: string
): Promise<SellerQuoteRequestDetail | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row, error } = await supabase
    .from("quote_requests")
    .select(
      `id, customer_id, product_id, quantity, delivery_address, note,
       status, expires_at, created_at,
       products(title, slug, price, currency, seller_id, product_images(url, is_primary, sort_order)),
       users(full_name)`
    )
    .eq("id", requestId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) return null;

  const product = unwrapOne(
    row.products as {
      title: string;
      slug: string;
      price: number;
      currency: string;
      seller_id: string;
      product_images: { url: string; is_primary: boolean; sort_order: number }[];
    } | {
      title: string;
      slug: string;
      price: number;
      currency: string;
      seller_id: string;
      product_images: { url: string; is_primary: boolean; sort_order: number }[];
    }[]
  );

  if (product?.seller_id !== user.id) return null;

  const { data: myQuoteRow } = await supabase
    .from("seller_quotes")
    .select(
      `id, quote_request_id, seller_id, shop_id, price, currency,
       estimated_days, note, status, created_at, updated_at,
       shops(name, slug)`
    )
    .eq("quote_request_id", requestId)
    .eq("seller_id", user.id)
    .maybeSingle();

  let my_quote: SellerQuoteRow | null = null;
  if (myQuoteRow) {
    const shop = unwrapOne(
      myQuoteRow.shops as { name: string; slug: string } | { name: string; slug: string }[]
    );
    my_quote = {
      id: myQuoteRow.id,
      quote_request_id: myQuoteRow.quote_request_id,
      seller_id: myQuoteRow.seller_id,
      shop_id: myQuoteRow.shop_id,
      shop_name: shop?.name ?? "Mağaza",
      shop_slug: shop?.slug ?? "",
      price: Number(myQuoteRow.price),
      currency: myQuoteRow.currency,
      estimated_days: myQuoteRow.estimated_days,
      note: myQuoteRow.note,
      status: myQuoteRow.status,
      created_at: myQuoteRow.created_at,
      updated_at: myQuoteRow.updated_at,
    };
  }

  const customer = unwrapOne(
    row.users as { full_name: string | null } | { full_name: string | null }[]
  );

  return {
    id: row.id,
    customer_id: row.customer_id,
    product_id: row.product_id,
    product_title: product?.title ?? "Ürün",
    product_slug: product?.slug ?? "",
    product_image: primaryImage(product?.product_images ?? []),
    product_price: Number(product?.price ?? 0),
    product_currency: product?.currency ?? "TRY",
    quantity: row.quantity,
    delivery_address: row.delivery_address as QuoteAddressSnapshot,
    note: row.note,
    status: row.status,
    expires_at: row.expires_at,
    created_at: row.created_at,
    seller_quotes: my_quote ? [my_quote] : [],
    customer_name: customer?.full_name ?? null,
    my_quote,
  };
}

export async function getQuoteCheckoutDetail(
  sellerQuoteId: string
): Promise<QuoteCheckoutDetail | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: sq, error } = await supabase
    .from("seller_quotes")
    .select(
      `id, price, currency, estimated_days, status,
       quote_requests(
         id, customer_id, quantity, delivery_address, status,
         products(title, slug, price, product_images(url, is_primary, sort_order))
       ),
       shops(name)`
    )
    .eq("id", sellerQuoteId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!sq) return null;

  const qrRaw = unwrapOne(sq.quote_requests as unknown as Record<string, unknown>[] | Record<string, unknown> | null);
  if (!qrRaw) return null;

  const qr = qrRaw as {
    id: string;
    customer_id: string;
    quantity: number;
    delivery_address: QuoteAddressSnapshot;
    status: string;
    products: unknown;
  };

  if (qr.customer_id !== user.id || sq.status !== "accepted") return null;

  const product = unwrapOne(
    qr.products as
      | {
          title: string;
          slug: string;
          price: number;
          product_images: { url: string; is_primary: boolean; sort_order: number }[];
        }
      | {
          title: string;
          slug: string;
          price: number;
          product_images: { url: string; is_primary: boolean; sort_order: number }[];
        }[]
  );
  const shop = unwrapOne(sq.shops as { name: string } | { name: string }[]);

  return {
    quote_id: sq.id,
    request_id: qr.id,
    product_title: product?.title ?? "Ürün",
    product_slug: product?.slug ?? "",
    product_image: primaryImage(product?.product_images ?? []),
    quantity: qr.quantity,
    unit_price: Number(product?.price ?? 0),
    shipping_price: Number(sq.price),
    currency: sq.currency,
    shop_name: shop?.name ?? "Mağaza",
    delivery_address: qr.delivery_address,
    estimated_days: sq.estimated_days,
  };
}

export async function listAdminQuoteRequests(
  filter?: "open" | "expired" | "all"
): Promise<AdminQuoteRequestRow[]> {
  const admin = getSupabaseAdmin();
  await admin.rpc("expire_old_quotes");

  let query = admin
    .from("quote_requests")
    .select(
      `id, quantity, status, expires_at, created_at,
       products(title),
       users(full_name),
       seller_quotes(id)`
    )
    .order("created_at", { ascending: false });

  if (filter === "open") {
    query = query.in("status", ["open", "quoted"]);
  } else if (filter === "expired") {
    query = query.eq("status", "expired");
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const now = Date.now();
  return (data ?? []).map((row) => {
    const product = unwrapOne(
      row.products as { title: string } | { title: string }[]
    );
    const customer = unwrapOne(
      row.users as { full_name: string | null } | { full_name: string | null }[]
    );
    const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : null;
    return {
      id: row.id,
      product_title: product?.title ?? "Ürün",
      customer_name: customer?.full_name ?? null,
      quantity: row.quantity,
      status: row.status,
      expires_at: row.expires_at,
      created_at: row.created_at,
      quote_count: Array.isArray(row.seller_quotes) ? row.seller_quotes.length : 0,
      is_expired:
        row.status === "expired" ||
        (expiresAt != null && expiresAt < now && ["open", "quoted"].includes(row.status)),
    };
  });
}
