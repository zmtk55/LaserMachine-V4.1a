/** Product and engraving are always composed in the same 500 x 600 logical canvas. */
export function previewImageScale(illustrative?: boolean, ownPhoto?: string | null) {
  return ownPhoto || illustrative ? 1 : 1.45;
}
export function previewInk(hex = '#3f3f46') {
  const raw=hex.replace('#','');
  const n=parseInt(raw.length===3?raw.split('').map(x=>x+x).join(''):raw,16);
  const lum=.2126*((n>>16)&255)+.7152*((n>>8)&255)+.0722*(n&255);
  return lum<110?'#e4e4e7':'#52525b';
}
