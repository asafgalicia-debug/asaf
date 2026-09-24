import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

const cards = [
  { label: 'Ventas', value: '1.2K' },
  { label: 'Inventario', value: '340' },
  { label: 'IA', value: 'Activo' },
  { label: 'Integraciones', value: '4' }
];

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.eyebrow}>ERP Universal Modular</Text>
      <Text style={styles.title}>Panel móvil</Text>
      <Text style={styles.subtitle}>Operación, finanzas, seguridad y automatización en una sola vista.</Text>

      <View style={styles.grid}>
        {cards.map((card) => (
          <View key={card.label} style={styles.card}>
            <Text style={styles.cardLabel}>{card.label}</Text>
            <Text style={styles.cardValue}>{card.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef6ff',
    padding: 24,
    justifyContent: 'center'
  },
  eyebrow: {
    color: '#486581',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#102a43',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#334e68',
    marginBottom: 20
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  card: {
    width: '46%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3
  },
  cardLabel: {
    color: '#486581',
    fontSize: 12,
    marginBottom: 12
  },
  cardValue: {
    color: '#102a43',
    fontSize: 24,
    fontWeight: '700'
  }
});
