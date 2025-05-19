import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function MainLayout() {
  const { session, loading } = useAuth();
  const [isLawyer, setIsLawyer] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

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
          .select('id, validation_status')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        
        // Only set as lawyer if profile exists and is approved
        setIsLawyer(!!data && data.validation_status === 'approved');
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
          // Authentication flow
          <>
            <Stack.Screen name="auth/sign-in" />
            <Stack.Screen name="auth/sign-up" />
          </>
        ) : isLawyer === true ? (
          // Lawyer flow
          <Stack.Screen name="(lawyer-tabs)" />
        ) : (
          // Client flow or lawyer validation
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