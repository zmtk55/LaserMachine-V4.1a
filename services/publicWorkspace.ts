import {supabase} from './supabaseClient';
export const EMPTY_CONTENT={banners:[],promotions:[],testimonials:[],faqs:[],featuredProducts:[]};
/** All sources are explicit server projections, never private base tables. */
export async function loadPublicWorkspace(signedIn:boolean){
 if(!supabase)throw Error('Supabase no está configurado');
 const list=async(table:string)=>{const result:any[]=[];for(let from=0;;from+=500){const {data,error}=await supabase.from(table).select('data').order('id').range(from,from+499);if(error)throw error;result.push(...(data??[]).map(r=>r.data));if((data??[]).length<500)return result;if(from>100000)throw Error('Carga incompleta');}};
 const [products,fonts,store,pricing,content,orders]=await Promise.all([list('lm_catalog'),list('lm_font_catalog'),list('lm_storefront'),list('lm_public_pricing'),list('lm_public_content'),signedIn?list('lm_my_orders'):Promise.resolve([])]);
 return {products:products.map(p=>({...p,availabilityOnly:true})),fonts,store:store[0],pricing:pricing[0],content:{...EMPTY_CONTENT,...content[0]},orders};
}
