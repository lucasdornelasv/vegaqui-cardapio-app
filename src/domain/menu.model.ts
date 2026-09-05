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

export interface MenuConfig {
  contact: Contact;
  products: Product[];
  orderMessageTemplate: string;
}
