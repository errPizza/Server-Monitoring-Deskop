import { Animated, StyleSheet, useWindowDimensions } from 'react-native';

export const introAssets = {
  pizza: require('../../../assets/pizza-dev-logo.png') as number,
  studio: require('../../../assets/another-game-more-studio-emblem.png') as number,
  monitoring: require('../../../assets/agm-server-monitoring-icon.png') as number,
};
export interface SceneProps { progress: Animated.Value; reducedMotion: boolean; }
export const tween = (p: Animated.Value, inputRange: number[], outputRange: number[]) =>
  p.interpolate({ inputRange, outputRange, extrapolate: 'clamp' });
export function useIntroSize() {
  const { width, height } = useWindowDimensions();
  return Math.min(1.25, (width - 40) / 360, (height - 48) / 420);
}
export const shared = StyleSheet.create({
  scene: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  white: { color: '#f5f5f5' },
});

export function smooth(p: Animated.Value, start: number, end: number, from: number, to: number) {
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    inputRange.push(start + (end - start) * t);
    outputRange.push(from + (to - from) * t * t * (3 - 2 * t));
  }
  return tween(p, inputRange, outputRange);
}

export function easeOut(p: Animated.Value, start: number, end: number, from: number, to: number) {
  return tween(p,
    Array.from({ length: 25 }, (_, i) => start + (end - start) * i / 24),
    Array.from({ length: 25 }, (_, i) => from + (to - from) * (1 - Math.pow(1 - i / 24, 3))),
  );
}
