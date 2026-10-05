import {beforeEach,describe,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({find:vi.fn(),findOne:vi.fn(),exec:vi.fn()}));
vi.mock('mongoose',async original=>{const actual=await original<any>();return {...actual,default:{...actual.default,models:{...actual.default.models,ModuleConfig:{find:state.find,findOne:state.findOne}}}};});
import {getModuleConfig,listModuleConfigs,inventoryConfigInput} from '../src/modules/configuracion/configService.js';
beforeEach(()=>{state.exec.mockReset();state.find.mockReset().mockReturnValue({sort:()=>({lean:()=>({exec:state.exec})})});state.findOne.mockReset().mockReturnValue({lean:()=>({exec:state.exec})});});
describe('persistent company module configuration',()=>{
 it('lists only persisted configuration scoped by company, with no demo fallback',async()=>{state.exec.mockResolvedValue([]);expect(await listModuleConfigs('company')).toEqual([]);expect(state.find).toHaveBeenCalledWith({companyId:'company'});});
 it('returns scoped configuration and normalizes its timestamp',async()=>{state.exec.mockResolvedValue({companyId:'company',module:'sales',enabled:false,config:{},updatedAt:new Date('2026-10-04T00:00:00Z')});expect(await getModuleConfig('company','sales')).toMatchObject({enabled:false,updatedAt:'2026-10-04T00:00:00.000Z'});expect(state.findOne).toHaveBeenCalledWith({companyId:'company',module:'sales'});});
 it('missing configuration does not expose another company or invent defaults',async()=>{state.exec.mockResolvedValue(null);await expect(getModuleConfig('foreign','sales')).rejects.toMatchObject({statusCode:404});expect(state.findOne).toHaveBeenCalledWith({companyId:'foreign',module:'sales'});});
 it('invalid module identifiers never query storage',async()=>{for(const module of ['', ' sales ','$where','a'.repeat(81)])await expect(getModuleConfig('company',module)).rejects.toMatchObject({statusCode:400});expect(state.findOne).not.toHaveBeenCalled();});
});

it('inventory preferences reject unknown fields and invalid precision',()=>{for(const input of [{expectedVersion:null,stockAlertThreshold:-1},{expectedVersion:0,stockAlertThreshold:1.5},{expectedVersion:0,stockAlertThreshold:1000001},{expectedVersion:0,stockAlertThreshold:10,enabled:false},{stockAlertThreshold:10}])expect(inventoryConfigInput.safeParse(input).success).toBe(false);});
