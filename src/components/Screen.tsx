import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import { useMonitoring } from '../state/MonitoringContext';

export function Screen({ children, scroll = true, onRefresh, refreshing }: {
  children: React.ReactNode; scroll?: boolean; onRefresh?: () => void; refreshing?: boolean;
}) {
  const { refresh, state } = useMonitoring();
  const insets = useSafeAreaInsets();
  const content = <View style={[styles.content, { paddingLeft: Math.max(32, insets.left), paddingRight: Math.max(32, insets.right) }]}>{children}</View>;
  return <View style={styles.screen}>{scroll ? <ScrollView contentContainerStyle={{ paddingBottom: Math.max(spacing.lg, insets.bottom) }} refreshControl={<RefreshControl refreshing={refreshing ?? state === 'loading'} onRefresh={onRefresh ?? (() => void refresh())} tintColor={colors.muted} />}>{content}</ScrollView> : content}</View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.bg }, content: { padding: 28, gap: spacing.lg, width: '100%', maxWidth: 1600, alignSelf: 'center' } });
