import { MenuConfig, Product } from './menu.model';

function repeatProduct(product: Product, times: number): Product[] {
  return Array.from({ length: times }, () => product);
}

const feijoada: Product = {
  images: ['/produtos/feijoada/imagem-1.png'],
  title: 'Feijoada (Sem Glúten)',
  description:
    'Feijoada vegana tradicional, pronta para aquecer, sem glúten e sem nenhum ingrediente de origem animal.',
  weightAndQuantity: 'Peso líquido 500g',
  price: 35,
};

const coxinhaDeJaca: Product = {
  images: ['/produtos/coxinha_jaca/imagem-1.png'],
  title: 'Coxinha de Jaca',
  description:
    'Coxinha vegana recheada com jaca desfiada e temperada, crocante por fora e saborosa por dentro.',
  weightAndQuantity: '20 unidades de 35g cada • Peso líquido 700g',
  price: 35,
};

export const MENU_CONFIG: MenuConfig = {
  contact: {
    address: 'Av. Vereador Afonso Rosa da Silva, 477 - Jardim Santa Maria/Jacareí-SP',
    phone: '1239511428',
    whatsapp: '12988271965',
    instagram: 'veg_aqui',
  },
  orderMessageTemplate: 'Oi, vim pelo site da Veg Aqui e fiquei interessado no {{produto}}',
  // Massa de teste temporária: os 2 produtos reais repetidos 10x cada,
  // só para validar o layout dinâmico com uma lista grande.
  products: [...repeatProduct(feijoada, 10), ...repeatProduct(coxinhaDeJaca, 10)],
};
