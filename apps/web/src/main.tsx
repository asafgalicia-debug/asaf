import {OrganizationPanel} from './OrganizationPanel';
import {RolesPanel} from './RolesPanel';
import {CompliancePanel} from './CompliancePanel';
import {RisksPanel} from './RisksPanel';
import {TicketsPanel} from './TicketsPanel';
import {AssetsPanel} from './AssetsPanel';
import {QualityPanel} from './QualityPanel';
import {MaintenancePanel} from './MaintenancePanel';
import {ShipmentsPanel} from './ShipmentsPanel';
import {OpportunitiesPanel} from './OpportunitiesPanel';
import {InvoicesPanel} from './InvoicesPanel';
import {ProductionPanel} from './ProductionPanel';
import {ProjectsPanel} from './ProjectsPanel';
import {UsersPanel} from './UsersPanel';
import {DepartmentsPanel} from './DepartmentsPanel';
import {NotificationsPanel} from './NotificationsPanel';
import {DemoCompanyPanel} from './DemoCompanyPanel';
import {EmployeePanel} from './EmployeePanel';
import {AuditPanel} from './AuditPanel';
import {InventoryAlerts} from './InventoryAlerts';
import {PeriodReport} from './PeriodReport';
import {SummaryPanel} from './SummaryPanel';
import React, { useEffect, useState, type FormEvent } from 'react';
import ReactDOM from 'react-dom/client';
import { CatalogDirectory } from './CatalogDirectory';
import { TransactionDirectory } from './TransactionDirectory';
import { TransactionCreate } from './TransactionCreate';
import { FinancePanel } from './FinancePanel';
import { StockPanel } from './StockPanel';

type SessionUser = {
  id: string;
  email: string;
  name: string;
  companyId: string;
  branchId: string;
  roleId: string;
  permissions: string[];
};

type LoginResponse = { ok?: boolean; data?: { token?: string; user?: SessionUser }; error?: { message?: string } };
type DashboardSummary = { sales: number; purchases: number; cash: number; employees: number; inventory: number };
type SaleRecord = { id: string; customerId: string; productId: string; quantity: number; total: number; status: string };
type WarehouseRecord = { id: string; name: string; code: string; status: string };
type PurchaseOrderRecord = { id: string; supplierId: string; productId: string; quantity: number; total: number; status: string };
type CustomerRecord = { id: string; name: string; taxId: string; email: string; status: string };
type Theme = { mode: 'dark' | 'light'; accent: string; font: 'modern' | 'rounded' | 'mono' };
type Page = 'dashboard' | 'sales' | 'inventory' | 'purchases' | 'customers' | 'suppliers' | 'products' | 'finance' | 'reports' | 'audit' | 'employees' | 'notifications' | 'departments' | 'users' | 'projects' | 'production' | 'invoices' | 'crm' | 'shipments' | 'maintenance' | 'quality' | 'assets' | 'tickets' | 'risks' | 'compliance' | 'roles' | 'organization';
type TenantLabels = { company?: string; branch?: string };

const themeStorageKey = 'nucleo-erp-theme-v1';
const fontStacks: Record<Theme['font'], string> = {
  modern: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  rounded: 'Aptos, "Segoe UI", ui-sans-serif, system-ui, sans-serif',
  mono: '"Cascadia Code", "SFMono-Regular", Consolas, monospace'
};
const defaultTheme: Theme = { mode: 'dark', accent: '#70e5ff', font: 'modern' };
const apiBaseUrl = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/+$/, '');
async function readList<T>(response: Response): Promise<T[]> {
  if (response.status === 401) throw new Error('Tu sesión expiró. Cierra sesión y vuelve a entrar.');
  if (response.status === 403) throw new Error('No tienes permiso para consultar este módulo.');
  const result = await response.json();
  if (!response.ok || !Array.isArray(result.data)) throw new Error(result.error?.message || 'No se pudieron cargar los registros.');
  return result.data;
}
function listError(cause: unknown): string {
  return cause instanceof TypeError ? 'No se pudo conectar con el servidor.' : cause instanceof Error ? cause.message : 'No se pudieron cargar los registros.';
}
const moduleItems: Array<{ id: Page; label: string; icon: string; detail: string }> = [
  { id: 'suppliers', label: 'Proveedores', icon: '⇄', detail: 'Directorio de proveedores' },
  { id: 'products', label: 'Productos', icon: '▦', detail: 'Catálogo de la empresa' },
  { id: 'dashboard', label: 'Centro de mando', icon: '◈', detail: 'Resumen de la operacion' },
  { id: 'sales', label: 'Ventas', icon: '↗', detail: 'Pedidos y clientes' },
  { id: 'inventory', label: 'Inventario', icon: '▦', detail: 'Existencias y almacenes' },
  { id: 'purchases', label: 'Compras', icon: '⇩', detail: 'Abastecimiento' },
  { id: 'customers', label: 'Clientes', icon: '◉', detail: 'Directorio comercial' },
  { id: 'finance', label: 'Finanzas', icon: '◇', detail: 'Cuentas y movimientos' },
  {id:'employees',label:'Empleados',icon:'◉',detail:'Personal de la sucursal'},
  {id:'organization',label:'Empresa y sucursales',icon:'◈',detail:'Administración de tu empresa'},
  {id:'roles',label:'Roles',icon:'✓',detail:'Permisos de la empresa'},
  {id:'compliance',label:'Cumplimiento',icon:'✓',detail:'Obligaciones y revisión'},
  {id:'risks',label:'Riesgos',icon:'✓',detail:'Mitigación y seguimiento'},
  {id:'tickets',label:'Soporte',icon:'✓',detail:'Tickets internos'},
  {id:'assets',label:'Activos',icon:'✓',detail:'Equipos y resultados'},
  {id:'quality',label:'Calidad',icon:'✓',detail:'Inspecciones y resultados'},
  {id:'maintenance',label:'Mantenimiento',icon:'⚙',detail:'Órdenes de trabajo'},
  {id:'shipments',label:'Logística',icon:'⇄',detail:'Envíos y entregas'},
  {id:'crm',label:'CRM',icon:'◉',detail:'Oportunidades comerciales'},
  {id:'invoices',label:'Facturación',icon:'▤',detail:'Borradores y consulta'},
  {id:'production',label:'Producción',icon:'▦',detail:'Órdenes y producto terminado'},
  {id:'projects',label:'Proyectos',icon:'▦',detail:'Planificación y avance'},
  {id:'users',label:'Usuarios',icon:'♙',detail:'Cuentas y permisos de la sucursal'},
  {id:'departments',label:'Departamentos',icon:'▦',detail:'Organización de la sucursal'},
  { id:'notifications',label:'Avisos',icon:'◉',detail:'Tu bandeja personal' },
  { id:'audit',label:'Auditoría',icon:'◷',detail:'Eventos de la sucursal' },
  { id: 'reports', label: 'Analitica', icon: '⌁', detail: 'Informes del negocio' }
];

