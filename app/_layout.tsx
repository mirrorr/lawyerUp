import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
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
        setIsLawyer(null);
        setCheckingStatus(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('lawyers')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

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
        {!session?.user ? (
          <Stack.Screen 
            name="auth/sign-in" 
            options={{ 
              headerShown: false,
            }} 
          />
        ) : isLawyer === true ? (
          <Stack.Screen name="(lawyer-tabs)" />
        ) : (
          <>
            <Stack.Screen name="auth/user-type" />
            <Stack.Screen name="auth/lawyer-validation" />
            <Stack.Screen name="(client-tabs)" />
          </>
        )}
      </Stack>
      <StatusBar style="auto" />
    </View>
  );
}