import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { Calendar, Clock, Video, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';

export default function Appointments() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (user) {
        await fetchAppointments();
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          lawyer:lawyers(
            id,
            name,
            specialty,
            image_url,
            location
          )
        `)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (appointmentsError) throw appointmentsError;
      setAppointments(data || []);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.message);
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      await fetchAppointments();
    } catch (err: any) {
      console.error('Error updating appointment:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Appointments</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Appointments</Text>
        </View>
        <View style={styles.notAuthenticatedContainer}>
          <Text style={styles.notAuthenticatedText}>
            Sign in to schedule and manage your appointments with lawyers
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
        <Text style={styles.title}>Appointments</Text>
      </View>

      <ScrollView style={styles.appointmentsList}>
        {appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No appointments scheduled</Text>
            <Text style={styles.emptySubtext}>
              Find a lawyer and schedule a consultation to get started
            </Text>
          </View>
        ) : (
          appointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <Image 
                  source={{ uri: appointment.lawyer.image_url }} 
                  style={styles.lawyerImage} 
                />
                <View style={styles.lawyerInfo}>
                  <Text style={styles.lawyerName}>{appointment.lawyer.name}</Text>
                  <Text style={styles.lawyerSpecialty}>{appointment.lawyer.specialty}</Text>
                  <View style={styles.locationContainer}>
                    <MapPin size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.location}>{appointment.lawyer.location}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.appointmentDetails}>
                <View style={styles.detailRow}>
                  <Calendar size={16} color={theme.colors.text.secondary} />
                  <Text style={styles.detailText}>
                    {new Date(appointment.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={16} color={theme.colors.text.secondary} />
                  <Text style={styles.detailText}>{appointment.time}</Text>
                </View>
                <View style={styles.detailRow}>
                  {appointment.type === 'video' ? (
                    <Video size={16} color={theme.colors.text.secondary} />
                  ) : (
                    <MapPin size={16} color={theme.colors.text.secondary} />
                  )}
                  <Text style={styles.detailText}>
                    {appointment.type === 'video' ? 'Video Call' : 'In Person'}
                  </Text>
                </View>
              </View>

              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusBadge,
                  appointment.status === 'pending' && styles.pendingBadge,
                  appointment.status === 'confirmed' && styles.confirmedBadge,
                  appointment.status === 'cancelled' && styles.cancelledBadge,
                ]}>
                  <Text style={[
                    styles.statusText,
                    appointment.status === 'pending' && styles.pendingText,
                    appointment.status === 'confirmed' && styles.confirmedText,
                    appointment.status === 'cancelled' && styles.cancelledText,
                  ]}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </Text>
                </View>

                {appointment.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>

              {appointment.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{appointment.notes}</Text>
                </View>
              )}
            </View>
          ))
        )}
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme.colors.white,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  appointmentsList: {
    padding: 20,
  },
  appointmentCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  appointmentHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  lawyerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  lawyerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  lawyerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  lawyerSpecialty: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
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
  appointmentDetails: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: theme.colors.warning + '20',
  },
  confirmedBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  cancelledBadge: {
    backgroundColor: theme.colors.error + '20',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pendingText: {
    color: theme.colors.warning,
  },
  confirmedText: {
    color: theme.colors.success,
  },
  cancelledText: {
    color: theme.colors.error,
  },
  cancelButton: {
    backgroundColor: theme.colors.error + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.error,
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});