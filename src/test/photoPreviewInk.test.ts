import {describe,it,expect} from 'vitest';
import {photoPreviewInk,monogramPreviewUrl} from '../../utils/photoPreviewInk';
describe('own-photo preview contrast',()=>{
 it('uses the photo pixels rather than unrelated catalogue colour',()=>{expect(photoPreviewInk([255,255,255,255],'#e4e4e7')).toBe('#52525b');expect(photoPreviewInk([0,0,0,255],'#52525b')).toBe('#e4e4e7');expect(photoPreviewInk([255,255,255,0],'fallback')).toBe('fallback');});
 it('recolours only marked generated monograms and leaves the original SVG unchanged',()=>{const prefix='data:image/svg+xml;charset=utf-8,',svg='<svg data-lm-monogram="true"><path fill="#c4c9cf"/></svg>',url=prefix+encodeURIComponent(svg);expect(decodeURIComponent(monogramPreviewUrl(url,'#52525b'))).toContain('#52525b');expect(decodeURIComponent(url)).toContain('#c4c9cf');const unmarked=prefix+encodeURIComponent('<svg><path fill="#c4c9cf"/></svg>');expect(monogramPreviewUrl(unmarked,'#52525b')).toBe(unmarked);expect(monogramPreviewUrl('https://example.invalid/logo.png','#52525b')).toBe('https://example.invalid/logo.png');});
});
