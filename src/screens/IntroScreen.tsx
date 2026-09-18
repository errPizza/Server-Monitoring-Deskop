import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet } from 'react-native';
import { Asset } from 'expo-asset';
import { StatusBar } from 'expo-status-bar';
import { PizzaDevIntro } from '../components/intro/PizzaDevIntro';
import { AnotherGameMoreIntro } from '../components/intro/AnotherGameMoreIntro';
import { ServerMonitoringIntro } from '../components/intro/ServerMonitoringIntro';
import { introAssets } from '../components/intro/shared';
import { STUDIO_DURATION } from '../components/intro/studioTraceTimeline';

const durations = [3400, STUDIO_DURATION, 1800];

export function IntroScreen({ onFinish, ready, startupLines, onInitialize }: {
  onFinish: () => void; ready: boolean; startupLines: string[]; onInitialize: () => Promise<void>;
}) {
  const [prepared, setPrepared] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [scene, setScene] = useState(0);
  const [sequenceComplete, setSequenceComplete] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const initialized = useRef(false);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    let active = true;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    const assets = [introAssets.pizza, introAssets.monitoring];
    if (typeof introAssets.studio === 'number') assets.push(introAssets.studio);
    void Promise.all([
      Asset.loadAsync(assets).catch(error => console.warn('Intro assets could not be preloaded', error)),
      AccessibilityInfo.isReduceMotionEnabled().catch(() => false),
    ]).then(([, reduceMotion]) => {
      if (active) { setReduced(reduceMotion); setPrepared(true); }
    });
    return () => { active = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (!prepared) return;
    progress.setValue(0);
    const animation = Animated.sequence([
      Animated.delay(reduced ? 40 : scene === 0 ? 100 : 240),
      Animated.timing(progress, { toValue: 1, duration: reduced ? 650 : durations[scene], easing: Easing.linear, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => {
      if (!finished) return;
      if (scene < 2) { progress.setValue(0); setScene(value => value + 1); }
      else setSequenceComplete(true);
    });
    return () => animation.stop();
  }, [prepared, progress, reduced, scene]);

  useEffect(() => {
    if (scene === 2 && !initialized.current) {
      initialized.current = true;
      void onInitialize();
    }
  }, [scene, onInitialize]);

  useEffect(() => {
    if (!sequenceComplete || !ready) return;
    const animation = Animated.timing(opacity, { toValue: 0, duration: reduced ? 120 : 420, useNativeDriver: true });
    animation.start(({ finished }) => { if (finished) finishRef.current(); });
    return () => animation.stop();
  }, [sequenceComplete, ready, reduced, opacity]);

  return <Animated.View style={[styles.screen, { opacity }]} accessibilityViewIsModal>
    <StatusBar hidden style="light" backgroundColor="#000000" />
    {prepared && scene === 0 && <PizzaDevIntro progress={progress} reducedMotion={reduced} />}
    {prepared && scene === 1 && <AnotherGameMoreIntro progress={progress} reducedMotion={reduced} />}
    {prepared && scene === 2 && <ServerMonitoringIntro progress={progress} reducedMotion={reduced} startupLines={startupLines} ready={ready} />}
  </Animated.View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#000', overflow: 'hidden' } });
