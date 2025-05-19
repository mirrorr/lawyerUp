import { useEffect } from 'react';
import { View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useState } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export default function RootLayout() {
  useFrameworkReady();
  const { session, loading } = useAuth();
  const [isLawyer, setIsLawyer] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    window.frameworkReady?.();
  }, []);

  useEffect(() => {
    async function checkLawyerStatus() {
      if (!session?.user) {
        setCheckingStatus(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('lawyers')
          .select('id')
          .eq('id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        setIsLawyer(!!data);
      } catch (err) {
        console.error('Error checking lawyer status:', err);
        setIsLawyer(false);
      } finally {
        setCheckingStatus(false);
      }
    }

    checkLawyerStatus();
  }, [session]);

  if (loading || checkingStatus) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        {!session ? (
          // Not authenticated - show sign in
          <Stack.Screen 
            name="auth/sign-in" 
            options={{ 
              headerShown: false,
            }} 
          />
        ) : isLawyer ? (
          // User is a lawyer - show lawyer tabs
          <Stack.Screen name="(lawyer-tabs)" />
        ) : (
          // User is not a lawyer - show client flow
          <>
            <Stack.Screen name="auth/user-type" />
            <Stack.Screen name="auth/lawyer-validation" />
            <Stack.Screen name="(client-tabs)" />
          </>
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </View>
  );
}