import { IntroScreen } from './src/screens/IntroScreen';
import { DesktopShell } from './src/navigation/DesktopShell';
import { environment } from './src/config/environment';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/state/AuthContext';
import { MonitoringProvider, useMonitoring } from './src/state/MonitoringContext';

function AppContent() {
  const [introComplete, setIntroComplete] = useState(false);
  const { state, retrySession } = useAuth();
  const monitoring = useMonitoring();
  const [appMounted, setAppMounted] = useState(false);
  const canMount = state !== 'checking' && (state !== 'authenticated' || monitoring.state !== 'loading');
  const startupReady = canMount && appMounted;
  const local = environment.bypassAuth || environment.mode === 'mock';
  const startupLines = [
    state === 'checking' ? 'Cargando sesión…' : environment.bypassAuth ? 'Sesión local lista · bypass activo' : state === 'authenticated' ? 'Sesión cargada' : 'Inicio de sesión necesario',
    ...(state === 'authenticated' ? [monitoring.state === 'loading'
      ? local ? 'Cargando datos locales…' : 'Conectando a RPi Server · cargando datos…'
      : monitoring.state === 'loaded' ? local ? 'Datos locales cargados · sin conexión a RPi' : 'Datos de RPi Server cargados'
      : 'RPi no disponible · abriendo estado de error'] : []),
    ...(canMount ? [appMounted ? 'APP lista' : 'Cargando APP…'] : []),
  ];
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!introComplete) return;
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then(reduced => {
      if (!active) return;
      animation = Animated.timing(opacity, { toValue: 1, duration: reduced ? 120 : 420, useNativeDriver: true });
      animation.start();
    });
    return () => { active = false; animation?.stop(); };
  }, [introComplete, opacity]);
  return <View style={{ flex: 1, backgroundColor: '#000' }}>
    {canMount && <Animated.View
      onLayout={() => setAppMounted(true)}
      pointerEvents={introComplete ? 'auto' : 'none'}
      accessibilityElementsHidden={!introComplete}
      importantForAccessibility={introComplete ? 'auto' : 'no-hide-descendants'}
      style={{ flex: 1, opacity }}><DesktopShell /></Animated.View>}
    {!introComplete && <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
      <IntroScreen ready={startupReady} startupLines={startupLines} onInitialize={retrySession} onFinish={() => setIntroComplete(true)} />
    </View>}
  </View>;
}

export default function App() { return <SafeAreaProvider><StatusBar hidden style="light" /><AuthProvider><MonitoringProvider><AppContent /></MonitoringProvider></AuthProvider></SafeAreaProvider>; }

