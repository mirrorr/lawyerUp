import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Calendar, Star, Clock, Briefcase } from 'lucide-react-native';
import { router } from 'expo-router';

export default function LawyerDashboard() {
  const [stats, setStats] = useState({
    totalChats: 0,
    pendingAppointments: 0,
    rating: 0,
    reviewsCount: 0,
    activeCases: 0,
    openCases: 0,
    closedCases: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentCases, setRecentCases] = useState<any[]>([]);

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

      // Fetch case statistics
      const { data: cases, error: casesError } = await supabase
        .from('cases')
        .select('id, title, status, created_at')
        .eq('lawyer_id', user.id)
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;

      const activeCases = cases?.filter(c => c.status === 'in_progress').length || 0;
      const openCases = cases?.filter(c => c.status === 'open').length || 0;
      const closedCases = cases?.filter(c => c.status === 'closed').length || 0;

      setStats({
        totalChats: chatsCount || 0,
        pendingAppointments: 0,
        rating: lawyer?.rating || 0,
        reviewsCount: lawyer?.reviews_count || 0,
        activeCases,
        openCases,
        closedCases,
      });

      setRecentCases(cases?.slice(0, 5) || []);
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
          <Text style={styles.sectionTitle}>Case Overview</Text>
          <View style={styles.caseStats}>
            <View style={[styles.caseStat, styles.activeCase]}>
              <Text style={styles.caseStatValue}>{stats.activeCases}</Text>
              <Text style={styles.caseStatLabel}>Active Cases</Text>
            </View>
            <View style={[styles.caseStat, styles.openCase]}>
              <Text style={styles.caseStatValue}>{stats.openCases}</Text>
              <Text style={styles.caseStatLabel}>Open Cases</Text>
            </View>
            <View style={[styles.caseStat, styles.closedCase]}>
              <Text style={styles.caseStatValue}>{stats.closedCases}</Text>
              <Text style={styles.caseStatLabel}>Closed Cases</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Cases</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/(lawyer-tabs)/cases')}
            >
              <Text style={styles.viewAllButtonText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentCases.length > 0 ? (
            recentCases.map((case_) => (
              <TouchableOpacity
                key={case_.id}
                style={styles.caseCard}
                onPress={() => router.push(`/case/${case_.id}`)}
              >
                <View style={styles.caseCardHeader}>
                  <Briefcase size={20} color="#64748b" />
                  <Text style={styles.caseTitle}>{case_.title}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  case_.status === 'open' && styles.openBadge,
                  case_.status === 'in_progress' && styles.inProgressBadge,
                  case_.status === 'closed' && styles.closedBadge,
                ]}>
                  <Text style={[
                    styles.statusText,
                    case_.status === 'open' && styles.openText,
                    case_.status === 'in_progress' && styles.inProgressText,
                    case_.status === 'closed' && styles.closedText,
                  ]}>
                    {case_.status.replace('_', ' ')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent cases</Text>
            </View>
          )}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  viewAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  viewAllButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  caseStats: {
    flexDirection: 'row',
    gap: 12,
  },
  caseStat: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeCase: {
    backgroundColor: '#fef3c7',
  },
  openCase: {
    backgroundColor: '#dbeafe',
  },
  closedCase: {
    backgroundColor: '#dcfce7',
  },
  caseStatValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  caseStatLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  caseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  caseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  caseTitle: {
    fontSize: 16,
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  openBadge: {
    backgroundColor: '#dbeafe',
  },
  inProgressBadge: {
    backgroundColor: '#fef3c7',
  },
  closedBadge: {
    backgroundColor: '#dcfce7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  openText: {
    color: '#2563eb',
  },
  inProgressText: {
    color: '#d97706',
  },
  closedText: {
    color: '#059669',
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