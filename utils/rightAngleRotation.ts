import type {DesignState} from '../types';
/** Only horizontal/vertical orientations, including upside-down. */
export function rightAngleRotation(value:number=0){
 if(!Number.isFinite(value))return 0;
 const angle=((Math.round(value/90)*90+180)%360+360)%360-180;
 return Object.is(angle,-0)?0:angle;
}
export function rightAngleDesign<T extends DesignState>(state:T):T{return {...state,rotate:rightAngleRotation(state.rotate)};}
export function rightAngleLogos<T extends {state:DesignState}>(items:T[]):T[]{return items.map(item=>({...item,state:rightAngleDesign(item.state)}));}
