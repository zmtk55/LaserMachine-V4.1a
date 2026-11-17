import {it,expect,vi,afterEach} from 'vitest';
import {getCaptchaToken,__resetTurnstileForTests} from '../../services/turnstile';

const auth=vi.hoisted(()=>({signInWithPassword:vi.fn(),getSession:vi.fn(()=>Promise.resolve({data:{session:null}})),onAuthStateChange:vi.fn(()=>({data:{subscription:{unsubscribe:vi.fn()}}}))}));
vi.mock('../../services/supabaseClient',()=>({supabase:{auth,rpc:vi.fn(()=>Promise.resolve({data:false,error:null})),from:vi.fn(()=>({select:vi.fn(()=>Promise.resolve({data:[],error:null}))}))}}));
import {loginWithEmail} from '../../services/supabaseAuth';

function mockTurnstile(behavior:'ok'|'error'='ok'){
  const calls:{resets:number,executes:number}={resets:0,executes:0};
  let callbacks:any;
  window.turnstile={
    render:vi.fn((_host,opts)=>{callbacks=opts;return 'w1';}),
    execute:vi.fn(()=>{calls.executes++;if(behavior==='ok')callbacks.callback('tok-fresco-1');else callbacks['error-callback']();}),
    reset:vi.fn(()=>{calls.resets++;}),
  };
  return calls;
}

afterEach(()=>{vi.useRealTimers();vi.unstubAllEnvs();vi.clearAllMocks();__resetTurnstileForTests();delete window.turnstile;document.querySelectorAll('[data-turnstile-host]').forEach(n=>n.remove());});

it('sin site key el captcha queda desactivado y no carga script ni widget',async()=>{
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY','');
  await expect(getCaptchaToken()).resolves.toBeUndefined();
  expect(document.querySelectorAll('script[src*="turnstile"]').length).toBe(0);
  expect(document.querySelectorAll('[data-turnstile-host]').length).toBe(0);
});

it('con site key genera token fresco y resetea el widget tras cada intento',async()=>{
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY','0x_test_sitekey');
  const calls=mockTurnstile('ok');
  await expect(getCaptchaToken()).resolves.toBe('tok-fresco-1');
  await expect(getCaptchaToken()).resolves.toBe('tok-fresco-1');
  expect(calls.executes).toBe(2);
  expect(calls.resets).toBe(2);
  expect(window.turnstile.render).toHaveBeenCalledTimes(1);
});

it('fallo del widget rechaza con mensaje claro y resetea',async()=>{
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY','0x_test_sitekey');
  const calls=mockTurnstile('error');
  await expect(getCaptchaToken()).rejects.toThrow('anti-bots');
  expect(calls.resets).toBe(1);
});

it('login envia captchaToken al flujo de contrasena',async()=>{
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY','0x_test_sitekey');
  mockTurnstile('ok');
  auth.signInWithPassword.mockResolvedValue({data:{user:{id:'u1',email:'x@example.test'}},error:null});
  await loginWithEmail('x@example.test','password-larga-123');
  expect(auth.signInWithPassword).toHaveBeenCalledWith({email:'x@example.test',password:'password-larga-123',options:{captchaToken:'tok-fresco-1'}});
});

it('silencio del proveedor termina la espera sin enviar credenciales ni quitar proteccion',async()=>{
 vi.useFakeTimers();vi.stubEnv('VITE_TURNSTILE_SITE_KEY','qa');
 window.turnstile={render:vi.fn(()=> 'silent'),execute:vi.fn(),reset:vi.fn()};
 const attempt=getCaptchaToken();const result=expect(attempt).rejects.toThrow('tardó demasiado');
 await vi.advanceTimersByTimeAsync(90001);await result;expect(window.turnstile.reset).toHaveBeenCalledTimes(1);
});
it('rechaza solicitud simultanea sin reutilizar el mismo token',async()=>{
 vi.useFakeTimers();vi.stubEnv('VITE_TURNSTILE_SITE_KEY','qa');
 window.turnstile={render:vi.fn(()=> 'silent'),execute:vi.fn(),reset:vi.fn()};
 const first=getCaptchaToken();const firstCheck=expect(first).rejects.toThrow('tardó demasiado');const second=getCaptchaToken();const secondCheck=expect(second).rejects.toThrow('en curso');await Promise.resolve();await Promise.resolve();await secondCheck;expect(window.turnstile.render).toHaveBeenCalledTimes(1);
await vi.advanceTimersByTimeAsync(90001);await firstCheck;
});
