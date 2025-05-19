import { useEffect } from 'react';
import { View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { supabase } from '@/lib/supabase';

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
          // Show loading screen while checking auth
          <Stack.Screen name="(loading)" options={{ headerShown: false }} />
        ) : !session?.user ? (
          // Redirect to sign in if no authenticated user
          <Stack.Screen 
            name="auth/sign-in"
            options={{
              headerShown: false,
            }}
          />
        ) : (
          // Show all other screens when authenticated
          <>
            <Stack.Screen name="auth/sign-up" />
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