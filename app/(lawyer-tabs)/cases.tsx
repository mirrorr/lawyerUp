import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Clock, User, ChevronRight } from 'lucide-react-native';
import { theme } from '@/constants/theme';

export default function LawyerCases() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .eq('lawyer_id', user.id)
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;
      setCases(data || []);
    } catch (err: any) {
      console.error('Error fetching cases:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Cases</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading cases...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Cases</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCases}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cases</Text>
      </View>

      <ScrollView style={styles.content}>
        {cases.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No cases assigned yet</Text>
            <Text style={styles.emptySubtext}>
              Cases will appear here when clients assign them to you
            </Text>
          </View>
        ) : (
          cases.map((case_) => (
            <TouchableOpacity
              key={case_.id}
              style={styles.caseCard}
              onPress={() => router.push(`/case/${case_.id}`)}
            >
              <View style={styles.caseHeader}>
                <Text style={styles.caseTitle}>{case_.title}</Text>
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
              </View>
              
              <Text style={styles.caseDescription} numberOfLines={2}>
                {case_.description}
              </Text>

              <View style={styles.caseFooter}>
                <View style={styles.caseInfo}>
                  <View style={styles.infoItem}>
                    <Clock size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.infoText}>
                      {new Date(case_.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <User size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.infoText}>
                      Client #{case_.user_id.slice(0, 8)}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={theme.colors.text.secondary} />
              </View>
            </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  caseCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
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
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  caseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openBadge: {
    backgroundColor: theme.colors.info + '20',
  },
  inProgressBadge: {
    backgroundColor: theme.colors.warning + '20',
  },
  closedBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  openText: {
    color: theme.colors.info,
  },
  inProgressText: {
    color: theme.colors.warning,
  },
  closedText: {
    color: theme.colors.success,
  },
  caseDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caseInfo: {
    flex: 1,
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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