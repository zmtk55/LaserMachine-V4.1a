import {describe,it,expect,vi} from 'vitest';
import React from 'react';
import {render} from '@testing-library/react';
vi.mock('../../contexts/CartContext',()=>({useCartPanel:()=>({setIsCartOpen:()=>{}})}));
vi.mock('../../contexts/NotificationContext',()=>({useNotifications:()=>({unreadCount:0,setIsPanelOpen:()=>{}})}));
import {NavBar} from '../../components/NavBar';
import {UserRole} from '../../types';

const base={cartCount:0,onNavigate:()=>{},onLogin:()=>{},onLogout:()=>{},isDarkMode:true,toggleTheme:()=>{},storeConfig:{} as any,currentView:'LANDING' as any,adminActiveTab:undefined as any};

describe('NavBar avatar fallback',()=>{
 it('sin avatarUrl muestra inicial local, no una imagen rota',()=>{
  const user={id:'u1',email:'qa@example.test',name:'Prueba QA',role:UserRole.CLIENT,laserPoints:0,pointsHistory:[]} as any;
  const {container}=render(<NavBar {...base} user={user}/>);
  const imgs=[...container.querySelectorAll('img')].filter(i=>!i.getAttribute('src'));
  expect(imgs.length).toBe(0);
  expect(container.querySelector('[aria-label="Avatar de Prueba QA"]')?.textContent).toBe('P');
 });
 it('con avatarUrl muestra la imagen',()=>{
  const user={id:'u1',email:'qa@example.test',name:'Prueba QA',role:UserRole.CLIENT,laserPoints:0,pointsHistory:[],avatarUrl:'https://example.test/a.png'} as any;
  const {container}=render(<NavBar {...base} user={user}/>);
  const img=container.querySelector('img[alt="Avatar de Prueba QA"]');
  expect(img?.getAttribute('src')).toBe('https://example.test/a.png');
 });
});
