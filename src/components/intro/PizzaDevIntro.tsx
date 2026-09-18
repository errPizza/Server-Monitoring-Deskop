import React from 'react';
import { Animated, Text, View } from 'react-native';
import { introAssets, SceneProps, shared, smooth, easeOut, tween, useIntroSize } from './shared';

export function PizzaDevIntro({ progress: p, reducedMotion: reduced }: SceneProps) {
  const s = useIntroSize();
  // The moving clipping boundary is the logo's right edge. The text has its own
  // counter-translation inside it, so letters emerge from behind the opaque logo.
  // Final logo bounds end at x=163; text starts at x=180 (17px safe gap).
  const logoX = reduced ? -83 * s : easeOut(p, .21, .405, 0, -83 * s);
  const edgeX = reduced ? 0 : easeOut(p, .21, .405, 155 * s, 0);
  const textX = reduced ? 0 : easeOut(p, .21, .405, -220 * s, 0);
  return <Animated.View style={[shared.scene, {
    opacity: tween(p, [0, .04, .18, .89, 1], [0, 0, 1, 1, 0]),
    transform: [{ scale: reduced ? 1 : smooth(p, .89, 1, 1, .97) }],
  }]}>
    <View style={{ width: 340 * s, height: 170 * s, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', left: 180 * s, width: 164 * s, height: 72 * s, overflow: 'hidden', transform: [{ translateX: edgeX }] }}>
        <Animated.View style={{ height: 72 * s, justifyContent: 'center', transform: [{ translateX: textX }] }}>
          <Text style={[shared.white, { fontSize: 31 * s, fontWeight: '700' }]}>Pizza Dev</Text>
          <View style={{ width: 34 * s, height: 2, backgroundColor: '#ed2235', marginTop: 10 * s }} />
        </Animated.View>
      </Animated.View>
      <Animated.Image source={introAssets.pizza} accessibilityLabel="Pizza Dev" resizeMode="contain" style={{ width: 152 * s, height: 152 * s, backgroundColor: '#000', transform: [{ translateX: logoX }, { scale: reduced ? 1 : smooth(p, .04, .20, .9, 1) }] }} />
    </View>
  </Animated.View>;
}
