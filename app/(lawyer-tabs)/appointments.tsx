import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { Calendar, Clock, Video, MapPin } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';

export default function LawyerAppointments() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('lawyer_id', user.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (appointmentsError) throw appointmentsError;
      setAppointments(data || []);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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
          <Text style={styles.loadingText}>Loading appointments...</Text>
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
          </View>
        ) : (
          appointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientId}>Client #{appointment.user_id.slice(0, 8)}</Text>
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
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                    >
                      <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
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
    marginBottom: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientId: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmButton: {
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.success,
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
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});