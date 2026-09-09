import { MenuConfig, Product, ProductInfo } from './menu.model';

import feijoada from '@public/produtos/feijoada/info.json';
import coxinhaDeJaca from '@public/produtos/coxinha_jaca/info.json';
import centoCoxinhaDeJaca from '@public/produtos/cento_coxinha_jaca/info.json';
import centoEsfihaDeBerinjelaComAlcaparras from '@public/produtos/cento_esfiha_berinjela_alcaparras/info.json';
import centoPastelDeBrocolisComTomateSeco from '@public/produtos/cento_pastel_brocolis_tomate_seco/info.json';
import empadaDePalmito from '@public/produtos/empada_palmito/info.json';
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

const feijoadaProduct = toProduct('feijoada', feijoada);
const coxinhaDeJacaProduct = toProduct('coxinha_jaca', coxinhaDeJaca);
const conservaDeJiloProduct = toProduct('conserva_jiló', conservaDeJilo);
const geleiaDeAmeixaProduct = toProduct('geleia_ameixa', geleiaDeAmeixa);
const beliscaoDeGoiabadaProduct = toProduct('beliscao_goiabada', beliscaoDeGoiabada);
const biscoitoAmanteigadoProduct = toProduct('biscoito_amanteigado', biscoitoAmanteigado);
const chimichurriProduct = toProduct('chimichurri', chimichurri);
const farofaArtesanalErvasFinasProduct = toProduct(
  'farofa_artesanal_ervas_finas',
  farofaArtesanalErvasFinas,
);
const hamburguerDeJacaCongeladoProduct = toProduct(
  'hamburguer_jaca_congelado',
  hamburguerDeJacaCongelado,
);
const kitBiscoitoComGeleiaProduct = toProduct('kit_biscoito_geleia', kitBiscoitoComGeleia);
const kitPersonalizadoProduct = toProduct('kit_personalizado', kitPersonalizado);
const kitSalgadinhosCongeladosProduct = toProduct(
  'kit_salgadinhos_congelados',
  kitSalgadinhosCongelados,
);
const kombuchaDeGengibreProduct = toProduct('kombucha_gengibre', kombuchaDeGengibre);
const lemonPepperProduct = toProduct('lemon_pepper', lemonPepper);
const molhoDePimentaProduct = toProduct('molho_pimenta', molhoDePimenta);
const pimentaProduct = toProduct('pimenta', pimenta);
const pizzaDeCalabresaAceboladaProduct = toProduct(
  'pizza_calabreza_acebolada',
  pizzaDeCalabresaAcebolada,
);
const pizzaDeFrangoComCatupiryProduct = toProduct(
  'pizza_frango_catupiry',
  pizzaDeFrangoComCatupiry,
);
const temperoCaseiroDeAlhoProduct = toProduct('tempero_caseiro_alho', temperoCaseiroDeAlho);
const centoCoxinhaDeJacaProduct = toProduct('cento_coxinha_jaca', centoCoxinhaDeJaca);
const centoEsfihaDeBerinjelaComAlcaparrasProduct = toProduct(
  'cento_esfiha_berinjela_alcaparras',
  centoEsfihaDeBerinjelaComAlcaparras,
);
const centoPastelDeBrocolisComTomateSecoProduct = toProduct(
  'cento_pastel_brocolis_tomate_seco',
  centoPastelDeBrocolisComTomateSeco,
);
const empadaDePalmitoProduct = toProduct('empada_palmito', empadaDePalmito);

// A ordem dos produtos abaixo define a ordem em que eles aparecem em cada categoria.
const emporioProducts: Product[] = [
  conservaDeJiloProduct,
  geleiaDeAmeixaProduct,
  temperoCaseiroDeAlhoProduct,
  chimichurriProduct,
  lemonPepperProduct,
  molhoDePimentaProduct,
  beliscaoDeGoiabadaProduct,
  pimentaProduct,
  farofaArtesanalErvasFinasProduct,
  kombuchaDeGengibreProduct,
];

const congeladosProducts: Product[] = [
  hamburguerDeJacaCongeladoProduct,
  coxinhaDeJacaProduct,
  kitSalgadinhosCongeladosProduct,
  pizzaDeFrangoComCatupiryProduct,
  pizzaDeCalabresaAceboladaProduct,
  feijoadaProduct,
];

const personalizadosSobEncomendaProducts: Product[] = [
  kitPersonalizadoProduct,
  biscoitoAmanteigadoProduct,
  kitBiscoitoComGeleiaProduct,
  centoCoxinhaDeJacaProduct,
  centoEsfihaDeBerinjelaComAlcaparrasProduct,
  centoPastelDeBrocolisComTomateSecoProduct,
  empadaDePalmitoProduct,
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
    { title: 'Congelados', products: congeladosProducts },
    { title: 'Empório', products: emporioProducts },
    { title: 'Personalizados/Sob Encomenda', products: personalizadosSobEncomendaProducts },
  ],
};
