from PIL import Image,ImageDraw,ImageFilter
import numpy as np,os
from pathlib import Path
root=str(Path(__file__).resolve().parent)
# Manually traced coating only. Steel rims/base and logo badges excluded.
shapes={
'frio-mobile': ([(122,338),(143,340),(245,340),(266,337),(262,463),(255,483),(250,515),(247,580),(151,580),(147,513),(140,484),(129,473)],(165,548,224,577)),
'calor-mobile': ([(133,341),(153,344),(230,344),(251,340),(247,451),(240,470),(236,502),(233,559),(146,559),(142,494),(136,470)],(172,528,224,557)),
'outdoor-mobile': ([(85,360),(116,356),(231,353),(258,350),(253,512),(247,543),(238,572),(238,658),(112,659),(108,563),(98,545),(89,522)],(136,615,220,651)),
'outdoor-desktop': ([(1001,178),(1030,175),(1260,173),(1324,180),(1321,474),(1306,501),(1293,550),(1283,721),(1040,721),(1034,546),(1013,512),(1003,485)],(1097,645,1229,704))
}
colors={'blanco':'ffffff','gris':'a1a1aa','azul':'1e40af','cielo':'7dd3fc','rojo':'dc2626'}
checks=[]
for name,(points,badge) in shapes.items():
 im=Image.open(f'{root}/{name}.webp').convert('RGB');w,h=im.size
 scale=(1,1)
 pts=[(round(x*scale[0]),round(y*scale[1])) for x,y in points];bb=tuple(round(v*scale[i%2]) for i,v in enumerate(badge))
 mask=Image.new('L',im.size);d=ImageDraw.Draw(mask);d.polygon(pts,fill=255);d.rounded_rectangle(bb,radius=3,fill=0);mask=mask.filter(ImageFilter.GaussianBlur(.65));mask.save(f'{root}/{name}-coating-mask.png')
 a=np.array(im,dtype=float)/255;m=np.array(mask,dtype=float)[:,:,None]/255;lum=(a[:,:,:1]*.2126+a[:,:,1:2]*.7152+a[:,:,2:]*.0722)
 for label,hx in colors.items():
  c=np.array([int(hx[i:i+2],16)/255 for i in (0,2,4)])
  if label=='blanco':
   # White powder coat reads bright and even; shade from local deviation
   # around the mask median so the dark base coat stops graying/staining it.
   region=lum[m[:,:,0]>0.5];med=np.median(region);spread=np.percentile(region,95)-med+1e-6
   dev=np.clip((lum-med)/spread,-1.6,1.6)
   colored=np.clip(c*(.88+.14*dev)+.05*dev,0,1)
  else:
   colored=np.clip(c*(.22+2.05*lum)+.10*lum,0,1)
  # Retain near-white reflections without tinting them.
  spec=np.clip((lum-.55)/.35,0,1);colored=colored*(1-spec)+a*spec
  b=np.round((a*(1-m)+colored*m)*255).astype('uint8');Image.fromarray(b).save(f'{root}/{name}-{label}.webp',lossless=True)
  outside=np.array(mask)==0;checks.append((name,label,int(np.abs(b.astype(int)-np.array(im).astype(int))[outside].max())))
 # contact sheet at useful scale for coating inspection
 canv=Image.new('RGB',(w*3,h));
 for i,label in enumerate(['','-rojo','-blanco']):canv.paste(Image.open(f'{root}/{name}{label}.webp'),(i*w,0))
 canv.thumbnail((1500,780));canv.save(f'{root}/review-{name}.png')
print('maximum change outside coating masks',max(x[2] for x in checks));print('source dimensions',[(n,Image.open(f'{root}/{n}.webp').size) for n in shapes])
