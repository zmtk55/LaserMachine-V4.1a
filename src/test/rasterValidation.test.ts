import {describe,it,expect} from 'vitest';import sharp from 'sharp';import {validateRaster} from '../../server/validateRaster.mjs';
describe('server raster preparation',()=>{
 it.each(['png','jpeg','webp'] as const)('decodes real %s and preserves original bytes',async format=>{const bytes=await sharp({create:{width:10,height:12,channels:3,background:'black'}}).toFormat(format).toBuffer();const result=await validateRaster(bytes);expect(result.width).toBe(10);expect(result.height).toBe(12);expect(result.original).toEqual(bytes);});
 it('rejects a text file disguised by caller as image',async()=>{await expect(validateRaster(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).rejects.toThrow();});
 it('rejects truncated PNG even if metadata header exists',async()=>{const bytes=await sharp({create:{width:20,height:20,channels:3,background:'black'}}).png().toBuffer();await expect(validateRaster(bytes.subarray(0,bytes.length-20))).rejects.toThrow();});
 it('rejects excessive byte size before decoding',async()=>{await expect(validateRaster(Buffer.alloc(5_000_001))).rejects.toThrow('size');});
});
