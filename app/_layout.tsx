import { useEffect } from 'react';
import { View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export default function RootLayout() {
  useFrameworkReady();
  const { session, loading } = useAuth();

  useEffect(() => {
    window.frameworkReady?.();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        {loading ? (
          // Render an empty screen while loading
          <Stack.Screen name="(client-tabs)" />
        ) : !session ? (
          // Redirect to sign in if no session
          <Stack.Screen 
            name="auth/sign-in" 
            options={{ 
              headerShown: false,
            }} 
          />
        ) : (
          // Render main app screens
          <>
            <Stack.Screen name="auth/user-type" />
            <Stack.Screen name="auth/lawyer-validation" />
            <Stack.Screen name="(client-tabs)" />
            <Stack.Screen name="(lawyer-tabs)" />
            <Stack.Screen name="+not-found" />
          </>
        )}
      </Stack>
      <StatusBar style="auto" />
    </View>
  );
}