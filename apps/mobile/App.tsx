import {OrganizationPanel} from './src/OrganizationPanel';
import {RolesPanel} from './src/RolesPanel';
import {CompliancePanel} from './src/CompliancePanel';
import {RisksPanel} from './src/RisksPanel';
import {TicketsPanel} from './src/TicketsPanel';
import {AssetsPanel} from './src/AssetsPanel';
import {QualityPanel} from './src/QualityPanel';
import {MaintenancePanel} from './src/MaintenancePanel';
import {ShipmentsPanel} from './src/ShipmentsPanel';
import {OpportunitiesPanel} from './src/OpportunitiesPanel';
import {InvoicesPanel} from './src/InvoicesPanel';
import {ProductionPanel} from './src/ProductionPanel';
import {ProjectsPanel} from './src/ProjectsPanel';
import {UsersPanel} from './src/UsersPanel';
import {DepartmentsPanel} from './src/DepartmentsPanel';
import {NotificationsPanel} from './src/NotificationsPanel';
import {EmployeePanel} from './src/EmployeePanel';
import {AuditPanel} from './src/AuditPanel';
import {InventoryAlerts} from './src/InventoryAlerts';
import {PeriodReportPanel} from './src/PeriodReportPanel';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TransactionPanel } from './src/TransactionPanel';
import { ProfilePanel } from './src/ProfilePanel';
import { FinancePanel } from './src/FinancePanel';
import { loginRequest, type Session, type CatalogKind } from './src/api';
import { CatalogPanel } from './src/CatalogPanel';
import { InventoryPanel } from './src/InventoryPanel';
import { DashboardPanel } from './src/DashboardPanel';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

declare const process: { env: Record<string, string | undefined> };

const palettes = [
  { name: 'Cian', value: '#59D6FF' },
  { name: 'Violeta', value: '#A78BFA' },
  { name: 'Esmeralda', value: '#4ADE80' },
  { name: 'Ámbar', value: '#FBBF24' }
];

const typefaces = [
  { name: 'Moderna', value: 'sans-serif' },
  { name: 'Clásica', value: 'serif' },
  { name: 'Técnica', value: 'monospace' }
];

const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace(/\/+$/, '');
const apiHealthUrl = apiBaseUrl.endsWith('/api/v1') ? `${apiBaseUrl.slice(0, -7)}/health/live` : `${apiBaseUrl}/health/live`;

const modules = [
  { icon: '↗', name: 'Ventas', detail: 'Pedidos y clientes' },
  { icon: '◈', name: 'Inventario', detail: 'Productos y stock' },
  { icon: '⇄', name: 'Compras', detail: 'Proveedores y órdenes' },
  { icon: '◎', name: 'Finanzas', detail: 'Cuentas y reportes' }
];

