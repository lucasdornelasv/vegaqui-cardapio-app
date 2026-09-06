export interface Contact {
  address: string;
  phone: string;
  whatsapp: string;
  instagram: string;
}

export interface Product {
  images: string[];
  title: string;
  description: string;
  weightAndQuantity: string;
  price: number;
}

/** Formato salvo em `public/produtos/<pasta>/info.json`: `images` traz apenas os nomes dos arquivos. */
export interface ProductInfo {
  images: string[];
  title: string;
  description: string;
  weightAndQuantity: string;
  price: number;
}

export interface Category {
  title: string;
  products: Product[];
}

export interface MenuConfig {
  contact: Contact;
  categories: Category[];
  orderMessageTemplate: string;
}
