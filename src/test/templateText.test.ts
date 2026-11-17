import {describe,it,expect} from 'vitest';
import {editableTemplateText,TEMPLATE_TEXT_COLORS} from '../../utils/templateText';
describe('template simple editor',()=>{
 it('has a string palette rather than an undeclared runtime name',()=>{expect(TEMPLATE_TEXT_COLORS.length).toBeGreaterThan(0);expect(TEMPLATE_TEXT_COLORS.every(c=>/^#[0-9A-F]{6}$/.test(c))).toBe(true);});
 it('preserves zero positions, rotation, stable ID and unknown fields',()=>{const t={id:'original',content:'Test',xPosition:0,yPosition:0,rotation:37,size:0,custom:{preserve:true}};expect(editableTemplateText(t,0)).toEqual(expect.objectContaining(t));});
 it('supports legacy string texts',()=>{expect(editableTemplateText('Legacy',1)).toEqual(expect.objectContaining({id:'text-1',content:'Legacy',yPosition:55}));});
});
