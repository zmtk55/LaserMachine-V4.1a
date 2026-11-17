import {describe,it,expect,vi,beforeEach} from 'vitest';
import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
const api=vi.hoisted(()=>({changeRecoveredPassword:vi.fn()}));
vi.mock('../../services/accountAccess',()=>({
 changeRecoveredPassword:api.changeRecoveredPassword,
 registerAccount:vi.fn(),requestRecovery:vi.fn(),exchangeAccountCode:vi.fn(),readAccountLinkError:vi.fn(),
}));
import {AuthModal} from '../../components/AuthModal';

describe('reset-password view',()=>{
 beforeEach(()=>{vi.clearAllMocks();});
 const open=()=>render(<AuthModal isOpen={true} onClose={()=>{}} onLogin={()=>{}} initialView="reset-password"/>);

 it('renders the new-password form with 12-char minimum',()=>{
  open();
  expect(screen.getByText('Define tu nueva contraseña')).toBeTruthy();
  const inputs=document.querySelectorAll('input[type=password]');
  expect(inputs.length).toBe(2);
  expect(inputs[0].getAttribute('minlength')).toBe('12');
 });
 it('blocks mismatched passwords without calling the service',async()=>{
  open();
  const [p1,p2]=document.querySelectorAll('input[type=password]');
  fireEvent.change(p1,{target:{value:'longpassword123'}});
  fireEvent.change(p2,{target:{value:'longpassword999'}});
  fireEvent.submit(document.querySelector('form')!);
  expect(await screen.findByText('Las contraseñas no coinciden')).toBeTruthy();
  expect(api.changeRecoveredPassword).not.toHaveBeenCalled();
 });
 it('surfaces updateUser failure honestly',async()=>{
  api.changeRecoveredPassword.mockRejectedValue(new Error('No se pudo cambiar la contraseña'));
  open();
  const [p1,p2]=document.querySelectorAll('input[type=password]');
  fireEvent.change(p1,{target:{value:'longpassword123'}});
  fireEvent.change(p2,{target:{value:'longpassword123'}});
  fireEvent.submit(document.querySelector('form')!);
  expect(await screen.findByText('No se pudo cambiar la contraseña')).toBeTruthy();
 });
 it('success shows confirmation and route to login',async()=>{
  api.changeRecoveredPassword.mockResolvedValue(undefined);
  open();
  const [p1,p2]=document.querySelectorAll('input[type=password]');
  fireEvent.change(p1,{target:{value:'longpassword123'}});
  fireEvent.change(p2,{target:{value:'longpassword123'}});
  fireEvent.submit(document.querySelector('form')!);
  await waitFor(()=>expect(screen.getByText(/Contraseña actualizada/)).toBeTruthy());
  expect(screen.getByText('Ir a iniciar sesión')).toBeTruthy();
  expect(api.changeRecoveredPassword).toHaveBeenCalledWith('longpassword123');
 });
});
