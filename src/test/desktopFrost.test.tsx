import React from 'react';
import {render,screen,cleanup,fireEvent} from '@testing-library/react';
import {it,expect,vi,afterEach} from 'vitest';
import {DesktopFrostBackground} from '../../components/DesktopFrostBackground';
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
const media=(matches:boolean)=>vi.stubGlobal('matchMedia',()=>({matches,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
it('mounts no background or controls on mobile',()=>{media(false);render(<DesktopFrostBackground/>);expect(document.querySelector('.lm-frost-landscape')).toBeNull();expect(screen.queryByRole('button')).toBeNull()});
it('cycles ten backgrounds with one icon, never a gallery or thumbnails',()=>{media(true);const onChange=vi.fn();render(<DesktopFrostBackground onChange={onChange}/>);expect(screen.getAllByRole('button')).toHaveLength(1);expect(document.querySelector('img')).toBeNull();const button=screen.getByRole('button',{name:'Cambiar fondo de paisaje'});for(let i=0;i<10;i++){fireEvent.click(button);expect(onChange).toHaveBeenLastCalledWith(i);expect(document.querySelector('.lm-frost-landscape')?.getAttribute('style')).toContain('/'+String(i+1).padStart(2,'0')+'.webp');expect(document.querySelector('.lm-frost-thumbnails')).toBeNull()}expect(button).not.toHaveAttribute('aria-expanded')});
it('uses the externally selected index without storing the image in an order',()=>{media(true);const onChange=vi.fn();render(<DesktopFrostBackground index={4} onChange={onChange}/>);fireEvent.click(screen.getByRole('button'));expect(onChange).toHaveBeenCalledWith(5)});
