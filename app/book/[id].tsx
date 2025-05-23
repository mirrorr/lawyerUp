import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Calendar, Clock, Video, MapPin } from 'lucide-react-native';
import { theme } from '@/constants/theme';

export default function BookConsultation() {
  const { id } = useLocalSearchParams();
  const [lawyer, setLawyer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [consultationType, setConsultationType] = useState<'video' | 'in-person'>('video');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const availableDates = [
    '2025-05-25',
    '2025-05-26',
    '2025-05-27',
    '2025-05-28',
    '2025-05-29',
  ];

  const availableTimes = [
    '09:00',
    '10:00',
    '11:00',
    '14:00',
    '15:00',
    '16:00',
  ];

  useEffect(() => {
    fetchLawyer();
  }, [id]);

  const fetchLawyer = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('lawyers')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      setLawyer(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching lawyer:', err);
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
          content: `Consultation requested for ${selectedDate} at ${selectedTime}${notes ? `\n\nNotes: ${notes}` : ''}`
        });

      if (messageError) throw messageError;

      router.push(`/chat/${chat.id}`);
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
          <Text style={styles.loadingText}>Loading...</Text>
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
          <Image source={{ uri: lawyer.image_url }} style={styles.lawyerImage} />
          <View style={styles.lawyerInfo}>
            <Text style={styles.lawyerName}>{lawyer.name}</Text>
            <Text style={styles.lawyerSpecialty}>{lawyer.specialty}</Text>
            <View style={styles.locationContainer}>
              <MapPin size={16} color={theme.colors.text.secondary} />
              <Text style={styles.location}>{lawyer.location}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consultation Type</Text>
          <View style={styles.consultationTypes}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                consultationType === 'video' && styles.selectedType
              ]}
              onPress={() => setConsultationType('video')}
            >
              <Video size={24} color={consultationType === 'video' ? theme.colors.white : theme.colors.text.primary} />
              <Text style={[
                styles.typeText,
                consultationType === 'video' && styles.selectedTypeText
              ]}>Video Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                consultationType === 'in-person' && styles.selectedType
              ]}
              onPress={() => setConsultationType('in-person')}
            >
              <MapPin size={24} color={consultationType === 'in-person' ? theme.colors.white : theme.colors.text.primary} />
              <Text style={[
                styles.typeText,
                consultationType === 'in-person' && styles.selectedTypeText
              ]}>In Person</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.dateList}
          >
            {availableDates.map(date => (
              <TouchableOpacity
                key={date}
                style={[
                  styles.dateButton,
                  selectedDate === date && styles.selectedDate
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dateText,
                  selectedDate === date && styles.selectedDateText
                ]}>
                  {new Date(date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeGrid}>
            {availableTimes.map(time => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeButton,
                  selectedTime === time && styles.selectedTime
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Clock 
                  size={16} 
                  color={selectedTime === time ? theme.colors.white : theme.colors.text.primary} 
                />
                <Text style={[
                  styles.timeText,
                  selectedTime === time && styles.selectedTimeText
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional information or questions..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
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
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
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
  lawyerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  lawyerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  lawyerName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  lawyerSpecialty: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  consultationTypes: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
  },
  selectedType: {
    backgroundColor: theme.colors.primary,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  selectedTypeText: {
    color: theme.colors.white,
  },
  dateList: {
    flexGrow: 0,
    marginHorizontal: -4,
  },
  dateButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    marginHorizontal: 4,
  },
  selectedDate: {
    backgroundColor: theme.colors.primary,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  selectedDateText: {
    color: theme.colors.white,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  selectedTime: {
    backgroundColor: theme.colors.primary,
  },
  timeText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  selectedTimeText: {
    color: theme.colors.white,
  },
  notesInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
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
  errorMessage: {
    backgroundColor: theme.colors.error + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});