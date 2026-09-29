import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

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

const modules = [
  { icon: '↗', name: 'Ventas', detail: 'Pedidos y clientes' },
  { icon: '◈', name: 'Inventario', detail: 'Productos y stock' },
  { icon: '⇄', name: 'Compras', detail: 'Proveedores y órdenes' },
  { icon: '◎', name: 'Finanzas', detail: 'Cuentas y reportes' }
];

function App() {
  const [accent, setAccent] = useState(palettes[0].value);
  const [fontFamily, setFontFamily] = useState(typefaces[0].value);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Inicio');

  const showPreviewNotice = (name: string) => {
    Alert.alert(name, 'Esta pantalla es una vista previa. Conectaremos sus datos a la API en la siguiente fase.');
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
            <View style={styles.systemStatus}><View style={[styles.statusDot, { backgroundColor: '#FBBF24' }]} /><Text style={styles.systemStatusText}>API pendiente de conexión</Text></View>
          </View>
          <Text style={[styles.systemTitle, { fontFamily }]}>Tu operación, en un solo lugar</Text>
          <Text style={styles.systemDescription}>El diseño está preparado. Los indicadores reales aparecerán al conectar los módulos y la base de datos.</Text>
          <View style={styles.divider} />
          <View style={styles.systemFooter}><Text style={styles.systemFooterLabel}>ESTADO DEL SISTEMA</Text><Text style={[styles.systemFooterValue, { color: accent }]}>INTERFAZ LISTA</Text></View>
        </View>

        <View style={styles.sectionHeader}><View><Text style={styles.overline}>ACCESO RÁPIDO</Text><Text style={[styles.sectionTitle, { fontFamily }]}>Módulos del ERP</Text></View><Text style={styles.sectionCount}>04</Text></View>
        <View style={styles.moduleGrid}>
          {modules.map((module) => (
            <Pressable key={module.name} onPress={() => showPreviewNotice(module.name)} style={({ pressed }) => [styles.moduleCard, pressed && styles.pressed]}>
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
          <Pressable key={tab} onPress={() => { setActiveTab(tab); if (tab !== 'Inicio') showPreviewNotice(tab); }} style={styles.navItem}>
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
  screen: { flex: 1, backgroundColor: '#0B1016' },
  content: { paddingHorizontal: 22, paddingTop: 56, paddingBottom: 28 },
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
