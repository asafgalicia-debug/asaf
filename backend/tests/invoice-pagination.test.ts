import {expect,it} from 'vitest';
import {parseInvoicePage} from '../src/modules/facturacion/invoiceService.js';
it('invoice pages reject scope overrides and unbounded queries',()=>{expect(parseInvoicePage({})).toEqual({search:'',limit:20});for(const raw of [{companyId:'foreign'},{limit:51},{cursor:'bad'},{status:'UNKNOWN'}])expect(()=>parseInvoicePage(raw)).toThrow();});