const styles = `
  * { box-sizing: border-box; }
  :root { font-family: var(--font-ui); color-scheme: dark; }
  body { margin: 0; min-width: 320px; background: #090e13; font-family: var(--font-ui); }
  button, input, select { font: inherit; }
  button { color: inherit; }
  .app-shell { min-height: 100vh; color: var(--text); background: var(--background); font-family: var(--font-ui); --background: #0a0f14; --surface: #111820; --surface-raised: #161f28; --surface-soft: #0e151c; --line: rgba(173, 206, 224, .12); --text: #eaf6fa; --muted: #8296a4; --soft-text: #b1c3cc; --glow: color-mix(in srgb, var(--accent) 22%, transparent); }
  .app-shell[data-mode="light"] { color-scheme: light; --background: #eef4f7; --surface: #ffffff; --surface-raised: #f5f9fb; --surface-soft: #e8f0f4; --line: rgba(32, 65, 80, .13); --text: #10232d; --muted: #607986; --soft-text: #425d68; --glow: color-mix(in srgb, var(--accent) 15%, transparent); }
  .app-shell button { cursor: pointer; }
  .auth-layout { min-height: 100vh; display: grid; grid-template-columns: minmax(350px, 1.05fr) minmax(380px, .95fr); overflow: hidden; position: relative; background: radial-gradient(ellipse at 22% 10%, color-mix(in srgb, var(--accent) 11%, transparent), transparent 38%), var(--background); }
  .auth-visual { min-height: 100vh; padding: clamp(28px, 5vw, 72px); display: flex; flex-direction: column; justify-content: space-between; position: relative; border-right: 1px solid var(--line); overflow: hidden; }
  .auth-visual:before { content: ''; position: absolute; inset: 15% 5% 12%; background: repeating-linear-gradient(0deg, transparent 0 53px, var(--line) 54px), repeating-linear-gradient(90deg, transparent 0 53px, var(--line) 54px); mask-image: radial-gradient(ellipse at center, #000 0, transparent 70%); opacity: .35; pointer-events: none; }
  .brand-lockup { position: relative; z-index: 1; display: flex; align-items: center; gap: 13px; color: var(--text); text-transform: uppercase; font-size: 11px; letter-spacing: .2em; font-weight: 750; }
  .brand-emblem { width: 42px; height: 42px; border: 1px solid color-mix(in srgb, var(--accent) 55%, var(--line)); border-radius: 14px; display: grid; place-items: center; color: var(--accent); background: var(--glow); box-shadow: 0 0 24px var(--glow); font-size: 20px; }
  .auth-center { position: relative; z-index: 1; max-width: 630px; margin: 40px auto; text-align: center; }
  .auth-logo { width: min(68%, 370px); height: auto; border-radius: 28px; box-shadow: 0 24px 100px var(--glow); mix-blend-mode: screen; }
  .auth-kicker, .eyebrow { color: var(--accent); text-transform: uppercase; font-size: 10px; letter-spacing: .2em; font-weight: 750; }
  .auth-center h1 { margin: 22px 0 12px; font-size: clamp(32px, 4vw, 56px); line-height: 1.04; letter-spacing: -.05em; }
  .auth-center p { color: var(--muted); max-width: 460px; margin: auto; line-height: 1.7; }
  .auth-foot { position: relative; z-index: 1; color: var(--muted); font-size: 11px; letter-spacing: .1em; }
  .auth-panel { display: grid; place-items: center; padding: 30px; position: relative; }
  .auth-controls { position: absolute; top: 28px; right: 30px; }
  .login-card { width: min(100%, 440px); padding: clamp(26px, 4vw, 42px); border: 1px solid var(--line); border-radius: 24px; background: linear-gradient(145deg, color-mix(in srgb, var(--surface) 95%, var(--accent)), var(--surface)); box-shadow: 0 32px 100px rgba(0, 0, 0, .28); }
  .login-card h2 { margin: 8px 0 8px; font-size: 30px; letter-spacing: -.04em; }
  .login-card .intro { margin: 0 0 30px; color: var(--muted); line-height: 1.6; }
  .field { display: grid; gap: 9px; margin: 18px 0; }
  .field label { color: var(--soft-text); font-size: 12px; font-weight: 650; }
  .field input { width: 100%; min-height: 50px; padding: 0 15px; border: 1px solid var(--line); border-radius: 12px; outline: none; color: var(--text); background: var(--surface-soft); }
  .field input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--glow); }
  .primary-button { display: inline-flex; align-items: center; justify-content: center; gap: 10px; border: 1px solid color-mix(in srgb, var(--accent) 62%, transparent); border-radius: 12px; padding: 12px 17px; color: #061218 !important; background: var(--accent); font-weight: 800; box-shadow: 0 8px 26px var(--glow); transition: transform .18s ease, box-shadow .18s ease; }
  .primary-button:hover { transform: translateY(-1px); box-shadow: 0 12px 34px var(--glow); }
  .primary-button:disabled { opacity: .65; cursor: wait; }
  .login-submit { width: 100%; min-height: 52px; margin-top: 10px; }
  .error-box { margin: 16px 0; padding: 12px 14px; border: 1px solid rgba(248, 113, 113, .35); border-radius: 12px; color: #fca5a5; background: rgba(127, 29, 29, .18); font-size: 13px; line-height: 1.5; }
  .security-note { margin: 22px 0 0; color: var(--muted); font-size: 11px; line-height: 1.6; }
  .text-button, .icon-button { display: inline-grid; place-items: center; min-width: 42px; height: 42px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); color: var(--soft-text); transition: border-color .15s ease, color .15s ease; }
  .text-button:hover, .icon-button:hover { border-color: var(--accent); color: var(--accent); }
  .dashboard-layout { min-height: 100vh; display: grid; grid-template-columns: 250px minmax(0, 1fr); }
  .sidebar { min-height: 100vh; display: flex; flex-direction: column; padding: 20px 14px; border-right: 1px solid var(--line); background: color-mix(in srgb, var(--surface) 90%, transparent); }
  .sidebar-brand { display: flex; align-items: center; gap: 11px; padding: 8px 9px 24px; border-bottom: 1px solid var(--line); }
  .sidebar-brand-mark { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid color-mix(in srgb, var(--accent) 50%, var(--line)); border-radius: 13px; color: var(--accent); background: var(--glow); box-shadow: 0 0 22px var(--glow); font-weight: 900; }
  .sidebar-brand strong { display: block; font-size: 12px; letter-spacing: .11em; }
  .sidebar-brand small { display: block; margin-top: 3px; color: var(--muted); font-size: 9px; letter-spacing: .16em; }
  .tenant-card { margin: 16px 4px 20px; padding: 12px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface-soft); }
  .tenant-card span { display: block; color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: .13em; }
  .tenant-card strong { display: block; margin-top: 7px; font-size: 12px; overflow-wrap: anywhere; }
  .nav-label { padding: 0 12px; margin: 0 0 8px; color: var(--muted); font-size: 9px; text-transform: uppercase; letter-spacing: .18em; }
  .nav-list { display: grid; gap: 4px; }
  .nav-item { display: flex; align-items: center; gap: 11px; width: 100%; padding: 11px 12px; border: 1px solid transparent; border-radius: 12px; color: var(--soft-text); background: transparent; text-align: left; font-size: 12px; }
  .nav-item:hover { background: var(--surface-raised); }
  .nav-item.active { border-color: color-mix(in srgb, var(--accent) 26%, transparent); color: var(--accent); background: var(--glow); }
  .nav-icon { width: 20px; text-align: center; font-size: 17px; }
  .sidebar-bottom { display: grid; gap: 7px; margin-top: auto; padding-top: 20px; border-top: 1px solid var(--line); }
  .main-area { min-width: 0; padding: 0 clamp(18px, 3vw, 44px) 40px; }
  .topbar { min-height: 74px; display: flex; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 1px solid var(--line); }
  .breadcrumb { color: var(--muted); font-size: 11px; }
  .breadcrumb strong { color: var(--text); font-weight: 650; }
  .top-actions { display: flex; align-items: center; gap: 9px; }
  .status-chip { display: flex; align-items: center; gap: 7px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 999px; color: var(--soft-text); font-size: 10px; }
  .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #62e7b1; box-shadow: 0 0 12px #62e7b1; }
  .user-chip { display: flex; align-items: center; gap: 9px; padding-left: 8px; }
  .user-avatar { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line)); border-radius: 12px; color: var(--accent); background: var(--glow); font-size: 12px; font-weight: 800; }
  .user-copy strong, .user-copy small { display: block; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .user-copy strong { font-size: 11px; }
  .user-copy small { margin-top: 3px; color: var(--muted); font-size: 9px; }
  .page-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin: 34px 0 24px; }
  .page-heading h1 { margin: 9px 0 7px; font-size: clamp(27px, 3vw, 38px); letter-spacing: -.045em; }
  .page-heading p { margin: 0; color: var(--muted); font-size: 12px; }
  .date-chip { padding: 9px 12px; border: 1px solid var(--line); border-radius: 10px; color: var(--soft-text); background: var(--surface); font-size: 10px; white-space: nowrap; }
  .welcome-banner { min-height: 156px; display: flex; align-items: center; justify-content: space-between; gap: 24px; position: relative; overflow: hidden; padding: 25px 30px; border: 1px solid color-mix(in srgb, var(--accent) 25%, var(--line)); border-radius: 20px; background: radial-gradient(ellipse at 80% 5%, var(--glow), transparent 44%), linear-gradient(110deg, var(--surface), color-mix(in srgb, var(--surface) 85%, var(--accent))); }
  .welcome-banner:after { content: ''; position: absolute; right: 11%; top: -90px; width: 245px; height: 245px; border: 1px solid color-mix(in srgb, var(--accent) 24%, transparent); border-radius: 50%; box-shadow: 0 0 0 24px color-mix(in srgb, var(--accent) 4%, transparent), 0 0 0 49px color-mix(in srgb, var(--accent) 3%, transparent); }
  .welcome-content { position: relative; z-index: 1; }
  .welcome-content h2 { margin: 10px 0 7px; font-size: clamp(20px, 2.5vw, 28px); letter-spacing: -.035em; }
  .welcome-content p { max-width: 560px; margin: 0; color: var(--muted); font-size: 12px; line-height: 1.6; }
  .banner-mark { position: relative; z-index: 1; display: grid; place-items: center; width: 84px; height: 84px; margin-right: 28px; border: 1px solid color-mix(in srgb, var(--accent) 60%, transparent); border-radius: 26px; color: var(--accent); background: color-mix(in srgb, var(--accent) 9%, var(--surface)); box-shadow: 0 0 55px var(--glow); font-size: 36px; }
  .section-heading { display: flex; justify-content: space-between; align-items: center; margin: 27px 0 13px; }
  .section-heading h2 { margin: 0; font-size: 14px; letter-spacing: -.02em; }
  .section-heading span { color: var(--muted); font-size: 10px; }
  .metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
  .metric-card { min-height: 120px; padding: 16px; border: 1px solid var(--line); border-radius: 16px; background: linear-gradient(145deg, var(--surface-raised), var(--surface)); }
  .metric-top { display: flex; justify-content: space-between; align-items: center; color: var(--muted); font-size: 10px; }
  .metric-symbol { display: grid; place-items: center; width: 28px; height: 28px; border: 1px solid var(--line); border-radius: 9px; color: var(--accent); background: var(--glow); font-size: 13px; }
  .metric-value { margin-top: 12px; font-size: 24px; font-weight: 720; letter-spacing: -.04em; }
  .metric-caption { margin-top: 5px; color: var(--muted); font-size: 9px; }
  .content-grid { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(230px, .8fr); gap: 13px; margin-top: 13px; }
  .panel { min-width: 0; padding: 18px; border: 1px solid var(--line); border-radius: 16px; background: var(--surface); }
  .panel-title { display: flex; justify-content: space-between; gap: 14px; align-items: center; margin-bottom: 14px; }
  .panel-title h3 { margin: 0; font-size: 12px; }
  .panel-title span { color: var(--muted); font-size: 9px; }
  .empty-analytics { min-height: 167px; display: grid; place-items: center; text-align: center; border: 1px dashed var(--line); border-radius: 12px; background: repeating-linear-gradient(0deg, transparent 0 39px, var(--line) 40px), repeating-linear-gradient(90deg, transparent 0 59px, var(--line) 60px); }
  .empty-analytics div { max-width: 300px; padding: 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
  .empty-analytics strong { display: block; margin-bottom: 5px; font-size: 11px; }
  .empty-analytics span { color: var(--muted); font-size: 9px; line-height: 1.5; }
  .data-list { display: grid; gap: 8px; }
  .data-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
  .data-row strong { font-size: 11px; }
  .data-row small { display: block; margin-top: 4px; color: var(--muted); font-size: 9px; }
  .check-list { display: grid; gap: 10px; }
  .check-row { display: flex; align-items: center; gap: 10px; padding: 11px 10px; border: 1px solid var(--line); border-radius: 11px; background: var(--surface-soft); }
  .check-icon { display: grid; place-items: center; width: 25px; height: 25px; border-radius: 8px; color: #62e7b1; background: rgba(98, 231, 177, .1); font-size: 12px; }
  .check-row strong { display: block; font-size: 10px; }
  .check-row small { display: block; margin-top: 4px; color: var(--muted); font-size: 9px; }
  .module-placeholder { min-height: 280px; display: grid; place-items: center; padding: 26px; border: 1px dashed var(--line); border-radius: 18px; text-align: center; background: radial-gradient(ellipse at 50% 20%, var(--glow), transparent 52%), var(--surface); }
  .module-placeholder-mark { width: 70px; height: 70px; display: grid; place-items: center; margin: auto auto 17px; border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--line)); border-radius: 23px; color: var(--accent); background: var(--glow); font-size: 28px; }
  .module-placeholder h2 { margin: 0 0 7px; font-size: 19px; }
  .module-placeholder p { max-width: 420px; margin: 0; color: var(--muted); font-size: 11px; line-height: 1.7; }
  .module-placeholder .status-chip { display: inline-flex; margin-top: 17px; }
  .drawer-backdrop { position: fixed; z-index: 20; inset: 0; background: rgba(0, 0, 0, .52); backdrop-filter: blur(4px); }
  .theme-drawer { position: fixed; z-index: 21; top: 0; right: 0; width: min(390px, 100vw); height: 100vh; overflow: auto; padding: 24px; border-left: 1px solid var(--line); background: var(--surface); box-shadow: -25px 0 90px rgba(0, 0, 0, .3); }
  .drawer-head { display: flex; align-items: start; justify-content: space-between; margin-bottom: 25px; }
  .drawer-head h2 { margin: 6px 0 4px; font-size: 20px; }
  .drawer-head p { margin: 0; color: var(--muted); font-size: 10px; }
  .setting-group { padding: 17px 0; border-top: 1px solid var(--line); }
  .setting-group h3 { margin: 0 0 6px; font-size: 11px; }
  .setting-group p { margin: 0 0 13px; color: var(--muted); font-size: 10px; line-height: 1.55; }
  .option-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .option-button { min-height: 37px; padding: 8px 11px; border: 1px solid var(--line); border-radius: 10px; color: var(--soft-text); background: var(--surface-soft); font-size: 10px; }
  .option-button.selected { border-color: var(--accent); color: var(--accent); box-shadow: 0 0 0 2px var(--glow); }
  .swatches { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .swatch { width: 34px; height: 34px; border: 2px solid transparent; border-radius: 12px; box-shadow: 0 0 18px color-mix(in srgb, var(--swatch) 25%, transparent); background: var(--swatch); }
  .swatch.selected { outline: 2px solid var(--text); outline-offset: 3px; }
  .color-input-wrap { display: flex; align-items: center; gap: 10px; margin-top: 14px; color: var(--muted); font-size: 10px; }
  .color-input-wrap input { width: 38px; height: 34px; padding: 0; overflow: hidden; border: 1px solid var(--line); border-radius: 9px; background: transparent; }
  .font-select { width: 100%; min-height: 42px; padding: 0 12px; border: 1px solid var(--line); border-radius: 10px; color: var(--text); background: var(--surface-soft); }
  .preview-card { margin-top: 7px; padding: 15px; border: 1px solid var(--line); border-radius: 13px; background: var(--surface-soft); }
  .preview-card strong { display: block; color: var(--accent); font-size: 12px; }
  .preview-card span { display: block; margin-top: 5px; color: var(--muted); font-size: 10px; }
  .drawer-note { padding: 12px; border: 1px solid var(--line); border-radius: 11px; color: var(--muted); background: var(--surface-soft); font-size: 9px; line-height: 1.6; }
  .mobile-menu { display: none; }
  @media (max-width: 980px) { .dashboard-layout { grid-template-columns: 210px minmax(0, 1fr); } .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .content-grid { grid-template-columns: 1fr; } }
  @media (max-width: 720px) { .auth-layout { grid-template-columns: 1fr; } .auth-visual { min-height: 310px; min-height: 36vh; padding: 22px; border-right: 0; border-bottom: 1px solid var(--line); } .auth-center { margin: 24px auto 10px; } .auth-logo { width: 150px; } .auth-center h1 { margin: 12px 0 7px; font-size: 27px; } .auth-center p { font-size: 11px; } .auth-foot { display: none; } .auth-panel { padding: 28px 18px; } .auth-controls { top: 12px; right: 14px; } .dashboard-layout { display: block; } .sidebar { position: fixed; z-index: 15; top: 0; bottom: 0; left: 0; width: min(280px, 84vw); min-height: 100dvh; transform: translateX(-105%); transition: transform .2s ease; box-shadow: 15px 0 50px rgba(0, 0, 0, .3); } .sidebar.open { transform: translateX(0); } .mobile-menu { display: inline-grid; } .main-area { padding: 0 16px 30px; } .topbar { min-height: 64px; } .status-chip { display: none; } .user-copy { display: none; } .page-heading { align-items: start; flex-direction: column; margin-top: 25px; } .welcome-banner { padding: 20px; } .banner-mark { width: 55px; height: 55px; margin-right: 0; border-radius: 18px; font-size: 24px; } .metric-card { min-height: 110px; padding: 13px; } .metric-value { font-size: 20px; } }
  @media (prefers-reduced-motion: reduce) { *, *:before, *:after { scroll-behavior: auto !important; transition-duration: .01ms !important; } }
`;

