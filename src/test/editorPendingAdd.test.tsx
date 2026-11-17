import React from 'react';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {it,expect,vi,afterEach,beforeEach} from 'vitest';
import {SimpleOrderModal} from '../../components/SimpleOrderModal';
import {ProductVisualizer} from '../../components/ProductVisualizer';
import {checkFontFile} from '../../utils/fontProvenance';
vi.mock('../../utils/fontProvenance',async importOriginal=>({...await importOriginal<any>(),checkFontFile:vi.fn()}));
vi.mock('../../services/designHistory',()=>({listDesigns:vi.fn().mockResolvedValue([]),saveDesign:vi.fn(),restoreDesign:vi.fn(),deleteDesign:vi.fn()}));
class RO{observe(){}unobserve(){}disconnect(){}}(globalThis as any).ResizeObserver=RO;
const product={id:'p',name:'Producto',price:350,engravingIncluded:true,colors:[{id:'black',name:'NEGRO',stock:5}]};
const fonts=[{id:15,name:'Archivo prueba',cssFamily:'font-test',bundled:true,fileData:'data:font/ttf;base64,AA=='}];
const pricing={baseEngravingPrice:100,extraSidePrice:50,logoSurcharge:50};
let resolve:()=>void;
let pending:{resolve:()=>void;reject:()=>void}[];
beforeEach(()=>{pending=[];vi.stubGlobal('alert',vi.fn());vi.mocked(checkFontFile).mockImplementation(()=>new Promise<boolean>((r,j)=>{resolve=()=>r(true);pending.push({resolve,reject:()=>j(Error('font failed'))});}));});
afterEach(()=>{cleanup();vi.clearAllMocks();vi.unstubAllGlobals();});
function setup(kind:'simple'|'detailed'){
 const save=vi.fn();const props:any={product,fonts,pricing,storeConfig:{},onClose:vi.fn(),onChangeFont:vi.fn(),onOpenFullEditor:vi.fn(),fontId:15,text:'ANA',onAddToCart:save,availableColors:[],galleryAssets:[],onBack:vi.fn(),onSwitchProduct:vi.fn(),onGoToCart:vi.fn(),onSave:save,isDarkMode:true,initialState:{frontText:'ANA',frontFontId:15}};
 const node=(p=props)=>kind==='simple'?<SimpleOrderModal {...p}/>:<ProductVisualizer {...p}/>;
 const view=render(node());
 if(kind==='simple')fireEvent.click(screen.getByRole('button',{name:'Compro el termo'}));
 const click=()=>{if(kind==='simple')fireEvent.click(screen.getByRole('button',{name:/Agregar al pedido/}));else{fireEvent.click(screen.getByRole('button',{name:'Revisar diseño'}));fireEvent.click(document.querySelector('.lm-review-submit')!);}};
 return{save,props,node,view,click};
}
for(const kind of ['simple','detailed'] as const){
 it(`${kind}: adds unchanged visible inputs once after font verification`,async()=>{const t=setup(kind);t.click();expect(t.save).not.toHaveBeenCalled();await act(async()=>resolve());expect(t.save).toHaveBeenCalledOnce();expect(t.save.mock.calls[0][0]).toMatchObject(kind==='simple'?{productId:'p',frontText:'ANA',quantity:1,unitPrice:350,totalPrice:350}:{productId:'p',frontText:'ANA',quantity:1,priceTotal:350});});
 it(`${kind}: only the latest repeated add may commit`,async()=>{const t=setup(kind);t.click();t.click();await act(async()=>pending[0].resolve());expect(t.save).not.toHaveBeenCalled();await act(async()=>pending[1].resolve());expect(t.save).toHaveBeenCalledOnce();});
 it(`${kind}: discards obsolete callback after parent session replaces it`,async()=>{const t=setup(kind);t.click();const replacement=vi.fn();t.view.rerender(t.node({...t.props,...(kind==='simple'?{onAddToCart:replacement}:{onSave:replacement})}));await act(async()=>resolve());expect(t.save).not.toHaveBeenCalled();expect(replacement).not.toHaveBeenCalled();});
 it(`${kind}: does not report obsolete font error after unmount`,async()=>{const t=setup(kind);t.click();t.view.unmount();await act(async()=>pending[0].reject());expect(t.save).not.toHaveBeenCalled();expect(alert).not.toHaveBeenCalled();});
 it(`${kind}: reports current font error and does not add`,async()=>{const t=setup(kind);t.click();await act(async()=>pending[0].reject());expect(t.save).not.toHaveBeenCalled();if(kind==='simple')expect(alert).toHaveBeenCalledOnce();else expect(screen.getByText(/La tipografía no pudo cargarse/)).toBeTruthy();});
 it(`${kind}: discards pending add after stock changes`,async()=>{const t=setup(kind);t.click();t.view.rerender(t.node({...t.props,product:{...product,colors:[{...product.colors[0],stock:0}]}}));await act(async()=>resolve());expect(t.save).not.toHaveBeenCalled();});
 it(`${kind}: discards pending add after catalogue price changes`,async()=>{const t=setup(kind);t.click();expect(checkFontFile).toHaveBeenCalledOnce();t.view.rerender(t.node({...t.props,product:{...product,price:400}}));await act(async()=>resolve());expect(t.save).not.toHaveBeenCalled();});
 it(`${kind}: discards pending add after route unmounts`,async()=>{const t=setup(kind);t.click();t.view.unmount();await act(async()=>resolve());expect(t.save).not.toHaveBeenCalled();});
 it(`${kind}: discards pending add after quantity changes`,async()=>{const t=setup(kind);t.click();fireEvent.click(screen.getByRole('button',{name:kind==='simple'?'+':'Aumentar cantidad de termos'}));await act(async()=>resolve());expect(t.save).not.toHaveBeenCalled();});
}
