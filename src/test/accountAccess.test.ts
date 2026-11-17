import {describe,it,expect,vi,afterEach} from 'vitest';
const api=vi.hoisted(()=>({signUp:vi.fn(),resetPasswordForEmail:vi.fn(),exchangeCodeForSession:vi.fn(),getSession:vi.fn(),updateUser:vi.fn()}));vi.mock('../../services/supabaseClient',()=>({supabase:{auth:api}}));
import {registerAccount,requestRecovery,exchangeAccountCode,changeRecoveredPassword} from '../../services/accountAccess';
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
it('does not send any email without explicitly configured callback',async()=>{vi.stubEnv('VITE_AUTH_CALLBACK_URL','');await expect(registerAccount('x@example.test','longpassword123','Name')).rejects.toThrow('pendientes');await expect(requestRecovery('x@example.test')).rejects.toThrow('pendientes');expect(api.signUp).not.toHaveBeenCalled();expect(api.resetPasswordForEmail).not.toHaveBeenCalled();});
it('rejects redirect outside current origin before sending',async()=>{vi.stubEnv('VITE_AUTH_CALLBACK_URL','https://outside.invalid');await expect(requestRecovery('x@example.test')).rejects.toThrow('no verificada');expect(api.resetPasswordForEmail).not.toHaveBeenCalled();});
it('uses explicit same-origin PKCE callback without granting role metadata',async()=>{vi.stubEnv('VITE_AUTH_CALLBACK_URL',window.location.origin+'/account');api.signUp.mockResolvedValue({});await registerAccount('x@example.test','longpassword123','Name');expect(api.signUp).toHaveBeenCalledWith({email:'x@example.test',password:'longpassword123',options:{emailRedirectTo:window.location.origin+'/account',data:{name:'Name'}}});});
it('does not change password without authenticated recovery session',async()=>{api.getSession.mockResolvedValue({data:{session:null}});await expect(changeRecoveredPassword('longpassword123')).rejects.toThrow('enlace');expect(api.updateUser).not.toHaveBeenCalled();});
it('no code means no session exchange',async()=>{expect(await exchangeAccountCode()).toBe(false);expect(api.exchangeCodeForSession).not.toHaveBeenCalled();});

describe('email link completion',()=>{
 afterEach(()=>{window.history.replaceState({},'','/');});
 it('classifies recovery links from server redirectType and cleans the URL',async()=>{
  vi.stubEnv('VITE_AUTH_CALLBACK_URL',window.location.origin+'/');
  window.history.replaceState({},'','/?code=pkce-code-1');
  api.exchangeCodeForSession.mockResolvedValue({data:{redirectType:'recovery',session:{access_token:'x'}},error:null});
  await expect(exchangeAccountCode()).resolves.toBe('recovery');
  expect(api.exchangeCodeForSession).toHaveBeenCalledWith('pkce-code-1');
  expect(window.location.search).toBe('');
 });
 it('classifies any non-recovery code as signed-in, never claims confirmation',async()=>{
  vi.stubEnv('VITE_AUTH_CALLBACK_URL',window.location.origin+'/');
  for(const redirectType of ['signup','magiclink',null]){
   window.history.replaceState({},'','/?code=pkce-code-2');
   api.exchangeCodeForSession.mockResolvedValue({data:{redirectType,session:{access_token:'x'}},error:null});
   await expect(exchangeAccountCode()).resolves.toBe('signed-in');
   expect(window.location.search).toBe('');
  }
 });
 it('failed exchange surfaces honest error and cleans the URL',async()=>{
  vi.stubEnv('VITE_AUTH_CALLBACK_URL',window.location.origin+'/');
  window.history.replaceState({},'','/?code=used-code');
  api.exchangeCodeForSession.mockResolvedValue({data:{},error:new Error('invalid')});
  await expect(exchangeAccountCode()).rejects.toThrow('expiró');
  expect(window.location.search).toBe('');
 });
 it('reads provider error params instead of attempting exchange',async()=>{
  const {readAccountLinkError}=await import('../../services/accountAccess');
  window.history.replaceState({},'','/?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
  const msg=readAccountLinkError();
  expect(msg).toContain('expiró');
  expect(msg).toContain('Email link is invalid or has expired');
  expect(window.location.search).toBe('');
  expect(api.exchangeCodeForSession).not.toHaveBeenCalled();
 });
 it('no error params means no link error',async()=>{
  const {readAccountLinkError}=await import('../../services/accountAccess');
  window.history.replaceState({},'','/');
  expect(readAccountLinkError()).toBeNull();
 });
});
