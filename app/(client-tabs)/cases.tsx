import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Plus, ChevronRight, Clock, User } from 'lucide-react-native';
import { theme } from '@/constants/theme';

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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!newCase.title.trim() || !newCase.description.trim()) {
        throw new Error('Please fill in all fields');
      }

      const { error: createError } = await supabase
        .from('cases')
        .insert({
          title: newCase.title.trim(),
          description: newCase.description.trim(),
          user_id: user.id
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
            <Plus size={20} color={theme.colors.white} />
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
                    <Clock size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.infoText}>
                      {new Date(case_.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <User size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.infoText}>
                      {case_.lawyer ? case_.lawyer.name : 'No lawyer assigned'}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  newCaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  newCaseButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: theme.colors.white,
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
    color: theme.colors.text.primary,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
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
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginBottom: 16,
  },
});