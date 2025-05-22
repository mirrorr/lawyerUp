import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Plus, ChevronRight, Clock, User } from 'lucide-react-native';

export default function Cases() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<any[]>([]);
  const [showNewCaseForm, setShowNewCaseForm] = useState(false);
  const [newCase, setNewCase] = useState({
    title: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
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
        await fetchCases();
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          lawyer:lawyers(
            id,
            name,
            specialty
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError('Failed to load cases');
    }
  };

  const handleCreateCase = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (!newCase.title.trim() || !newCase.description.trim()) {
        throw new Error('Please fill in all fields');
      }

      const { error: createError } = await supabase
        .from('cases')
        .insert({
          title: newCase.title.trim(),
          description: newCase.description.trim(),
        });

      if (createError) throw createError;

      setNewCase({ title: '', description: '' });
      setShowNewCaseForm(false);
      await fetchCases();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Cases</Text>
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
          <Text style={styles.title}>Cases</Text>
        </View>
        <View style={styles.notAuthenticatedContainer}>
          <Text style={styles.notAuthenticatedText}>
            Sign in to manage your legal cases and connect with lawyers
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
        <Text style={styles.title}>Cases</Text>
        {!showNewCaseForm && (
          <TouchableOpacity
            style={styles.newCaseButton}
            onPress={() => setShowNewCaseForm(true)}
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.newCaseButtonText}>New Case</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {showNewCaseForm && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Create New Case</Text>
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={newCase.title}
                onChangeText={(text) => setNewCase(prev => ({ ...prev, title: text }))}
                placeholder="Enter case title"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newCase.description}
                onChangeText={(text) => setNewCase(prev => ({ ...prev, description: text }))}
                placeholder="Describe your case"
                multiline
                numberOfLines={4}
              />
            </View>
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowNewCaseForm(false);
                  setError(null);
                  setNewCase({ title: '', description: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.buttonDisabled]}
                onPress={handleCreateCase}
                disabled={submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Creating...' : 'Create Case'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {cases.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No cases yet</Text>
            <Text style={styles.emptySubtext}>
              Create a new case to get started and connect with lawyers
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
                    <Clock size={16} color="#64748b" />
                    <Text style={styles.infoText}>
                      {new Date(case_.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <User size={16} color="#64748b" />
                    <Text style={styles.infoText}>
                      {case_.lawyer ? case_.lawyer.name : 'No lawyer assigned'}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#64748b" />
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
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  newCaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  newCaseButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
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
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  caseCard: {
    backgroundColor: '#ffffff',
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
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  caseDescription: {
    fontSize: 14,
    color: '#64748b',
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
  notAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notAuthenticatedText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
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
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 16,
  },
});