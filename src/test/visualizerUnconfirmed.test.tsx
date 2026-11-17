import { render, screen, cleanup,fireEvent,waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ProductVisualizer } from '../../components/ProductVisualizer';

class RO { observe(){} unobserve(){} disconnect(){} }
(globalThis as any).ResizeObserver = (globalThis as any).ResizeObserver || RO;

const base = { id: 'termo-generico-20oz', name: 'Termo 20oz con grabado', brand: 'GENÉRICO', category: 'Termos', price: 350, stockThreshold: 5, imageUrl: '/x.svg', engravingIncluded: true, illustrativeImage: true };
const sinColores = { ...base, colors: [] } as any;
const agotadoReal = { ...base, id: 'yeti-1', colors: [{ id: 'negro', name: 'NEGRO', hex: '#18181b', stock: 0, imageUrl: '/y.svg' }] } as any;

const props = {
  fonts: [{ id: 999, name: 'Google Sans Flex', cssFamily: 'font-google', category: 'BASICAS' } as any],
  pricing: { baseEngravingPrice: 100, extraSidePrice: 50, logoSurcharge: 50 } as any,
  availableColors: [], galleryAssets: [],
  onBack: vi.fn(), onSave: vi.fn(), onGoToCart: vi.fn(), onSwitchProduct: vi.fn(),
  isDarkMode: true, storeConfig: {} as any,
};

vi.mock('../../services/designHistory',()=>({listDesigns:vi.fn().mockRejectedValue(Error('Inicia sesión')),saveDesign:vi.fn().mockRejectedValue(Error('Inicia sesión')),restoreDesign:vi.fn(),deleteDesign:vi.fn()}));
afterEach(cleanup);

describe('personalizador con inventario sin confirmar', () => {
  it('colors=[] muestra disponibilidad por confirmar, nunca AGOTADO, y no permite agregar', () => {
    render(<ProductVisualizer product={sinColores} {...props} />);
    expect(screen.getByText('POR CONFIRMAR')).toBeTruthy();
    expect(screen.getByText('Stock por confirmar')).toBeTruthy();
    const btn=screen.getByRole('button',{name:'Revisar diseño en escritorio'}) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);fireEvent.click(btn);expect(document.querySelector('.lm-review-submit')).toBeNull();expect(props.onSave).not.toHaveBeenCalled();
    expect(screen.queryByText('AGOTADO')).toBeNull();
    expect(screen.queryByText('Agotado')).toBeNull();
  });
  it('restores the side color menu, separates review and retains unconfirmed stock',()=>{
    render(<ProductVisualizer product={sinColores} {...props}/>);
    fireEvent.click(screen.getByRole('button',{name:'Color BLANCO'}));
    expect(screen.getByRole('button',{name:'Color BLANCO'}).getAttribute('aria-pressed')).toBe('true');
    expect((screen.getByRole('button',{name:'Revisar diseño en escritorio'}) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole('button',{name:'Revisar diseño'}));
    expect(screen.getByText('Cantidad de termos')).toBeTruthy();
    expect(screen.getByText('BLANCO · solicitado')).toBeTruthy();
    expect(screen.getByText('Incluye nombre al frente. Un logo o monograma al reverso +$50. Texto al reverso y otras combinaciones: a cotizar.')).toBeTruthy();
    fireEvent.click(screen.getByText('Llevo mi propio producto').closest('button')!);
    expect(screen.getByText('Tu producto para grabar')).toBeTruthy();
    expect(screen.getByText('Nombre al frente $100. El total cambia según el diseño; no incluye comprar un termo.')).toBeTruthy();
  });
  it('color confirmado en 0 sigue mostrando AGOTADO', () => {
    render(<ProductVisualizer product={agotadoReal} {...props} />);
    expect(screen.getByText('AGOTADO')).toBeTruthy();
    expect(screen.queryByText('POR CONFIRMAR')).toBeNull();
  });
  it('save icon does not silently add a cart item or claim success without a saved draft',async()=>{
    const onSave=vi.fn();render(<ProductVisualizer product={sinColores} {...props} onSave={onSave}/>);
    fireEvent.click(screen.getByRole('button',{name:'Guardar borrador'}));
    await waitFor(()=>expect(screen.getByText('No se guardó el borrador. Inicia sesión')).toBeTruthy());
    expect(onSave).not.toHaveBeenCalled();expect(screen.queryByText('Borrador guardado en tu historial privado.')).toBeNull();
  });
});

