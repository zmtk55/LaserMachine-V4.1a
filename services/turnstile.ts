// Turnstile (Cloudflare) para captchaToken de los flujos auth y del futuro envio
// de invitado. La site key es PUBLICA por diseno (identifica el sitio, no es
// credencial); el secret solo vive en servidor/vault. Sin site key configurada
// el captcha queda desactivado y los flujos funcionan exactamente como antes
// (gotrue ignora captchaToken cuando el toggle del servidor esta apagado), asi
// que este cableado no rompe el build actual de produccion.
// Se lee en cada llamada (no al cargar el modulo) para que pruebas y builds
// sin la variable sigan el camino de captcha desactivado.
const siteKey = () => (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() || undefined;
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

declare global {
  interface Window { turnstile?: any }
}

let scriptPromise: Promise<void> | null = null;
let widgetId: string | null = null;
let pending: {resolve:(token:string)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>} | null = null;
function finish(token?:string,error?:Error){
 const current=pending;if(!current)return;pending=null;clearTimeout(current.timer);
 // Clear callbacks before reset: a reset may itself emit an event.
 try{if(widgetId!==null)window.turnstile?.reset(widgetId);}catch{}
 if(error)current.reject(error);else if(token)current.resolve(token);
 else current.reject(Error('La verificación anti-bots no devolvió un token. Intenta otra vez.'));
}

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`);
    const script = existing ?? document.createElement('script');
    let settled = false;
    const done = () => { if (!settled && window.turnstile) { settled = true; resolve(); } };
    const fail = () => { if (!settled) { settled = true; scriptPromise = null; reject(Error('No se pudo cargar la verificación anti-bots. Revisa tu conexión e intenta otra vez.')); } };
    if (!existing) {
      script.src = SCRIPT_URL; script.async = true; script.defer = true;
      script.onload = done; script.onerror = fail;
      document.head.appendChild(script);
    }
    // render=explicit notifica via window.turnstile listo; poll breve por si el
    // script ya estaba cargandose.
    const started = Date.now();
    const poll = () => { if (window.turnstile) return done(); if (Date.now() - started > 15000) return fail(); setTimeout(poll, 100); };
    poll();
  });
  return scriptPromise;
}

async function ensureWidget(): Promise<string> {
  if (widgetId !== null) return widgetId;
  await loadScript();
  // Another caller may have finished initialization while the script loaded.
  if (widgetId !== null) return widgetId;
  // Contenedor fijo esquina inferior derecha: el widget no ocupa layout y con
  // appearance=interaction-only solo se muestra si Cloudflare pide interaccion.
  const host = document.createElement('div');
  host.setAttribute('data-turnstile-host', '');
  host.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:9999;';
  document.body.appendChild(host);
  widgetId = window.turnstile.render(host, {
    sitekey: siteKey(),
    execution: 'execute',
    appearance: 'interaction-only',
    callback: (token:string)=>finish(token),
    'error-callback': ()=>finish(undefined,Error('La verificación anti-bots falló. Intenta otra vez.')),
    'expired-callback': ()=>finish(undefined,Error('La verificación anti-bots expiró. Intenta otra vez.')),
    'timeout-callback': ()=>finish(undefined,Error('La verificación anti-bots tardó demasiado. Intenta otra vez.')),
    'unsupported-callback': ()=>finish(undefined,Error('Este navegador no soporta la verificación anti-bots.')),
  });
  return widgetId;
}

/** Token fresco por intento; el widget se resetea despues de cada uso. */
export async function getCaptchaToken(): Promise<string | undefined> {
  if (!siteKey()) return undefined;
  const id = await ensureWidget();
  if(pending)throw Error('Ya hay una verificación en curso. Espera a que termine.');
  return new Promise<string>((resolve,reject)=>{
    const timer=setTimeout(()=>finish(undefined,Error('La verificación anti-bots tardó demasiado. Intenta otra vez.')),90000);
    pending={resolve,reject,timer};
    try{window.turnstile.execute(id);}catch(e){finish(undefined,e instanceof Error?e:Error('No se pudo verificar. Intenta otra vez.'));}
  });
}

/** Solo pruebas: reinicia el estado del modulo. */
export function __resetTurnstileForTests() { if(pending){clearTimeout(pending.timer);pending=null;} scriptPromise = null; widgetId = null; }
