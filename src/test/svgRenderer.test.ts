// @vitest-environment node
import {describe,it,expect} from 'vitest';import {renderSvgPreview} from '../../server/renderSvg.mjs';import {validateRaster} from '../../server/validateRaster.mjs';
describe('bounded actual SVG preview preparation',()=>{
 it('renders path geometry in a worker and decodes output PNG',async()=>{const source='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 10L90 10L50 90Z" fill="black"/></svg>';const png=await renderSvgPreview(source);expect((await validateRaster(png)).mimeType).toBe('image/png');});
 it('does not silently substitute SVG text fonts',async()=>{expect(()=>renderSvgPreview('<svg xmlns="http://www.w3.org/2000/svg"><text>Logo</text></svg>')).toThrow('font mapping');});
});
