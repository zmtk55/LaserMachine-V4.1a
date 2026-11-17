import {Worker} from 'node:worker_threads';
import {validateEngravingSvg} from './validateSvg.mjs';
/** Bounded preview preparation. Originals remain vectors; preview is not engraving output.
 * Text requiring actual font files is rejected for review rather than substituted.
 */
export function renderSvgPreview(source,{maxPixels=4_000_000,timeoutMs=3000,network=false}={}){
 if(network!==false)throw Error('Network must be disabled');
 validateEngravingSvg(source);
 if(/<(?:[A-Za-z_][\w.-]*:)?(?:text|tspan|textPath)(?:\s|>)/.test(source))throw Error('SVG text needs verified engraving font mapping before preview');
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./renderSvgWorker.mjs',import.meta.url),{execArgv:[],workerData:{source,width:512,maxPixels},resourceLimits:{maxOldGenerationSizeMb:128,stackSizeMb:4}});
  let settled=false;
  const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);worker.terminate();error?reject(error):resolve(Buffer.from(value));};
  const timer=setTimeout(()=>finish(Error('SVG preview timeout')),timeoutMs);
  worker.once('error',e=>finish(e));worker.once('message',m=>m.error?finish(Error(m.error)):finish(null,m.png));worker.once('exit',code=>{if(code!==0)finish(Error('SVG renderer exited'));});
 });
}
