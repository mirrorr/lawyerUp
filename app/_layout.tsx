import { useEffect } from 'react';
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

  if (loading) {
    return null;
  }

  return (
    <>
      {!session ? (
        <Redirect href="/auth/sign-in" />
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      )}
      <StatusBar style="auto" />
    </>
  );
}