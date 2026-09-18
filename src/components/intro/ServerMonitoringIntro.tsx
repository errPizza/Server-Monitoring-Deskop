import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View, Platform } from 'react-native';
import { introAssets, SceneProps, shared, tween, useIntroSize } from './shared';

export function ServerMonitoringIntro({ progress: p, reducedMotion: reduced, startupLines, ready }: SceneProps & { startupLines: string[]; ready: boolean }) {
  const s = useIntroSize();
  const rotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced || ready) return;
    const loop = Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [reduced, rotation, ready]);
  return <Animated.View style={[shared.scene, { opacity: tween(p, [0, .24, 1], [0, 1, 1]) }]}>
    <Animated.Image source={introAssets.monitoring} accessibilityLabel="AGM Server Monitoring" style={{ width: 148 * s, height: 148 * s, borderRadius: 28 * s, transform: [{ scale: reduced ? 1 : tween(p, [0, .3, 1], [.95, 1, 1]) }] }} />
    <Animated.View style={{ alignItems: 'center', marginTop: 24 * s, opacity: tween(p, [0, .22, .44, 1], [0, 0, 1, 1]) }}>
      <Text style={{ color: '#49ee83', fontSize: 15 * s, fontWeight: '700', letterSpacing: 2 }}>RPi (AGM)</Text>
      <Text style={[shared.white, { fontSize: 29 * s, fontWeight: '700', marginTop: 6 * s }]}>Server Monitoring</Text>
    </Animated.View>
    <View style={{ marginTop: 26 * s, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole={ready ? 'image' : 'progressbar'} accessibilityLabel={ready ? 'Carga completada' : 'Inicializando aplicación'}>
      <Animated.View style={{ position: 'absolute', width: 24, height: 24, borderRadius: 12, borderWidth: 2,
        borderColor: ready ? '#49ee83' : '#163824', borderTopColor: '#49ee83',
        transform: [{ rotate: reduced || ready ? '0deg' : rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }} />
      {ready && <Text style={{ color: '#49ee83', fontSize: 14 }}>✓</Text>}
    </View>
    <View style={{ position: 'absolute', left: 24, right: 24, bottom: 32 }} accessibilityLiveRegion="polite">
      {startupLines.map((line, index) => <Text key={index} style={{ color: index === startupLines.length - 1 ? '#bceccc' : '#728279', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 11, lineHeight: 19 }}>{line}</Text>)}

    </View>
  </Animated.View>;
}
