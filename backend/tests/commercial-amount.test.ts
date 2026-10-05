import { expect, it } from 'vitest';
import { commercialTotal } from '../src/core/commercialAmount.js';
it('calculates fractional quantities and rounds the total to cents',()=>{
 expect(commercialTotal(5,129.99)).toBe(649.95);expect(commercialTotal(0.5,10.01)).toBe(5.01);expect(commercialTotal(2,0.1)).toBe(0.2);expect(commercialTotal(1,0)).toBe(0);
});
it('rejects invalid quantities, prices and overflow before persistence',()=>{
 for(const [quantity,price] of [[0,1],[-1,1],[0.0000001,1],[NaN,1],[Infinity,1],[1,NaN],[1,Infinity],[1,-1],[1e100,1e100],[1,Number.MAX_SAFE_INTEGER]])expect(()=>commercialTotal(quantity,price)).toThrow();
});
