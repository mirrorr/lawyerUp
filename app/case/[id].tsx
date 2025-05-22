import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Clock, User } from 'lucide-react-native';

export default function CaseDetails() {
  const { id } = useLocalSearchParams();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchCase();
    fetchLawyers();
  }, [id]);

  const fetchCase = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('cases')
        .select(`
          *,
          lawyer:lawyers(
            id,
            name,
            specialty,
            image_url
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      setCaseData(data);
    } catch (err: any) {
      console.error('Error fetching case:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLawyers = async () => {
    try {
      const { data, error } = await supabase
        .from('lawyers')
        .select('id, name, specialty, image_url')
        .eq('validation_status', 'approved')
        .order('name');

      if (error) throw error;
      setLawyers(data || []);
    } catch (err) {
      console.error('Error fetching lawyers:', err);
    }
  };

  const assignLawyer = async (lawyerId: string) => {
    try {
      setAssigning(true);
      const { error: updateError } = await supabase
        .from('cases')
        .update({
          lawyer_id: lawyerId,
          status: 'in_progress'
        })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchCase();
    } catch (err: any) {
      console.error('Error assigning lawyer:', err);
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Case Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading case details...</Text>
        </View>
      </View>
    );
  }

  if (error || !caseData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Case Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Case not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCase}>
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
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Case Details</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.caseHeader}>
          <Text style={styles.caseTitle}>{caseData.title}</Text>
          <View style={[
            styles.statusBadge,
            caseData.status === 'open' && styles.openBadge,
            caseData.status === 'in_progress' && styles.inProgressBadge,
            caseData.status === 'closed' && styles.closedBadge,
          ]}>
            <Text style={[
              styles.statusText,
              caseData.status === 'open' && styles.openText,
              caseData.status === 'in_progress' && styles.inProgressText,
              caseData.status === 'closed' && styles.closedText,
            ]}>
              {caseData.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{caseData.description}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Clock size={16} color="#64748b" />
            <Text style={styles.infoText}>
              Created on {new Date(caseData.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <User size={16} color="#64748b" />
            <Text style={styles.infoText}>
              {caseData.lawyer ? caseData.lawyer.name : 'No lawyer assigned'}
            </Text>
          </View>
        </View>

        {!caseData.lawyer && caseData.status === 'open' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assign a Lawyer</Text>
            <ScrollView style={styles.lawyersList}>
              {lawyers.map((lawyer) => (
                <TouchableOpacity
                  key={lawyer.id}
                  style={styles.lawyerCard}
                  onPress={() => assignLawyer(lawyer.id)}
                  disabled={assigning}
                >
                  <View style={styles.lawyerInfo}>
                    <Text style={styles.lawyerName}>{lawyer.name}</Text>
                    <Text style={styles.lawyerSpecialty}>{lawyer.specialty}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.assignButton, assigning && styles.buttonDisabled]}
                    onPress={() => assignLawyer(lawyer.id)}
                    disabled={assigning}
                  >
                    <Text style={styles.assignButtonText}>
                      {assigning ? 'Assigning...' : 'Assign'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  caseHeader: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
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
  caseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
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
    fontSize: 14,
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
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
  },
  lawyersList: {
    maxHeight: 300,
  },
  lawyerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  lawyerInfo: {
    flex: 1,
  },
  lawyerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  lawyerSpecialty: {
    fontSize: 14,
    color: '#64748b',
  },
  assignButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  assignButtonText: {
    color: '#ffffff',
    fontSize: 14,
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
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});