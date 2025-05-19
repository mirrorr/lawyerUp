import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, Clock, Video } from 'lucide-react-native';

const appointments = [
  {
    id: '1',
    lawyer: 'Sarah Johnson',
    type: 'Video Consultation',
    date: 'Today',
    time: '2:30 PM',
    status: 'upcoming',
  },
  {
    id: '2',
    lawyer: 'Michael Chen',
    type: 'Initial Consultation',
    date: 'Tomorrow',
    time: '10:00 AM',
    status: 'upcoming',
  },
];

export default function Appointments() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Appointments</Text>
      </View>

      <ScrollView style={styles.appointmentsList}>
        {appointments.map((appointment) => (
          <TouchableOpacity key={appointment.id} style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <Text style={styles.lawyerName}>{appointment.lawyer}</Text>
              <View style={[
                styles.statusBadge,
                appointment.status === 'upcoming' && styles.upcomingBadge,
              ]}>
                <Text style={[
                  styles.statusText,
                  appointment.status === 'upcoming' && styles.upcomingText,
                ]}>
                  {appointment.status}
                </Text>
              </View>
            </View>

            <View style={styles.appointmentDetails}>
              <View style={styles.detailRow}>
                <Video size={16} color="#64748b" />
                <Text style={styles.detailText}>{appointment.type}</Text>
              </View>
              <View style={styles.detailRow}>
                <Calendar size={16} color="#64748b" />
                <Text style={styles.detailText}>{appointment.date}</Text>
              </View>
              <View style={styles.detailRow}>
                <Clock size={16} color="#64748b" />
                <Text style={styles.detailText}>{appointment.time}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Meeting</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  appointmentsList: {
    padding: 20,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  lawyerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  upcomingBadge: {
    backgroundColor: '#dbeafe',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    textTransform: 'capitalize',
  },
  upcomingText: {
    color: '#2563eb',
  },
  appointmentDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  joinButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});