import {describe,it,expect} from 'vitest';import sharp from 'sharp';import {verifyUploadedAsset} from '../../server/verifyAsset.mjs';
describe('uploaded asset provenance preparation',()=>{
 it('preserves a legitimate original SVG without declaring checkout authorization',async()=>{const bytes=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L1 1"/></svg>');const result=await verifyUploadedAsset(bytes,'image/svg+xml');expect(result.original).toBe(bytes.toString());expect(result.verifiedForCheckout).toBe(false);});
 it('rejects caller MIME mismatch',async()=>{const bytes=await sharp({create:{width:2,height:2,channels:3,background:'black'}}).png().toBuffer();await expect(verifyUploadedAsset(bytes,'image/jpeg')).rejects.toThrow('MIME');});
 it('rejects invalid UTF-8 SVG',async()=>{await expect(verifyUploadedAsset(Buffer.from([0xff,0xfe]),'image/svg+xml')).rejects.toThrow('UTF-8');});
});