function loadTheme(): Theme {
  try {
    const value = JSON.parse(localStorage.getItem(themeStorageKey) || 'null') as Partial<Theme> | null;
    if (value && (value.mode === 'dark' || value.mode === 'light') && typeof value.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.accent) && (value.font === 'modern' || value.font === 'rounded' || value.font === 'mono')) {
      return { mode: value.mode, accent: value.accent, font: value.font };
    }
  } catch { /* Use the default visual profile. */ }
  return defaultTheme;
}

function App() {
  const [demoVisible,setDemoVisible]=useState(false);
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [session, setSession] = useState<{ token: string; user: SessionUser } | null>(null);
  const [page, setPage] = useState<Page>('dashboard');
  const [tenantLabels, setTenantLabels] = useState<TenantLabels>({});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [moduleError, setModuleError] = useState('');
  const [transactionRevision, setTransactionRevision] = useState(0);

  useEffect(() => {
    localStorage.setItem(themeStorageKey, JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    if (!session) { setTenantLabels({}); return; }
    const controller = new AbortController();
    const headers = { Authorization: 'Bearer ' + session.token };
    void Promise.all([
      fetch(`${apiBaseUrl}/companies`, { headers, signal: controller.signal }).then((response) => response.ok ? response.json() : null),
      fetch(`${apiBaseUrl}/branches`, { headers, signal: controller.signal }).then((response) => response.ok ? response.json() : null)
    ]).then(([companyResult, branchResult]) => {
      const company = companyResult?.data?.[0];
      const branch = Array.isArray(branchResult?.data) ? branchResult.data.find((item: { id?: string }) => item.id === session.user.branchId) : undefined;
      setTenantLabels({ company: company?.name, branch: branch?.name });
    }).catch(() => undefined);
    return () => controller.abort();
  }, [session]);



  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json() as LoginResponse;
      if (!response.ok || !result.data?.token || !result.data.user) {
        throw new Error(result.error?.message || 'No se pudo iniciar sesi\u00f3n. Revisa tus datos.');
      }
      setSession({ token: result.data.token, user: result.data.user });
      setPassword('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeModule = moduleItems.find((item) => item.id === page) ?? moduleItems[0];
  const themeStyle = { '--accent': theme.accent, '--font-ui': fontStacks[theme.font] } as React.CSSProperties;

  return (
    <div className="app-shell" data-mode={theme.mode} style={themeStyle}>
      <style>{styles}</style>
      {demoVisible ? <DemoCompanyPanel onClose={()=>setDemoVisible(false)}/> : !session ? (
        <main className="auth-layout">
          <section className="auth-visual">
            <div className="brand-lockup"><span className="brand-emblem">N</span><span>{'NUCLEO ERP SOFTWARE'}</span></div>
            <div className="auth-center">
              <img className="auth-logo" src="/brand/nucleo-erp-logo.png" alt={'N\u00daCLEO ERP Software'} />
              <div className="auth-kicker">Plataforma de gestion modular</div>
              <h1>Tu operacion, en una nueva dimension.</h1>
              <p>Un espacio de trabajo conectado para las decisiones y operaciones de tu empresa.</p>
            </div>
            <div className="auth-foot">ACCESO PROTEGIDO <span aria-hidden="true"> / </span> API ERP · 2026.10.06</div>
          </section>
          <section className="auth-panel">
            <div className="auth-controls"><button className="icon-button" type="button" aria-label="Ajustes visuales" title="Ajustes visuales" onClick={() => setSettingsOpen(true)}>◉</button></div>
            <div className="login-card">
              <div className="eyebrow">Acceso seguro</div>
              <h2>Bienvenido de nuevo</h2>
              <p className="intro">Inicia sesion con tu cuenta del ERP para entrar a tu espacio de trabajo.</p>
              <form onSubmit={handleLogin}>
                <div className="field"><label htmlFor="email">Correo electronico</label><input id="email" name="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} /></div>
                <div className="field"><label htmlFor="password">Contrasena</label><input id="password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={72} /></div>
                {error && <div className="error-box" role="alert">{error}</div>}
                <button className="primary-button login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Validando acceso...' : 'Entrar al ERP'} <span aria-hidden="true">→</span></button>
              </form>
              <button type="button" onClick={()=>setDemoVisible(true)}>Abrir empresa de demostración · 2,000 productos</button>
              <p className="security-note">La sesion se mantiene en memoria durante esta visita. Tus credenciales se validan con la API y no se guardan en este navegador.</p>
            </div>
          </section>
        </main>
      ) : (
        <div className="dashboard-layout">
          <aside className={'sidebar' + (mobileNavOpen ? ' open' : '')}>
            <div className="sidebar-brand"><span className="sidebar-brand-mark">N</span><span><strong>{'N\u00daCLEO ERP'}</strong><small>SOFTWARE PLATFORM</small></span></div>
            <div className="tenant-card"><span>Espacio activo</span><strong>{tenantLabels.company || session.user.companyId}</strong><strong>{tenantLabels.branch || session.user.branchId}</strong></div>
            <div className="nav-label">Workspace</div>
            <nav className="nav-list" aria-label="Modulos principales">
              {moduleItems.filter(item=>(item.id!=='shipments'||session.user.permissions.includes('logistica.ver'))&&(item.id!=='crm'||session.user.permissions.includes('crm.ver'))&&(item.id!=='production'||session.user.permissions.includes('produccion.ver'))&&(item.id!=='projects'||session.user.permissions.includes('proyectos.ver'))&&(!['departments','users','invoices','maintenance','quality','assets','tickets','risks','compliance','roles','organization'].includes(item.id)||session.user.permissions.includes('usuarios.ver'))&&(item.id!=='notifications'||session.user.permissions.includes('notificaciones.ver'))&&(item.id!=='audit'||session.user.permissions.includes('auditoria.ver'))&&(item.id!=='employees'||session.user.permissions.includes('rrhh.ver'))).map((item) => <button key={item.id} type="button" className={'nav-item' + (page === item.id ? ' active' : '')} onClick={() => { setPage(item.id); setMobileNavOpen(false); }}><span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span></button>)}
            </nav>
            <div className="sidebar-bottom"><button type="button" className="nav-item" onClick={()=>setDemoVisible(true)}>Empresa de demostración · 2,000 productos</button>
              <button className="nav-item" type="button" onClick={() => setSettingsOpen(true)}><span className="nav-icon" aria-hidden="true">⚙</span><span>Ajustes visuales</span></button>
              <button className="nav-item" type="button" onClick={() => { setSession(null); setPage('dashboard'); }}><span className="nav-icon" aria-hidden="true">↪</span><span>Cerrar sesion</span></button>
            </div>
          </aside>
          <main className="main-area">
            <header className="topbar">
              <div className="top-actions"><button className="icon-button mobile-menu" type="button" aria-label="Abrir menu" onClick={() => setMobileNavOpen((open) => !open)}>☰</button><div className="breadcrumb">NUCLEO <span aria-hidden="true">/</span> <strong>{activeModule.label}</strong></div></div>
              <div className="top-actions"><div className="status-chip"><span className="status-dot" /> Sesion autenticada</div><button className="icon-button" type="button" aria-label="Abrir ajustes visuales" onClick={() => setSettingsOpen(true)}>⚙</button><div className="user-chip"><span className="user-avatar">{session.user.name.slice(0, 1).toUpperCase()}</span><span className="user-copy"><strong>{session.user.name}</strong><small>{session.user.email}</small></span></div></div>
            </header>
            <div className="page-heading"><div><div className="eyebrow">{activeModule.detail}</div><h1>{activeModule.label}</h1><p>Vista de trabajo de Nucleo ERP Software.</p></div><div className="date-chip">TENANT ACTIVO <span aria-hidden="true">·</span> {session.user.companyId}</div></div>
            {(page === 'sales' || page === 'purchases') && session.user.permissions.includes('usuarios.editar') && <TransactionCreate key={page + session.user.id} kind={page === 'sales' ? 'sales' : 'purchase-orders'} apiUrl={apiBaseUrl} token={session.token} onCreated={() => setTransactionRevision((value) => value + 1)} />}
            {page === 'inventory' && <StockPanel key={session.user.id} apiUrl={apiBaseUrl} token={session.token} canCreate={session.user.permissions.includes('usuarios.editar')} onWarehouseCreated={() => setTransactionRevision((value) => value + 1)} />}
            {page === 'inventory' && <InventoryAlerts base={apiBaseUrl} token={session.token} companyId={session.user.companyId} canConfigure={session.user.permissions.includes('configuracion.ver')} canEdit={session.user.permissions.includes('usuarios.editar')}/>}
            {page === 'customers' || page === 'suppliers' || page === 'products' ? (
              <CatalogDirectory companyId={session.user.companyId} branchId={session.user.branchId} key={page + session.user.id} kind={page} apiUrl={apiBaseUrl} token={session.token} canCreate={session.user.permissions.includes('usuarios.editar')} />
            ) : page === 'sales' || page === 'purchases' ? (
              <TransactionDirectory key={page+session.user.id} apiUrl={apiBaseUrl} token={session.token} kind={page==='sales'?'sales':'purchase-orders'} canEdit={session.user.permissions.includes('usuarios.editar')} externalRevision={transactionRevision} companyId={session.user.companyId} branchId={session.user.branchId}/>
            ) : page === 'finance' ? (
              <FinancePanel key={session.user.id} apiUrl={apiBaseUrl} token={session.token} canCreate={session.user.permissions.includes('usuarios.editar')}/>
            ) : moduleError && ['sales', 'purchases', 'inventory'].includes(page) ? (
              <section className="panel"><p className="error-box" role="alert">{moduleError}</p></section>
            ) : page === 'dashboard' || page === 'reports' ? (
              <>{page==='reports'&&<PeriodReport apiUrl={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId}/>}<SummaryPanel key={page+session.user.id} apiUrl={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} report={page==='reports'}/></>
            ) : page === 'employees' ? session.user.permissions.includes('rrhh.ver') ? <EmployeePanel canEdit={session.user.permissions.includes('rrhh.editar')} key={session.token} canManageDepartments={session.user.permissions.includes('usuarios.editar')} canCreate={session.user.permissions.includes('rrhh.crear')} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId}/> : <p>No tienes permiso para consultar empleados.</p> : page === 'organization' ? session.user.permissions.includes('usuarios.ver') ? <OrganizationPanel key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} canManage={session.user.permissions.includes('usuarios.editar')}/> : <p>No tienes permiso para consultar la empresa.</p> : page === 'roles' ? session.user.permissions.includes('usuarios.ver') ? <RolesPanel key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} permissions={session.user.permissions} canManage={session.user.permissions.includes('usuarios.editar')}/> : <p>No tienes permiso para consultar roles.</p> : page === 'compliance' ? session.user.permissions.includes('usuarios.ver') ? <CompliancePanel key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} canManage={session.user.permissions.includes('usuarios.editar')}/> : <p>No tienes permiso para consultar cumplimiento.</p> : page === 'risks' ? session.user.permissions.includes('usuarios.ver') ? <RisksPanel key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} canManage={session.user.permissions.includes('usuarios.editar')}/> : <p>No tienes permiso para consultar riesgos.</p> : page === 'tickets' ? session.user.permissions.includes('usuarios.ver') ? <TicketsPanel key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} canManage={session.user.permissions.includes('usuarios.editar')}/> : <p>No tienes permiso para consultar soporte.</p> : page === 'assets' ? session.user.permissions.includes('usuarios.ver') ? <AssetsPanel key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} canManage={session.user.permissions.includes('usuarios.editar')}/> : <p>No tienes permiso para consultar activos.</p> : page === 'quality' ? session.user.permissions.includes('usuarios.ver') ? <QualityPanel canManage={session.user.permissions.includes('usuarios.editar')} key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId}/> : <p>No tienes permiso para Calidad.</p> : page === 'maintenance' ? session.user.permissions.includes('usuarios.ver') ? <MaintenancePanel canManage={session.user.permissions.includes('usuarios.editar')} key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId}/> : <p>No tienes permiso para Mantenimiento.</p> : page === 'shipments' ? session.user.permissions.includes('logistica.ver') ? <ShipmentsPanel canCreate={session.user.permissions.includes('logistica.crear')} canEdit={session.user.permissions.includes('logistica.editar')} key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId}/> : <p>No tienes permiso para Logística.</p> : page === 'crm' ? session.user.permissions.includes('crm.ver') ? <OpportunitiesPanel canCreate={session.user.permissions.includes('crm.crear')} canEdit={session.user.permissions.includes('crm.editar')} key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId}/> : <p>No tienes permiso para CRM.</p> : page === 'invoices' ? session.user.permissions.includes('usuarios.ver') ? <InvoicesPanel canManage={session.user.permissions.includes('usuarios.editar')} key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId}/> : <p>No tienes permiso para consultar Facturación.</p> : page === 'production' ? session.user.permissions.includes('produccion.ver') ? <ProductionPanel key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} canManage={session.user.permissions.includes('usuarios.editar')&&session.user.permissions.includes('usuarios.ver')}/> : <p>No tienes permiso para consultar producción.</p> : page === 'projects' ? session.user.permissions.includes('proyectos.ver') ? <ProjectsPanel key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} canCreate={session.user.permissions.includes('proyectos.crear')} canEdit={session.user.permissions.includes('proyectos.editar')}/> : <p>No tienes permiso para consultar proyectos.</p> : page === 'users' ? session.user.permissions.includes('usuarios.ver') ? <UsersPanel currentEmail={session.user.email} canEdit={session.user.permissions.includes('usuarios.editar')} permissions={session.user.permissions} canCreate={session.user.permissions.includes('usuarios.crear')} key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId}/> : <p>No tienes permiso para consultar usuarios.</p> : page === 'departments' ? session.user.permissions.includes('usuarios.ver') ? <DepartmentsPanel key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} canEdit={session.user.permissions.includes('usuarios.editar')}/> : <p>No tienes permiso para consultar departamentos.</p> : page === 'notifications' ? session.user.permissions.includes('notificaciones.ver') ? <NotificationsPanel key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} userId={session.user.id}/> : <p>No tienes permiso para consultar avisos.</p> : page === 'audit' ? session.user.permissions.includes('auditoria.ver') ? <AuditPanel base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId}/> : <p>No tienes permiso para consultar auditoría.</p> : page === 'inventory' ? null : (
              <section className="module-placeholder"><div><div className="module-placeholder-mark">{activeModule.icon}</div><h2>{activeModule.label}</h2><p>{activeModule.detail}. Esta pantalla es parte de la interfaz objetivo; conectaremos aqui los endpoints y datos reales del modulo en las siguientes etapas.</p><span className="status-chip"><span className="status-dot" /> Interfaz preparada para integracion</span></div></section>
            )}
          </main>
        </div>
      )}
      {settingsOpen && <><button className="drawer-backdrop" aria-label="Cerrar ajustes" onClick={() => setSettingsOpen(false)} /><aside className="theme-drawer" aria-label="Ajustes visuales"><div className="drawer-head"><div><div className="eyebrow">Personalizacion</div><h2>Ajustes visuales</h2><p>Elige como se ve tu espacio de trabajo.</p></div><button className="icon-button" type="button" aria-label="Cerrar" onClick={() => setSettingsOpen(false)}>×</button></div><div className="setting-group"><h3>Apariencia</h3><p>Selecciona el modo que mejor se adapte a tu entorno.</p><div className="option-row"><button className={'option-button' + (theme.mode === 'dark' ? ' selected' : '')} type="button" onClick={() => setTheme((value) => ({ ...value, mode: 'dark' }))}>Oscuro</button><button className={'option-button' + (theme.mode === 'light' ? ' selected' : '')} type="button" onClick={() => setTheme((value) => ({ ...value, mode: 'light' }))}>Claro</button></div></div><div className="setting-group"><h3>Color de acento</h3><p>El color se aplica a acciones, resaltados y estados activos.</p><div className="swatches">{['#70e5ff', '#a78bfa', '#5ee0b5', '#ffc66d', '#ff7e9f'].map((color) => <button key={color} className={'swatch' + (theme.accent.toLowerCase() === color ? ' selected' : '')} style={{ '--swatch': color } as React.CSSProperties} aria-label={'Seleccionar color ' + color} title={color} type="button" onClick={() => setTheme((value) => ({ ...value, accent: color }))} />)}</div><label className="color-input-wrap">Color personalizado<input type="color" value={theme.accent} onChange={(event) => setTheme((value) => ({ ...value, accent: event.target.value }))} /></label></div><div className="setting-group"><h3>Tipografia</h3><p>La preferencia se guarda en este navegador.</p><select className="font-select" value={theme.font} onChange={(event) => setTheme((value) => ({ ...value, font: event.target.value as Theme['font'] }))}><option value="modern">Moderna · sans serif</option><option value="rounded">Neutra · interfaz</option><option value="mono">Tecnica · monoespaciada</option></select><div className="preview-card"><strong>Vista previa del sistema</strong><span>La operacion de tu empresa, en un solo lugar.</span></div></div><div className="drawer-note">Estas preferencias se guardan localmente en este navegador. Mas adelante podremos sincronizarlas con el perfil del usuario.</div></aside></>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);