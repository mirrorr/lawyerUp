import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Calendar, Star, Clock } from 'lucide-react-native';

export default function LawyerDashboard() {
  const [stats, setStats] = useState({
    totalChats: 0,
    pendingAppointments: 0,
    rating: 0,
    reviewsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch lawyer profile
      const { data: lawyer, error: lawyerError } = await supabase
        .from('lawyers')
        .select('rating, reviews_count')
        .eq('id', user.id)
        .single();

      if (lawyerError) throw lawyerError;

      // Fetch total chats
      const { count: chatsCount, error: chatsError } = await supabase
        .from('chats')
        .select('id', { count: 'exact' })
        .eq('lawyer_id', user.id);

      if (chatsError) throw chatsError;

      setStats({
        totalChats: chatsCount || 0,
        pendingAppointments: 0, // Will be implemented when appointments feature is added
        rating: lawyer?.rating || 0,
        reviewsCount: lawyer?.reviews_count || 0,
      });
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/logo2.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/logo2.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/logo2.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MessageSquare size={24} color="#2563eb" />
            <Text style={styles.statValue}>{stats.totalChats}</Text>
            <Text style={styles.statLabel}>Active Chats</Text>
          </View>

          <View style={styles.statCard}>
            <Calendar size={24} color="#059669" />
            <Text style={styles.statValue}>{stats.pendingAppointments}</Text>
            <Text style={styles.statLabel}>Pending Appointments</Text>
          </View>

          <View style={styles.statCard}>
            <Star size={24} color="#fbbf24" />
            <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Average Rating</Text>
          </View>

          <View style={styles.statCard}>
            <Clock size={24} color="#7c3aed" />
            <Text style={styles.statValue}>{stats.reviewsCount}</Text>
            <Text style={styles.statLabel}>Total Reviews</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No recent activity</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No upcoming appointments</Text>
          </View>
        </View>
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
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 50,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statCard: {
    width: '50%',
    padding: 8,
  },
  statCardInner: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
});