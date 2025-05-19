import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { Briefcase, Search } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function UserType() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUserTypeSelection = async (type: 'client' | 'lawyer') => {
    if (type === 'client') {
      router.replace('/(client-tabs)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if lawyer profile exists
      const { data: lawyer, error: lawyerError } = await supabase
        .from('lawyers')
        .select('validation_status')
        .eq('id', user.id)
        .maybeSingle();

      if (lawyerError) throw lawyerError;

      if (!lawyer) {
        // No profile exists, go to validation screen
        router.replace('/auth/lawyer-validation');
      } else if (lawyer.validation_status === 'approved') {
        // Lawyer is approved, go to lawyer dashboard
        router.replace('/(lawyer-tabs)');
      } else if (lawyer.validation_status === 'rejected') {
        // Show error message for rejected lawyers
        setError('Your lawyer profile has been rejected. Please contact support for more information.');
      } else {
        // Show pending message for pending validation
        setError('Your lawyer profile is pending verification. Please check back later.');
      }
    } catch (err: any) {
      console.error('Error checking lawyer status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/logo2.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>Select how you want to use the app</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.option}
          onPress={() => handleUserTypeSelection('client')}
          disabled={loading}
        >
          <Search size={40} color="#7C3AED" />
          <Text style={styles.optionTitle}>Looking for a Lawyer</Text>
          <Text style={styles.optionDescription}>
            Find and connect with legal professionals
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, loading && styles.optionDisabled]}
          onPress={() => handleUserTypeSelection('lawyer')}
          disabled={loading}
        >
          <Briefcase size={40} color="#7C3AED" />
          <Text style={styles.optionTitle}>I am a Lawyer</Text>
          <Text style={styles.optionDescription}>
            {loading ? 'Checking status...' : 'Offer your legal services to clients'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 50,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  option: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  optionDisabled: {
    opacity: 0.7,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});