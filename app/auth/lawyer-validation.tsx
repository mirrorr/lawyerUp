import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react-native';

export default function LawyerValidation() {
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    licenseNumber: '',
    experience: '',
    education: '',
    languages: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      const requiredFields = ['name', 'specialty', 'licenseNumber', 'experience', 'education', 'languages'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const lawyerData = {
        id: user.id,
        name: formData.name,
        specialty: formData.specialty,
        license_number: formData.licenseNumber,
        experience: formData.experience,
        education: formData.education,
        languages: formData.languages.split(',').map(lang => lang.trim()),
        image_url: 'https://images.pexels.com/photos/5668770/pexels-photo-5668770.jpeg',
        location: 'Not specified',
        about: 'Professional lawyer with extensive experience.',
        consultation_fee: 'Contact for details',
        availability: 'Available',
        rating: 0,
        reviews_count: 0,
        validation_status: 'pending'
      };

      const { error: upsertError } = await supabase
        .from('lawyers')
        .upsert(lawyerData);

      if (upsertError) throw upsertError;

      // Force a reload to update the lawyer status and trigger proper routing
      window.location.href = '/(lawyer-tabs)';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile Validation</Text>
        <Text style={styles.subtitle}>Please provide your professional details</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Enter your full name"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Specialty *</Text>
          <TextInput
            style={styles.input}
            value={formData.specialty}
            onChangeText={(text) => setFormData(prev => ({ ...prev, specialty: text }))}
            placeholder="e.g., Criminal Law, Family Law"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>License Number *</Text>
          <TextInput
            style={styles.input}
            value={formData.licenseNumber}
            onChangeText={(text) => setFormData(prev => ({ ...prev, licenseNumber: text }))}
            placeholder="Enter your license number"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Years of Experience *</Text>
          <TextInput
            style={styles.input}
            value={formData.experience}
            onChangeText={(text) => setFormData(prev => ({ ...prev, experience: text }))}
            placeholder="e.g., 5+ years"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Education *</Text>
          <TextInput
            style={styles.input}
            value={formData.education}
            onChangeText={(text) => setFormData(prev => ({ ...prev, education: text }))}
            placeholder="Enter your educational background"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Languages *</Text>
          <TextInput
            style={styles.input}
            value={formData.languages}
            onChangeText={(text) => setFormData(prev => ({ ...prev, languages: text }))}
            placeholder="e.g., English, Spanish (comma-separated)"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 16,
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
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  button: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    margin: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
});