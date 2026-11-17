// @vitest-environment node
import {describe,it,expect} from 'vitest';import {readFileSync} from 'node:fs';
const read=(p:string)=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const tokens=read('src/styles/design-tokens.css'),ui=read('src/styles/interface.css'),tailwind=read('tailwind.config.js'),legacy=read('index.css');
describe('interface token contract',()=>{
 it('does not invert neutral primitives in dark mode',()=>{const dark=tokens.split('html.dark {')[1].split('}')[0];expect(dark).not.toMatch(/--color-neutral-\d+:/);expect(dark).toContain('--lm-text: var(--color-neutral-50)');});
 it('keeps single UI font and separated display and engraving fonts',()=>{expect(tokens).toContain("--lm-font-ui: 'Inter'");expect(tokens).toContain("--lm-font-display: 'Plus Jakarta Sans'");expect(legacy).toContain(".font-script1 { font-family: 'Permanent Marker'");expect(legacy).toContain(".font-industrial { font-family: 'Anton'");});
 it('maps accent utility variants including opacity to canonical channels',()=>{expect(tailwind).toContain('yellow: Object.fromEntries');expect(tailwind).toContain('amber: Object.fromEntries');expect(tailwind).toContain('/ <alpha-value>');});
 it('uses one root declaration per token',()=>{const root=tokens.slice(tokens.indexOf(':root {'),tokens.indexOf('html.dark'));const names=[...root.matchAll(/(--[\w-]+):/g)].map(m=>m[1]);expect(new Set(names).size).toBe(names.length);});
 it('does not globally replace engraving text or SVG fonts',()=>{expect(ui).not.toMatch(/\.lm-ui\s+\*\s*\{[^}]*font-family/);expect(ui).not.toMatch(/\bsvg\b[^}]*font-family/);});
 it('keeps motion preference and keyboard focus visible',()=>{expect(ui).toContain('focus-visible');expect(ui).toContain('--lm-focus');expect(ui).toContain('prefers-reduced-motion');});
});

const luminance=(hex:string)=>{const c=hex.replace('#','').match(/../g)!.map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const contrast=(a:string,b:string)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
describe('canonical text contrast',()=>{
 it('keeps normal primary and secondary text readable on light and dark surfaces',()=>{for(const [a,b] of [['#18181b','#ffffff'],['#52525b','#ffffff'],['#fafafa','#18181b'],['#a1a1aa','#18181b']])expect(contrast(a,b)).toBeGreaterThanOrEqual(4.5);});
 it('keeps yellow filled-action text and light-surface accent text readable',()=>{expect(contrast('#09090b','#facc15')).toBeGreaterThanOrEqual(4.5);expect(contrast('#854d0e','#ffffff')).toBeGreaterThanOrEqual(4.5);});
});
