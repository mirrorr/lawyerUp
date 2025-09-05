import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, Video, MapPin, ArrowLeft } from 'lucide-react-native';
import { theme } from '@/constants/theme';

export default function BookConsultation() {
  const { id } = useLocalSearchParams();
  const [lawyer, setLawyer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState<'video' | 'in-person'>('video');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    fetchLawyer();
  }, [id]);

  const checkAuthStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    } catch (err) {
      console.error('Error checking auth status:', err);
    }
  };

  const fetchLawyer = async () => {
    try {
      setLoading(true);
      const { data, error: lawyerError } = await supabase
        .from('lawyers')
        .select('*')
        .eq('id', id)
        .single();

      if (lawyerError) throw lawyerError;
      setLawyer(data);
    } catch (err: any) {
      console.error('Error fetching lawyer:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!selectedDate || !selectedTime) {
        setError('Please select both date and time');
        return;
      }

      setSubmitting(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/sign-in');
        return;
      }

      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          lawyer_id: id,
          user_id: user.id,
          date: selectedDate,
          time: selectedTime,
          type: consultationType,
          notes: notes,
          status: 'pending'
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Create a chat for communication
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          lawyer_id: id,
          user_id: user.id,
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Send initial message about consultation
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chat.id,
          sender_id: user.id,
          content: `Consultation scheduled for ${selectedDate} at ${selectedTime}${notes ? `\n\nNotes: ${notes}` : ''}`
        });

      if (messageError) throw messageError;

      router.push('/appointments');
    } catch (err: any) {
      console.error('Error scheduling consultation:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule Consultation</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading lawyer details...</Text>
        </View>
      </View>
    );
  }

  if (error || !lawyer) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule Consultation</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Lawyer not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLawyer}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule Consultation</Text>
        </View>
        <View style={styles.notAuthenticatedContainer}>
          <Text style={styles.notAuthenticatedText}>
            Please sign in to schedule a consultation
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/auth/sign-in')}
          >
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Consultation</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.lawyerCard}>
          <Text style={styles.lawyerName}>{lawyer.name}</Text>
          <Text style={styles.lawyerSpecialty}>{lawyer.specialty}</Text>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={theme.colors.text.secondary} />
            <Text style={styles.location}>{lawyer.location}</Text>
          </View>
          <Text style={styles.consultationFee}>
            Consultation Fee: {lawyer.consultation_fee}
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <TextInput
            style={styles.input}
            value={selectedDate}
            onChangeText={setSelectedDate}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <TextInput
            style={styles.input}
            value={selectedTime}
            onChangeText={setSelectedTime}
            placeholder="HH:MM"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Consultation Type</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                consultationType === 'video' && styles.selectedTypeButton
              ]}
              onPress={() => setConsultationType('video')}
            >
              <Video 
                size={20} 
                color={consultationType === 'video' ? theme.colors.white : theme.colors.text.primary} 
              />
              <Text style={[
                styles.typeButtonText,
                consultationType === 'video' && styles.selectedTypeButtonText
              ]}>
                Video Call
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                consultationType === 'in-person' && styles.selectedTypeButton
              ]}
              onPress={() => setConsultationType('in-person')}
            >
              <MapPin 
                size={20} 
                color={consultationType === 'in-person' ? theme.colors.white : theme.colors.text.primary} 
              />
              <Text style={[
                styles.typeButtonText,
                consultationType === 'in-person' && styles.selectedTypeButtonText
              ]}>
                In Person
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional information or questions..."
            multiline
            numberOfLines={4}
          />
        </View>

        {error && (
          <View style={styles.errorMessage}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Scheduling...' : 'Schedule Consultation'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  lawyerCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  lawyerName: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  lawyerSpecialty: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 8,
  },
  consultationFee: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  selectedTypeButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  selectedTypeButtonText: {
    color: theme.colors.white,
  },
  errorMessage: {
    backgroundColor: theme.colors.error + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  notAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notAuthenticatedText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  loginButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});