const DIACRITICS_REGEX = /[̀-ͯ]/g;

/** Converte um título como "Sob Encomenda" em uma âncora de URL como "sob-encomenda". */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
