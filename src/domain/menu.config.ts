import { MenuConfig, Product, ProductInfo } from './menu.model';

import feijoada from '@public/produtos/feijoada/info.json';
import coxinhaDeJaca from '@public/produtos/coxinha_jaca/info.json';
import conservaDeJilo from '@public/produtos/conserva_jiló/info.json';
import geleiaDeAmeixa from '@public/produtos/geleia_ameixa/info.json';
import beliscaoDeGoiabada from '@public/produtos/beliscao_goiabada/info.json';
import biscoitoAmanteigado from '@public/produtos/biscoito_amanteigado/info.json';
import chimichurri from '@public/produtos/chimichurri/info.json';
import farofaArtesanalErvasFinas from '@public/produtos/farofa_artesanal_ervas_finas/info.json';
import hamburguerDeJacaCongelado from '@public/produtos/hamburguer_jaca_congelado/info.json';
import kitBiscoitoComGeleia from '@public/produtos/kit_biscoito_geleia/info.json';
import kitPersonalizado from '@public/produtos/kit_personalizado/info.json';
import kitSalgadinhosCongelados from '@public/produtos/kit_salgadinhos_congelados/info.json';
import kombuchaDeGengibre from '@public/produtos/kombucha_gengibre/info.json';
import lemonPepper from '@public/produtos/lemon_pepper/info.json';
import molhoDePimenta from '@public/produtos/molho_pimenta/info.json';
import pimenta from '@public/produtos/pimenta/info.json';
import pizzaDeCalabresaAcebolada from '@public/produtos/pizza_calabreza_acebolada/info.json';
import pizzaDeFrangoComCatupiry from '@public/produtos/pizza_frango_catupiry/info.json';
import temperoCaseiroDeAlho from '@public/produtos/tempero_caseiro_alho/info.json';

/** `info.json` traz só o nome do arquivo de imagem; aqui montamos o path público completo. */
function toProduct(folder: string, info: ProductInfo): Product {
  return {
    ...info,
    images: info.images.map((fileName) => `/produtos/${folder}/${fileName}`),
  };
}

// A ordem dos produtos abaixo define a ordem em que eles aparecem em cada categoria.
const products: Product[] = [
  toProduct('feijoada', feijoada),
  toProduct('coxinha_jaca', coxinhaDeJaca),
  toProduct('conserva_jiló', conservaDeJilo),
  toProduct('geleia_ameixa', geleiaDeAmeixa),
  toProduct('beliscao_goiabada', beliscaoDeGoiabada),
  toProduct('biscoito_amanteigado', biscoitoAmanteigado),
  toProduct('chimichurri', chimichurri),
  toProduct('farofa_artesanal_ervas_finas', farofaArtesanalErvasFinas),
  toProduct('hamburguer_jaca_congelado', hamburguerDeJacaCongelado),
  toProduct('kit_biscoito_geleia', kitBiscoitoComGeleia),
  toProduct('kit_personalizado', kitPersonalizado),
  toProduct('kit_salgadinhos_congelados', kitSalgadinhosCongelados),
  toProduct('kombucha_gengibre', kombuchaDeGengibre),
  toProduct('lemon_pepper', lemonPepper),
  toProduct('molho_pimenta', molhoDePimenta),
  toProduct('pimenta', pimenta),
  toProduct('pizza_calabreza_acebolada', pizzaDeCalabresaAcebolada),
  toProduct('pizza_frango_catupiry', pizzaDeFrangoComCatupiry),
  toProduct('tempero_caseiro_alho', temperoCaseiroDeAlho),
];

export const MENU_CONFIG: MenuConfig = {
  contact: {
    address: 'Av. Vereador Afonso Rosa da Silva, 477 - Jardim Santa Maria/Jacareí-SP',
    phone: '1239511428',
    whatsapp: '12988271965',
    instagram: 'veg_aqui',
  },
  orderMessageTemplate: 'Oi, vim pelo site da Veg Aqui e fiquei interessado no {{produto}}',
  // A ordem das categorias abaixo define a ordem em que elas aparecem no cardápio.
  categories: [
    { title: 'Congelados', products },
    { title: 'Empório', products },
    { title: 'Personalizados', products },
    { title: 'Sob Encomenda', products },
  ],
};
