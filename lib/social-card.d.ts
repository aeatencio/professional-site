import type { Buffer } from 'node:buffer';

export interface SocialCard {
  href: string;
  publicPath: string;
  distPath: string;
  type: 'image/png';
  width: number;
  height: number;
}

export const SOCIAL_CARDS: Record<'en' | 'es', SocialCard>;

export function socialCardAlt(shared: {
  name: string;
  professionalIdentity: string;
}): string;

export function inspectPng(buffer: Buffer): {
  bytes: number;
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
  interlace: number;
};

export function verifySocialCard(options?: { dist?: boolean }): Promise<void>;