it('snaps loaded angles and settings to horizontal/vertical only',()=>{
 render(<ProductVisualizer product={sinColores} {...props} initialState={{frontText:'ANA',frontDesignState:{x:50,y:40,scale:1,rotate:13}} as any}/>);
 const element=screen.getByRole('button',{name:'Texto1 del diseño'});
 expect(element.style.transform).toContain('rotate(0deg)');
 fireEvent.keyDown(element,{key:' '});
 fireEvent.click(screen.getByRole('button',{name:'Más herramientas'}));
 fireEvent.click(screen.getByRole('button',{name:'Ajustes del diseño'}));
 const rotation=screen.getByRole('slider',{name:'Rotación del elemento'});
 expect(rotation.getAttribute('step')).toBe('90');
 fireEvent.change(rotation,{target:{value:'90'}});expect(element.style.transform).toContain('rotate(90deg)');
 fireEvent.change(rotation,{target:{value:'13'}});expect(element.style.transform).toContain('rotate(0deg)');
});
it('preserves legacy text as a draft but blocks production without its real font file',()=>{const onSave=vi.fn();render(<ProductVisualizer product={sinColores} {...props} onSave={onSave} initialState={{isClientItem:true,frontText:'ANA',frontFontId:999}as any}/>);fireEvent.click(screen.getByRole('button',{name:'Revisar diseño'}));expect(screen.getByText(/Tipografía de referencia, sin archivo/)).toBeTruthy();expect(screen.getByRole('button',{name:'Tipografía pendiente'}).hasAttribute('disabled')).toBe(true);expect(screen.getByRole('button',{name:'Guardar diseño revisado'})).toBeTruthy();expect(onSave).not.toHaveBeenCalled();});

for(const action of ['Volver al catálogo','Ver carrito'])it(`passes the complete unsaved draft on ${action} without a remote save`,()=>{const onBack=vi.fn(),onGoToCart=vi.fn();const initial={id:'existing-cart',frontText:'ANA',frontFontId:999,frontDesignState:{x:42,y:31,scale:.7,rotate:90},backText:'B',backFontId:999,backDesignState:{x:59,y:65,scale:.5,rotate:-180},quantity:3,isClientItem:true,clientItemBrand:'OTRO',clientItemColor:'Azul'};render(<ProductVisualizer product={sinColores} {...props} onBack={onBack} onGoToCart={onGoToCart} initialState={initial as any}/>);fireEvent.click(screen.getByRole('button',{name:action}));const callback=action==='Ver carrito'?onGoToCart:onBack;expect(callback).toHaveBeenCalledOnce();expect(callback.mock.calls[0][0]).toMatchObject({...initial,productId:sinColores.id});});

it('keeps all nine editor tools reachable with a labelled secondary disclosure',()=>{
 render(<ProductVisualizer product={sinColores} {...props}/>);
 for(const name of ['Texto 1','Texto 2','Imágenes','Plantillas'])expect(screen.getByRole('button',{name})).toBeTruthy();
 const more=screen.getByRole('button',{name:'Más herramientas'});expect(more.getAttribute('aria-expanded')).toBe('false');
 fireEvent.click(more);expect(more.getAttribute('aria-expanded')).toBe('true');
 const secondary=document.querySelectorAll('.lm-more-actions>button');expect(secondary.length).toBe(5);
 for(const name of ['Foto de producto propio','Monogramas y emblemas','Editar imagen','Eliminar elemento seleccionado','Ajustes del diseño'])expect(document.querySelector(`.lm-more-actions>button[aria-label="${name}"]`)).toBeTruthy();
 expect(screen.getByRole('button',{name:'Editar imagen'}).hasAttribute('disabled')).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Ajustes del diseño'}));expect(screen.queryByRole('region',{name:'Más herramientas'})).toBeNull();
 expect(screen.getByRole('dialog',{name:'Editar diseño'})).toBeTruthy();
});
