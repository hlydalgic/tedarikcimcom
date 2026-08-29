export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  unitPrice: number;
  currency: string;
  quantity: number;
  stock: number;
  shopId: string;
  shopName: string;
  shopSlug: string;
  sellerId: string;
  brandName: string | null;
  shippingType: string;
  shippingPrice: number | null;
};

export type CartShopGroup = {
  shopId: string;
  shopName: string;
  shopSlug: string;
  sellerId: string;
  items: CartItem[];
  subtotal: number;
  hasQuoteRequired: boolean;
};
