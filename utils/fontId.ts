import type {FontOption} from '../types';
/** Resolve persisted string/number IDs to the existing catalog ID. Never renumber or replace an unknown choice. */
export function catalogFontId(fonts:Pick<FontOption,'id'>[],value:number|string|null|undefined,fallback:number):number {
 if(value==null)return fallback;
 return fonts.find(font=>String(font.id)===String(value))?.id ?? value as number;
}
