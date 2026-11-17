import React,{useState}from'react';
import{render,screen,fireEvent,cleanup}from'@testing-library/react';
import{it,expect,vi,afterEach}from'vitest';
import{ProductVisualizer}from'../../components/ProductVisualizer';
class RO{observe(){}unobserve(){}disconnect(){}};(globalThis as any).ResizeObserver=RO;
vi.mock('../../services/designHistory',()=>({listDesigns:vi.fn().mockResolvedValue([]),saveDesign:vi.fn(),restoreDesign:vi.fn(),deleteDesign:vi.fn()}));
afterEach(cleanup);
// Isolated fixtures only. These products never touch a server or production catalogue.
const one={id:'fixture-one',name:'Fixture one',price:350,illustrativeImage:true,imageUrl:'/one.svg',colors:[]},two={...one,id:'fixture-two',name:'Fixture two'};
const original={productId:one.id,colorName:'ROJO',frontText:'FRENTE UNO',backText:'REVERSO UNO',frontFontId:999,backFontId:999,frontDesignState:{x:40,y:30,scale:.8,rotate:90},backDesignState:{x:61,y:62,scale:.6,rotate:-180},quantity:3};
it('passes a full draft and restores the matching product without crossing designs or background into orders',()=>{
 const reported=vi.fn();
 function Fixture(){const[p,setP]=useState(one),[drafts,setDrafts]=useState<any>({[one.id]:original});return <ProductVisualizer key={p.id} product={p as any} products={[one,two]as any} initialState={drafts[p.id]} historyEnabled={false} fonts={[{id:999,name:'Fixture',cssFamily:'sans-serif'}]as any} availableColors={[]} galleryAssets={[]} pricing={{baseEngravingPrice:100,extraSidePrice:50}as any} storeConfig={{}as any} isDarkMode onSave={()=>{}} onBack={()=>{}} onGoToCart={()=>{}} onSwitchProduct={(next,draft)=>{reported(next,draft);if(draft)setDrafts((prev:any)=>({...prev,[draft.productId]:draft}));setP(next as any)}}/>}
 render(<Fixture/>);fireEvent.click(screen.getByRole('button',{name:'Producto siguiente'}));expect(reported.mock.calls[0][1]).toMatchObject(original);expect(reported.mock.calls[0][1]).not.toHaveProperty('desktopBackground');expect(screen.queryByRole('button',{name:'Texto1 del diseño'})).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Producto anterior'}));expect(screen.getByRole('button',{name:'Texto1 del diseño'}).textContent).toContain('FRENTE UNO');expect(screen.getByRole('button',{name:'Color ROJO'})).toHaveAttribute('aria-pressed','true');fireEvent.click(screen.getByRole('button',{name:'Posterior'}));expect(screen.getByRole('button',{name:'Texto1 del diseño'}).textContent).toContain('REVERSO UNO');fireEvent.click(screen.getByRole('button',{name:'Producto siguiente'}));expect(reported.mock.calls.at(-1)[1]).toMatchObject(original);
});
