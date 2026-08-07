export type MockCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
  image: string;
};

export type MockProduct = {
  id: string;
  title: string;
  slug: string;
  brand: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  category: string;
  badge?: string;
};

export const mockCategories: MockCategory[] = [
  {
    id: "1",
    name: "Plastik Boru",
    slug: "plastik-boru",
    description: "PPRC, HDPE, UPVC ve koruge sistemler",
    productCount: 1840,
    image:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "2",
    name: "Vanalar",
    slug: "vana",
    description: "Küresel, kelebek ve bağlantı elemanları",
    productCount: 960,
    image:
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "3",
    name: "Hırdavat",
    slug: "hirdavat",
    description: "Tesisat ve montaj malzemeleri",
    productCount: 2210,
    image:
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "4",
    name: "Sulama",
    slug: "sulama",
    description: "Bahçe hortumu ve sulama sistemleri",
    productCount: 540,
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "5",
    name: "Altyapı",
    slug: "altyapi",
    description: "İnşaat ve altyapı malzemeleri",
    productCount: 1280,
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "6",
    name: "Bağlantı",
    slug: "baglanti",
    description: "Fitting, rakor ve bağlantı parçaları",
    productCount: 1570,
    image:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80",
  },
];

export const mockProducts: MockProduct[] = [
  {
    id: "p1",
    title: "HDPE Boru PE100 PN16 SDR11 Ø63",
    slug: "hdpe-boru-pe100-pn16-63",
    brand: "Fırat",
    price: 189.9,
    compareAtPrice: 219.0,
    category: "HDPE Boru",
    badge: "Stokta",
    image:
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "p2",
    title: "Küresel Vana Pirinç Dişli 1\" PN25",
    slug: "kuresel-vana-pirinc-1-pn25",
    brand: "Kalde",
    price: 246.5,
    category: "Küresel Vana",
    badge: "Çok satan",
    image:
      "https://images.unsplash.com/photo-1581092335397-9583eb92d232?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "p3",
    title: "PPRC Boru 20 mm × 4 m Tip 3",
    slug: "pprc-boru-20mm-4m",
    brand: "Dizayn",
    price: 64.9,
    compareAtPrice: 74.9,
    category: "PPRC Boru",
    image:
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "p4",
    title: "Bahçe Hortumu UV Dayanımlı 25 m",
    slug: "bahce-hortumu-25m",
    brand: "Superlit",
    price: 329.0,
    category: "Bahçe Hortumu",
    badge: "Ücretsiz kargo",
    image:
      "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=800&q=80",
  },
];

export const mockNavCategories = [
  { name: "Tesisat", slug: "tesisat" },
  { name: "Boru", slug: "boru" },
  { name: "Vana", slug: "vana" },
  { name: "Hırdavat", slug: "hirdavat" },
  { name: "Sulama", slug: "sulama" },
  { name: "Altyapı", slug: "altyapi" },
];

export const trustStats = [
  { label: "Aktif satıcı", value: "1.200+" },
  { label: "Teknik ürün", value: "48.000+" },
  { label: "Güvenli ödeme", value: "iyzico" },
  { label: "Kargo ağı", value: "Tek noktadan" },
];
