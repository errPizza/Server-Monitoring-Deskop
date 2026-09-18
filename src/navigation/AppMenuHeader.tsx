import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const sections = [
  { title: 'General', items: [['Dashboard', 'Dashboard', 'grid-outline'], ['Statistics', 'Estadísticas', 'bar-chart-outline']] },
  { title: 'Servidor', items: [['Raspberry Pi', 'Raspberry Pi', 'hardware-chip-outline'], ['Storage', 'Storage · discos y archivos', 'server-outline'], ['Docker', 'Docker', 'logo-docker'], ['Nginx', 'Nginx', 'globe-outline']] },
  { title: 'Actividad', items: [['Requests', 'Requests', 'pulse-outline'], ['Logs', 'Logs', 'document-text-outline'], ['Errors', 'Errores', 'warning-outline'], ['Alerts', 'Alertas', 'notifications-outline']] },
  { title: 'Administración', items: [['Remote Control', 'Control remoto', 'terminal-outline'], ['Settings', 'Ajustes', 'settings-outline']] },
] as const;

export function AppMenuHeader({ navigation, route }: NativeStackHeaderProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>(sections.map(section => section.title));
  const toggle = (title: string) => setExpanded(current => current.includes(title) ? current.filter(item => item !== title) : [...current, title]);
  return <View style={[styles.header, { paddingTop: insets.top, paddingLeft: Math.max(12, insets.left), paddingRight: Math.max(12, insets.right) }]}>
    <Pressable accessibilityRole="button" accessibilityLabel="Abrir menú de navegación" accessibilityState={{ expanded: open }} onPress={() => setOpen(true)} style={styles.trigger}>
      <Ionicons name="menu-outline" size={24} color={colors.text} />
      <View style={styles.brand}><Text style={styles.brandTitle}>AGM <Text style={styles.brandLight}>/ Monitoring</Text></Text><Text style={styles.caption}>{route.name}</Text></View>
      <Ionicons name="chevron-down" size={16} color={colors.muted} />
    </Pressable>
    {open && <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={() => setOpen(false)} />
        <View accessibilityViewIsModal style={[styles.menu, { marginTop: insets.top + 8, marginBottom: Math.max(16, insets.bottom) }]}>
          <View style={styles.menuTitle}><Text style={styles.brandTitle}>Navegación</Text><Pressable accessibilityRole="button" accessibilityLabel="Cerrar navegación" onPress={() => setOpen(false)} style={styles.close}><Ionicons name="close" size={22} color={colors.text} /></Pressable></View>
          <ScrollView showsVerticalScrollIndicator contentContainerStyle={styles.menuContent}>
            {sections.map(section => <View key={section.title}>
              <Pressable accessibilityRole="button" accessibilityLabel={section.title} accessibilityState={{ expanded: expanded.includes(section.title) }} onPress={() => toggle(section.title)} style={styles.section}>
                <Text style={styles.sectionText}>{section.title}</Text><Ionicons name={expanded.includes(section.title) ? 'chevron-up' : 'chevron-down'} size={15} color={colors.muted} />
              </Pressable>
              {expanded.includes(section.title) && section.items.map(([name, label, icon]) => <Pressable key={name} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: route.name === name }} onPress={() => { setOpen(false); navigation.navigate(name); }} style={({ pressed }) => [styles.item, (route.name === name || pressed) && styles.selected]}>
                <Ionicons name={icon} size={19} color={route.name === name ? colors.text : colors.muted} /><Text style={styles.itemText}>{label}</Text>{route.name === name && <View style={styles.dot} />}
              </Pressable>)}
            </View>)}
          </ScrollView>
        </View>
      </View>
    </Modal>}
  </View>;
}
const styles = StyleSheet.create({
  header: { backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.border },
  trigger: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12 },
  brand: { flex: 1 }, brandTitle: { color: colors.text, fontSize: 15, fontWeight: '800' }, brandLight: { color: colors.muted, fontWeight: '400' }, caption: { color: colors.muted, fontSize: 11, marginTop: 3 },
  overlay: { flex: 1, backgroundColor: '#000000aa', paddingHorizontal: 12 },
  menu: { maxHeight: '94%', flexShrink: 1, width: '100%', maxWidth: 480, alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: 'hidden' },
  menuTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 8, borderBottomWidth: 1, borderBottomColor: colors.border }, close: { padding: 12 },
  menuContent: { padding: 10 }, section: { minHeight: 44, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionText: { color: colors.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 46, paddingHorizontal: 12, borderRadius: 7 }, selected: { backgroundColor: colors.surfaceRaised }, itemText: { color: colors.text, fontSize: 14, flex: 1 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
});
