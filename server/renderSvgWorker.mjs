import {parentPort,workerData} from 'node:worker_threads';
import {Resvg} from '@resvg/resvg-js';
try{
 const renderer=new Resvg(workerData.source,{fitTo:{mode:'width',value:workerData.width},font:{loadSystemFonts:false,fontFiles:[]}});
 if(512*Math.ceil(512*renderer.height/renderer.width)>workerData.maxPixels)throw Error('Preview dimensions exceed limits');
 const rendered=renderer.render();
 if(rendered.width*rendered.height>workerData.maxPixels)throw Error('Preview dimensions exceed limits');
 parentPort.postMessage({png:rendered.asPng()});
}catch(error){parentPort.postMessage({error:error.message});}