function App() {
  const scroll = useRef<ScrollView>(null);
  const [panelY, setPanelY] = useState(0);
  const [accent, setAccent] = useState(palettes[0].value);
  const [fontFamily, setFontFamily] = useState(typefaces[0].value);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Inicio');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [healthRevision, setHealthRevision] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [catalog, setCatalog] = useState<CatalogKind | 'stock' | 'sales' | 'purchase-orders' | 'finance' | 'employees' | 'departments' | 'users' | 'projects' | 'production' | 'invoices' | 'crm' | 'shipments' | 'maintenance' | 'quality' | 'assets' | 'tickets' | 'risks' | 'compliance' | 'roles' | 'organization' | null>(null);
  const openCatalog = (value: typeof catalog) => { setCatalog(value); setActiveTab('Inicio'); requestAnimationFrame(() => scroll.current?.scrollTo({ y: Math.max(0, panelY - 28), animated: true })); };
  const onExpired = useCallback(() => { setSession(null); setCatalog(null); setActiveTab('Inicio'); setLoginError('Tu sesión venció. Inicia sesión de nuevo.'); scroll.current?.scrollTo({ y: 0, animated: true }); }, []);

  useEffect(() => {
    const controller = new AbortController();
    setApiStatus('checking');
    const timer = setTimeout(() => controller.abort(), 75000);
    fetch(apiHealthUrl, { signal: controller.signal })
      .then((response) => setApiStatus(response.ok ? 'online' : 'offline'))
      .catch(() => setApiStatus('offline'));
    return () => { clearTimeout(timer); controller.abort(); };
  }, [healthRevision]);

  const login = async () => {
    setLoginError('');
    setLoggingIn(true);
    try {
      setSession(await loginRequest(apiBaseUrl, email, password));
      setPassword('');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoggingIn(false);
    }
  };


  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView ref={scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <Image source={require('./src/assets/nucleo-erp-logo.png')} style={styles.logo} resizeMode="contain" />
            <View>
              <Text style={[styles.brandName, { fontFamily }]}>NÚCLEO</Text>
              <Text style={styles.brandCaption}>ERP SOFTWARE</Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Personalizar interfaz" onPress={() => setSettingsVisible(true)} style={styles.settingsButton}>
            <Text style={[styles.settingsGlyph, { color: accent }]}>⚙</Text>
          </Pressable>
        </View>

        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.overline}>ESPACIO DE TRABAJO</Text>
            <Text style={[styles.heading, { fontFamily }]}>Vista general</Text>
          </View>
          <View style={styles.previewBadge}><View style={[styles.statusDot, { backgroundColor: accent }]} /><Text style={styles.previewText}>VISTA PREVIA</Text></View>
        </View>

        <View style={[styles.systemCard, { borderColor: `${accent}55` }]}>
          <View style={styles.systemCardTop}>
            <View style={[styles.systemIconWrap, { backgroundColor: `${accent}18` }]}><Text style={[styles.systemIcon, { color: accent }]}>⌘</Text></View>
            <View style={styles.systemStatus}><View style={[styles.statusDot, { backgroundColor: apiStatus === 'online' ? '#4ADE80' : apiStatus === 'offline' ? '#F87171' : '#FBBF24' }]} /><Text style={styles.systemStatusText}>{apiStatus === 'online' ? 'API conectada' : apiStatus === 'offline' ? 'API no disponible' : 'Comprobando API...'}</Text></View>
          </View>
          <Text style={[styles.systemTitle, { fontFamily }]}>Tu operación, en un solo lugar</Text>
          <Text style={styles.systemDescription}>{session ? 'Consulta abajo los indicadores registrados en tu empresa y sucursal. Los módulos móviles siguen en vista previa.' : 'Inicia sesión para consultar los indicadores reales de tu empresa.'}</Text>
          <View style={styles.divider} />
          <View style={styles.systemFooter}><Text style={styles.systemFooterLabel}>ESTADO DEL SISTEMA</Text><Text style={[styles.systemFooterValue, { color: accent }]}>{apiStatus === 'online' ? 'API CONECTADA' : 'INTERFAZ LISTA'}</Text></View>
          {apiStatus === 'offline' ? <Pressable accessibilityRole="button" onPress={() => setHealthRevision((value) => value + 1)}><Text style={{ color: accent, paddingTop: 12 }}>Reintentar conexión</Text></Pressable> : null}
        </View>

        <View style={styles.authCard}>
          <Text style={styles.overline}>{session ? 'SESIÓN ACTIVA' : 'ACCESO SEGURO'}</Text>
          {session ? <>
            <Text style={[styles.authTitle, { fontFamily }]}>Hola, {session.user.name}</Text>
            <Text style={styles.authHint}>{session.user.email}</Text>
            <Pressable onPress={() => { setSession(null); setCatalog(null); setActiveTab('Inicio'); scroll.current?.scrollTo({ y: 0, animated: true }); }} style={styles.authButton}><Text style={styles.authButtonText}>Cerrar sesión</Text></Pressable>
          </> : <>
            <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Correo electrónico" placeholderTextColor="#718096" value={email} onChangeText={setEmail} style={styles.authInput} />
            <TextInput secureTextEntry placeholder="Contraseña" placeholderTextColor="#718096" value={password} onChangeText={setPassword} style={styles.authInput} />
            {loginError ? <Text style={styles.authError}>{loginError}</Text> : null}
            <Pressable disabled={loggingIn || !email || !password} onPress={login} style={[styles.authButton, (loggingIn || !email || !password) && styles.authButtonDisabled]}><Text style={styles.authButtonText}>{loggingIn ? 'Entrando...' : 'Entrar al ERP'}</Text></Pressable>
          </>}
        </View>


        <View onLayout={(event) => setPanelY(event.nativeEvent.layout.y)}>
        {session && activeTab === 'Perfil' ? <ProfilePanel base={apiBaseUrl} session={session} accent={accent} onExpired={onExpired} /> : null}
        {session && (activeTab === 'Inicio'||activeTab === 'Módulos') && session.user.permissions.includes('usuarios.ver') ? <Pressable accessibilityRole="button" onPress={()=>openCatalog('invoices')} style={styles.catalogLink}><Text style={{color:accent}}>Facturación</Text></Pressable> : null}
        {session && (activeTab === 'Inicio'||activeTab === 'Módulos') && session.user.permissions.includes('crm.ver') ? <Pressable accessibilityRole="button" onPress={()=>openCatalog('crm')} style={styles.catalogLink}><Text style={{color:accent}}>CRM</Text></Pressable> : null}
        {session && (activeTab === 'Inicio'||activeTab === 'Módulos') && session.user.permissions.includes('logistica.ver') ? <Pressable accessibilityRole="button" onPress={()=>openCatalog('shipments')} style={styles.catalogLink}><Text style={{color:accent}}>Logística</Text></Pressable> : null}
        {session && (activeTab === 'Inicio'||activeTab === 'Módulos') && session.user.permissions.includes('usuarios.ver') ? <Pressable accessibilityRole="button" onPress={()=>openCatalog('maintenance')} style={styles.catalogLink}><Text style={{color:accent}}>Mantenimiento</Text></Pressable> : null}
        {session && (activeTab === 'Inicio'||activeTab === 'Módulos') && session.user.permissions.includes('usuarios.ver') ? <Pressable accessibilityRole="button" onPress={()=>openCatalog('organization')} style={styles.catalogLink}><Text style={{color:accent}}>Empresa y sucursales</Text></Pressable> : null}
        {session && (activeTab === 'Inicio'||activeTab === 'Módulos') && session.user.permissions.includes('usuarios.ver') ? <Pressable accessibilityRole="button" onPress={()=>openCatalog('roles')} style={styles.catalogLink}><Text style={{color:accent}}>Roles</Text></Pressable> : null}
        {session && (activeTab === 'Inicio'||activeTab === 'Módulos') && session.user.permissions.includes('usuarios.ver') ? <Pressable accessibilityRole="button" onPress={()=>openCatalog('compliance')} style={styles.catalogLink}><Text style={{color:accent}}>Cumplimiento</Text></Pressable> : null}
        {session && (activeTab === 'Inicio'||activeTab === 'Módulos') && session.user.permissions.includes('usuarios.ver') ? <Pressable accessibilityRole="button" onPress={()=>openCatalog('risks')} style={styles.catalogLink}><Text style={{color:accent}}>Riesgos</Text></Pressable> : null}
        {session && (activeTab === 'Inicio'||activeTab === 'Módulos') && session.user.permissions.includes('usuarios.ver') ? <Pressable accessibilityRole="button" onPress={()=>openCatalog('tickets')} style={styles.catalogLink}><Text style={{color:accent}}>Soporte</Text></Pressable> : null}
        {session && (activeTab === 'Inicio'||activeTab === 'Módulos') && session.user.permissions.includes('usuarios.ver') ? <Pressable accessibilityRole="button" onPress={()=>openCatalog('assets')} style={styles.catalogLink}><Text style={{color:accent}}>Activos</Text></Pressable> : null}
        {session && (activeTab === 'Inicio'||activeTab === 'Módulos') && session.user.permissions.includes('usuarios.ver') ? <Pressable accessibilityRole="button" onPress={()=>openCatalog('quality')} style={styles.catalogLink}><Text style={{color:accent}}>Calidad</Text></Pressable> : null}
        {session && (activeTab === 'Inicio'||activeTab === 'Módulos') && session.user.permissions.includes('produccion.ver') ? <Pressable accessibilityRole="button" onPress={()=>openCatalog('production')} style={styles.catalogLink}><Text style={{color:accent}}>Producción</Text></Pressable> : null}
        {session && (activeTab === 'Inicio'||activeTab === 'Módulos') && session.user.permissions.includes('proyectos.ver') ? <Pressable accessibilityRole="button" onPress={()=>openCatalog('projects')} style={styles.catalogLink}><Text style={{color:accent}}>Proyectos</Text></Pressable> : null}
        {session && (activeTab === 'Inicio'||activeTab === 'Módulos') && session.user.permissions.includes('usuarios.ver') ? <Pressable accessibilityRole="button" onPress={()=>openCatalog('users')} style={styles.catalogLink}><Text style={{color:accent}}>Usuarios</Text></Pressable> : null}
        {session && (activeTab === 'Inicio'||activeTab === 'Módulos') && session.user.permissions.includes('usuarios.ver') ? <Pressable accessibilityRole="button" onPress={()=>openCatalog('departments')} style={styles.catalogLink}><Text style={{color:accent}}>Departamentos</Text></Pressable> : null}
        {session && activeTab === 'Actividad' && session.user.permissions.includes('notificaciones.ver') ? <NotificationsPanel base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} accent={accent} onExpired={onExpired}/> : null}
        {session && activeTab === 'Actividad' ? session.user.permissions.includes('auditoria.ver') ? <AuditPanel base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} accent={accent} onExpired={onExpired} /> : session.user.permissions.includes('notificaciones.ver') ? null : <Text style={{color:accent}}>No tienes permiso para consultar actividad.</Text> : null}
        {session && activeTab === 'Inicio' ? <>
          {catalog === 'sales' || catalog === 'purchase-orders' ? <><TransactionPanel key={`${session.token}:${catalog}`} base={apiBaseUrl} token={session.token} kind={catalog} companyId={session.user.companyId} branchId={session.user.branchId} accent={accent} canCreate={session.user.permissions.includes('usuarios.editar')} onExpired={onExpired} /><Pressable onPress={() => openCatalog(null)} style={styles.catalogLink}><Text style={{ color: accent }}>Volver al panel</Text></Pressable></> : catalog === 'finance' ? <FinancePanel base={apiBaseUrl} token={session.token} accent={accent} canCreate={session.user.permissions.includes('usuarios.editar')} onExpired={onExpired} /> : <>
          {catalog === 'organization' ? <><OrganizationPanel canManage={session.user.permissions.includes('usuarios.editar')} key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} accent={accent} onExpired={onExpired}/><Pressable onPress={()=>openCatalog(null)} style={styles.catalogLink}><Text style={{color:accent}}>Volver al panel</Text></Pressable></> : catalog === 'roles' ? <><RolesPanel canManage={session.user.permissions.includes('usuarios.editar')} key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} permissions={session.user.permissions} accent={accent} onExpired={onExpired}/><Pressable onPress={()=>openCatalog(null)} style={styles.catalogLink}><Text style={{color:accent}}>Volver al panel</Text></Pressable></> : catalog === 'compliance' ? <><CompliancePanel canManage={session.user.permissions.includes('usuarios.editar')} key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} accent={accent} onExpired={onExpired}/><Pressable onPress={()=>openCatalog(null)} style={styles.catalogLink}><Text style={{color:accent}}>Volver al panel</Text></Pressable></> : catalog === 'risks' ? <><RisksPanel canManage={session.user.permissions.includes('usuarios.editar')} key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} accent={accent} onExpired={onExpired}/><Pressable onPress={()=>openCatalog(null)} style={styles.catalogLink}><Text style={{color:accent}}>Volver al panel</Text></Pressable></> : catalog === 'tickets' ? <><TicketsPanel canManage={session.user.permissions.includes('usuarios.editar')} key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} accent={accent} onExpired={onExpired}/><Pressable onPress={()=>openCatalog(null)} style={styles.catalogLink}><Text style={{color:accent}}>Volver al panel</Text></Pressable></> : catalog === 'assets' ? <><AssetsPanel canManage={session.user.permissions.includes('usuarios.editar')} key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} accent={accent} onExpired={onExpired}/><Pressable onPress={()=>openCatalog(null)} style={styles.catalogLink}><Text style={{color:accent}}>Volver al panel</Text></Pressable></> : catalog === 'quality' ? <><QualityPanel canManage={session.user.permissions.includes('usuarios.editar')} key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} accent={accent} onExpired={onExpired}/><Pressable onPress={()=>openCatalog(null)} style={styles.catalogLink}><Text style={{color:accent}}>Volver al panel</Text></Pressable></> : catalog === 'maintenance' ? <><MaintenancePanel canManage={session.user.permissions.includes('usuarios.editar')} key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} accent={accent} onExpired={onExpired}/><Pressable onPress={()=>openCatalog(null)} style={styles.catalogLink}><Text style={{color:accent}}>Volver al panel</Text></Pressable></> : catalog === 'shipments' ? <><ShipmentsPanel canCreate={session.user.permissions.includes('logistica.crear')} canEdit={session.user.permissions.includes('logistica.editar')} key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} accent={accent} onExpired={onExpired}/><Pressable onPress={()=>openCatalog(null)} style={styles.catalogLink}><Text style={{color:accent}}>Volver al panel</Text></Pressable></> : catalog === 'crm' ? <><OpportunitiesPanel canCreate={session.user.permissions.includes('crm.crear')} canEdit={session.user.permissions.includes('crm.editar')} key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} accent={accent} onExpired={onExpired}/><Pressable onPress={()=>openCatalog(null)} style={styles.catalogLink}><Text style={{color:accent}}>Volver al panel</Text></Pressable></> : catalog === 'invoices' ? <><InvoicesPanel canManage={session.user.permissions.includes('usuarios.editar')} key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} accent={accent} onExpired={onExpired}/><Pressable onPress={()=>openCatalog(null)} style={styles.catalogLink}><Text style={{color:accent}}>Volver al panel</Text></Pressable></> : catalog === 'production' ? <><ProductionPanel key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} canManage={session.user.permissions.includes('usuarios.editar')&&session.user.permissions.includes('usuarios.ver')} accent={accent} onExpired={onExpired}/><Pressable onPress={()=>openCatalog(null)} style={styles.catalogLink}><Text style={{color:accent}}>Volver al panel</Text></Pressable></> : catalog === 'projects' ? <><ProjectsPanel key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} canCreate={session.user.permissions.includes('proyectos.crear')} canEdit={session.user.permissions.includes('proyectos.editar')} accent={accent} onExpired={onExpired}/><Pressable onPress={()=>openCatalog(null)} style={styles.catalogLink}><Text style={{color:accent}}>Volver al panel</Text></Pressable></> : catalog === 'users' ? <><UsersPanel currentEmail={session.user.email} canEdit={session.user.permissions.includes('usuarios.editar')} permissions={session.user.permissions} canCreate={session.user.permissions.includes('usuarios.crear')} key={session.token} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} accent={accent} onExpired={onExpired}/><Pressable onPress={()=>openCatalog(null)} style={styles.catalogLink}><Text style={{color:accent}}>Volver al panel</Text></Pressable></> : catalog === 'departments' ? <><DepartmentsPanel base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} accent={accent} onExpired={onExpired} canEdit={session.user.permissions.includes('usuarios.editar')}/><Pressable onPress={()=>openCatalog(null)} style={styles.catalogLink}><Text style={{color:accent}}>Volver al panel</Text></Pressable></> : catalog === 'employees' ? <><EmployeePanel canEdit={session.user.permissions.includes('rrhh.editar')} key={session.token} canManageDepartments={session.user.permissions.includes('usuarios.editar')} canCreate={session.user.permissions.includes('rrhh.crear')} base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} accent={accent} onExpired={onExpired}/><Pressable onPress={()=>openCatalog(null)} style={styles.catalogLink}><Text style={{color:accent}}>Volver al panel</Text></Pressable></> : catalog === 'stock' ? <><InventoryPanel key={session.token} base={apiBaseUrl} token={session.token} accent={accent} canCreate={session.user.permissions.includes('usuarios.editar')} onExpired={onExpired} /><Pressable onPress={() => setCatalog(null)} style={styles.catalogLink}><Text style={{ color: accent }}>Volver al panel</Text></Pressable></> : catalog ? <CatalogPanel companyId={session.user.companyId} branchId={session.user.branchId} onEdit={() => scroll.current?.scrollTo({ y: Math.max(0, panelY - 28), animated: true })} key={`${session.token}:${catalog}`} base={apiBaseUrl} token={session.token} kind={catalog} accent={accent} canCreate={session.user.permissions.includes('usuarios.editar')} onExpired={onExpired} onClose={() => setCatalog(null)} /> : <DashboardPanel key={session.token} base={apiBaseUrl} token={session.token} accent={accent} onExpired={onExpired} />}
          </>}
        </> : null}
        {session && activeTab === 'Inicio' && session.user.permissions.includes('reportes.ver') ? <PeriodReportPanel base={apiBaseUrl} token={session.token} companyId={session.user.companyId} branchId={session.user.branchId} accent={accent} onExpired={onExpired}/> : null}
        {session && activeTab === 'Inicio' && catalog === 'stock' ? <InventoryAlerts base={apiBaseUrl} token={session.token} companyId={session.user.companyId} canConfigure={session.user.permissions.includes('configuracion.ver')} canEdit={session.user.permissions.includes('usuarios.editar')} accent={accent} onExpired={onExpired}/> : null}
        {session ? <View style={styles.catalogLinks}>{session.user.permissions.includes('rrhh.ver') ? <Pressable accessibilityRole="button" onPress={()=>openCatalog('employees')} style={styles.catalogLink}><Text style={{color:accent}}>Empleados</Text></Pressable> : null}{(['customers', 'suppliers', 'products'] as const).map((kind) => <Pressable key={kind} accessibilityRole="button" onPress={() => openCatalog(kind)} style={styles.catalogLink}><Text style={{ color: accent }}>{kind === 'customers' ? 'Clientes' : kind === 'suppliers' ? 'Proveedores' : 'Productos'}</Text></Pressable>)}</View> : null}
        </View>
        <View style={styles.sectionHeader}><View><Text style={styles.overline}>ACCESO RÁPIDO</Text><Text style={[styles.sectionTitle, { fontFamily }]}>Módulos del ERP</Text></View><Text style={styles.sectionCount}>04</Text></View>
        <View style={styles.moduleGrid}>
          {modules.map((module) => (
            <Pressable key={module.name} accessibilityRole="button" onPress={() => { if (!session) { Alert.alert(module.name, 'Inicia sesión para consultar este módulo.'); return; } openCatalog(module.name === 'Inventario' ? 'stock' : module.name === 'Ventas' ? 'sales' : module.name === 'Compras' ? 'purchase-orders' : 'finance'); }} style={({ pressed }) => [styles.moduleCard, pressed && styles.pressed]}>
              <View style={styles.moduleCardTop}><Text style={[styles.moduleIcon, { color: accent }]}>{module.icon}</Text><Text style={styles.moduleArrow}>↗</Text></View>
              <Text style={[styles.moduleName, { fontFamily }]}>{module.name}</Text>
              <Text style={styles.moduleDetail}>{module.detail}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.bottomNote}><Text style={styles.bottomNoteMark}>✦</Text><Text style={styles.bottomNoteText}>PERSONALIZA TU ESPACIO DESDE EL ÍCONO DE AJUSTES</Text></View>
      </ScrollView>

      <View style={styles.bottomNav}>
        {['Inicio', 'Módulos', 'Actividad', 'Perfil'].map((tab, index) => (
          <Pressable key={tab} accessibilityRole="button" accessibilityState={{ selected: activeTab === tab }} onPress={() => { if (!session && (tab === 'Actividad' || tab === 'Perfil')) { Alert.alert(tab, 'Inicia sesión para consultar esta pantalla.'); return; } setActiveTab(tab); setCatalog(null); requestAnimationFrame(() => scroll.current?.scrollTo({ y: tab === 'Inicio' ? 0 : Math.max(0, panelY - 28), animated: true })); }} style={styles.navItem}>
            <Text style={[styles.navGlyph, { color: activeTab === tab ? accent : '#718096' }]}>{['⌂', '▦', '◷', '○'][index]}</Text>
            <Text style={[styles.navLabel, { color: activeTab === tab ? accent : '#718096' }]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      <Modal visible={settingsVisible} transparent animationType="slide" onRequestClose={() => setSettingsVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalOutside} onPress={() => setSettingsVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}><View><Text style={styles.overline}>PREFERENCIAS</Text><Text style={[styles.sheetTitle, { fontFamily }]}>Personaliza tu interfaz</Text></View><Pressable onPress={() => setSettingsVisible(false)}><Text style={styles.closeButton}>×</Text></Pressable></View>
            <Text style={styles.preferenceLabel}>COLOR DE ACENTO</Text>
            <View style={styles.optionRow}>
              {palettes.map((palette) => <Pressable key={palette.name} onPress={() => setAccent(palette.value)} style={[styles.colorOption, { borderColor: accent === palette.value ? palette.value : 'transparent' }]}><View style={[styles.colorSwatch, { backgroundColor: palette.value }]} /><Text style={styles.optionText}>{palette.name}</Text></Pressable>)}
            </View>
            <Text style={styles.preferenceLabel}>TIPOGRAFÍA</Text>
            <View style={styles.typeList}>
              {typefaces.map((typeface) => <Pressable key={typeface.value} onPress={() => setFontFamily(typeface.value)} style={[styles.typeOption, fontFamily === typeface.value && { borderColor: `${accent}99`, backgroundColor: `${accent}12` }]}><Text style={[styles.typeSample, { fontFamily: typeface.value, color: accent }]}>Aa</Text><Text style={styles.typeName}>{typeface.name}</Text><Text style={[styles.typeCheck, { color: accent }]}>{fontFamily === typeface.value ? '✓' : ''}</Text></Pressable>)}
            </View>
            <Text style={styles.preferenceFootnote}>Los cambios se aplican a esta vista previa.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  catalogLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  catalogLink: { padding: 12, backgroundColor: '#111923', borderRadius: 10 },
  screen: { flex: 1, backgroundColor: '#0B1016', paddingTop: NativeStatusBar.currentHeight ?? 24 },
  content: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 28 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 48, height: 48, borderRadius: 12 },
  brandName: { color: '#F1F5F9', fontSize: 16, fontWeight: '800', letterSpacing: 2.2 },
  brandCaption: { color: '#788797', fontSize: 9, letterSpacing: 2.1, marginTop: 2 },
  settingsButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#151D26', borderWidth: 1, borderColor: '#27313D', alignItems: 'center', justifyContent: 'center' },
  settingsGlyph: { fontSize: 20 },
  welcomeRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 },
  overline: { color: '#8290A0', fontSize: 9, fontWeight: '700', letterSpacing: 1.8 },
  heading: { color: '#F1F5F9', fontSize: 27, fontWeight: '700', marginTop: 7 },
  previewBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#17212A', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  previewText: { color: '#AAB7C4', fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  systemCard: { backgroundColor: '#111923', borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 30 },
  systemCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  systemIconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  systemIcon: { fontSize: 22 },
  systemStatus: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  systemStatusText: { color: '#AAB7C4', fontSize: 10 },
  systemTitle: { color: '#F1F5F9', fontSize: 18, fontWeight: '700', marginTop: 18 },
  systemDescription: { color: '#8B99A8', fontSize: 12, lineHeight: 19, marginTop: 8 },
  divider: { height: 1, backgroundColor: '#26313D', marginTop: 18, marginBottom: 13 },
  systemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  systemFooterLabel: { color: '#718096', fontSize: 8, fontWeight: '700', letterSpacing: 1.4 },
  systemFooterValue: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  authCard: { backgroundColor: '#111923', borderRadius: 18, borderWidth: 1, borderColor: '#202B36', padding: 16, marginBottom: 30 },
  authTitle: { color: '#F1F5F9', fontSize: 18, fontWeight: '700', marginTop: 8 },
  authHint: { color: '#8B99A8', fontSize: 12, marginTop: 4 },
  authInput: { backgroundColor: '#0B1016', borderWidth: 1, borderColor: '#293746', borderRadius: 11, color: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 11, marginTop: 10 },
  authButton: { backgroundColor: '#59D6FF', borderRadius: 11, alignItems: 'center', paddingVertical: 12, marginTop: 12 },
  authButtonDisabled: { opacity: 0.45 },
  authButtonText: { color: '#071017', fontWeight: '800', fontSize: 13 },
  authError: { color: '#F87171', fontSize: 11, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { color: '#F1F5F9', fontSize: 19, fontWeight: '700', marginTop: 6 },
  sectionCount: { color: '#607080', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  moduleCard: { width: '48%', minHeight: 125, backgroundColor: '#111923', borderRadius: 18, borderWidth: 1, borderColor: '#202B36', padding: 14, marginBottom: 12 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
  moduleCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  moduleIcon: { fontSize: 23, fontWeight: '700' },
  moduleArrow: { color: '#687789', fontSize: 14 },
  moduleName: { color: '#E8EEF4', fontSize: 14, fontWeight: '700' },
  moduleDetail: { color: '#788797', fontSize: 10, marginTop: 5 },
  bottomNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 12, marginBottom: 8 },
  bottomNoteMark: { color: '#59D6FF', fontSize: 12 },
  bottomNoteText: { color: '#667586', fontSize: 8, letterSpacing: 1.1, textAlign: 'center' },
  bottomNav: { minHeight: 68, backgroundColor: '#0F151D', borderTopWidth: 1, borderTopColor: '#202B36', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 6 },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 56, gap: 3 },
  navGlyph: { fontSize: 19 },
  navLabel: { fontSize: 9, fontWeight: '600' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000099' },
  modalOutside: { flex: 1 },
  sheet: { backgroundColor: '#111923', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 34, borderTopWidth: 1, borderColor: '#2A3643' },
  sheetHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: '#465362', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  sheetTitle: { color: '#F1F5F9', fontSize: 20, fontWeight: '700', marginTop: 6 },
  closeButton: { color: '#AAB7C4', fontSize: 28, paddingHorizontal: 6 },
  preferenceLabel: { color: '#8290A0', fontSize: 9, fontWeight: '700', letterSpacing: 1.6, marginBottom: 12 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 23 },
  colorOption: { width: '24%', alignItems: 'center', borderRadius: 13, borderWidth: 1, paddingVertical: 9, gap: 7 },
  colorSwatch: { width: 22, height: 22, borderRadius: 11 },
  optionText: { color: '#BEC8D2', fontSize: 9 },
  typeList: { gap: 8 },
  typeOption: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: '#273341', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 12 },
  typeSample: { fontSize: 17, fontWeight: '700', width: 28 },
  typeName: { color: '#D5DEE7', fontSize: 12, flex: 1 },
  typeCheck: { fontSize: 16, fontWeight: '700' },
  preferenceFootnote: { color: '#718096', fontSize: 10, marginTop: 17, textAlign: 'center' }
});

export default App;