import { onlyDigits } from './digits.util';

export function phoneLink(phone: string): string {
  return `tel:+55${onlyDigits(phone)}`;
}

export function whatsappLink(whatsapp: string, message?: string): string {
  const base = `https://wa.me/55${onlyDigits(whatsapp)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function instagramLink(handle: string): string {
  return `https://instagram.com/${handle}`;
}

export function renderOrderMessage(template: string, productTitle: string): string {
  return template.replace('{{produto}}', productTitle);
}
