import{it,expect}from'vitest';import{alphaBounds}from'../../utils/alphaBounds';
it('removes only transparent padding, never clips artwork',()=>{const d=new Uint8ClampedArray(100*120*4);for(let y=50;y<61;y++)for(let x=10;x<90;x++)d[(y*100+x)*4+3]=255;expect(alphaBounds(d,100,120,4)).toEqual({x:6,y:46,width:88,height:19});expect(alphaBounds(new Uint8ClampedArray(16),2,2)).toBeNull();});
