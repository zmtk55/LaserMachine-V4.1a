import{it,expect}from'vitest';import{commitCartItem}from'../../utils/cartEditing';import type{OrderItem}from'../../types';
const first={id:'first',quantity:3,totalPrice:450}as OrderItem,second={id:'second',quantity:1,totalPrice:200}as OrderItem;
it('replaces only the edited item while retaining its identity and position',()=>{const original=[first,second],draft={...first,id:'new',quantity:4,totalPrice:600};expect(commitCartItem(original,draft,'first')).toEqual([{...draft,id:'first'},second]);expect(original).toEqual([first,second]);});
it('does not duplicate an edited item on repeated confirmation',()=>{const draft={...first,id:'new',quantity:4};const once=commitCartItem([first,second],draft,'first');expect(commitCartItem(once,draft,'first')).toEqual(once);});
it('adds a genuinely new item without changing existing items',()=>expect(commitCartItem([first],second)).toEqual([first,second]));
it('keeps unrelated changes made while the editor was open',()=>{const updated={...second,quantity:2};expect(commitCartItem([first,updated],{...first,quantity:4},'first')[1]).toBe(updated);});
