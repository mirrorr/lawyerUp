import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { Settings, Bell, Shield, CreditCard, CircleHelp as HelpCircle, LogOut, User, Calendar, CreditCard as Edit2, Plus, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';

const menuItems = [
  {
    icon: Settings,
    title: 'Account Settings',
    route: '/settings',
  },
  {
    icon: Bell,
    title: 'Notifications',
    route: '/notifications',
  },
  {
    icon: Shield,
    title: 'Privacy & Security',
    route: '/privacy',
  },
  {
    icon: CreditCard,
    title: 'Payment Settings',
    route: '/payment',
  },
  {
    icon: HelpCircle,
    title: 'Help & Support',
    route: '/support',
  },
];

export default function LawyerProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [proBonoPeriods, setProBonoPeriods] = useState<any[]>([]);
  const [showAddProBono, setShowAddProBono] = useState(false);
  const [newProBono, setNewProBono] = useState({
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchProfile();
    fetchProBonoPeriods();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: profileError } = await supabase
        .from('lawyers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(data);
      setEditedProfile(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching lawyer profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProBonoPeriods = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pro_bono_periods')
        .select('*')
        .eq('lawyer_id', user.id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setProBonoPeriods(data || []);
    } catch (err) {
      console.error('Error fetching pro bono periods:', err);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const { error: updateError } = await supabase
        .from('lawyers')
        .update(editedProfile)
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile(editedProfile);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddProBono = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('pro_bono_periods')
        .insert({
          lawyer_id: user.id,
          start_date: newProBono.start_date,
          end_date: newProBono.end_date,
        });

      if (error) throw error;

      setShowAddProBono(false);
      setNewProBono({ start_date: '', end_date: '' });
      await fetchProBonoPeriods();
    } catch (err: any) {
      console.error('Error adding pro bono period:', err);
      setError(err.message);
    }
  };

  const handleDeleteProBono = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pro_bono_periods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProBonoPeriods();
    } catch (err) {
      console.error('Error deleting pro bono period:', err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/sign-in');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        {!isEditing && (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Edit2 size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: profile.image_url }}
            style={styles.profileImage}
          />
          {isEditing ? (
            <View style={styles.editForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.name}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, name: text }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Specialty</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.specialty}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, specialty: text }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.location}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, location: text }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Experience</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.experience}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, experience: text }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Education</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.education}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, education: text }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Languages (comma-separated)</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.languages.join(', ')}
                  onChangeText={(text) => setEditedProfile(prev => ({ 
                    ...prev, 
                    languages: text.split(',').map(lang => lang.trim()) 
                  }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Consultation Fee</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.consultation_fee}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, consultation_fee: text }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>About</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editedProfile.about}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, about: text }))}
                  multiline
                  numberOfLines={4}
                />
              </View>
              <View style={styles.editActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsEditing(false);
                    setEditedProfile(profile);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveButton, saving && styles.buttonDisabled]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  <Text style={styles.saveButtonText}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.specialty}>{profile.specialty}</Text>
              <View style={[
                styles.validationStatus,
                profile.validation_status === 'approved' && styles.approvedStatus,
                profile.validation_status === 'rejected' && styles.rejectedStatus,
              ]}>
                <Text style={[
                  styles.validationText,
                  profile.validation_status === 'approved' && styles.approvedText,
                  profile.validation_status === 'rejected' && styles.rejectedText,
                ]}>
                  {profile.validation_status.charAt(0).toUpperCase() + profile.validation_status.slice(1)}
                </Text>
              </View>
            </>
          )}
        </View>

        {!isEditing && (
          <>
            <View style={styles.statsSection}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.rating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.reviews_count}</Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{profile.location}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Experience</Text>
                <Text style={styles.infoValue}>{profile.experience}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Languages</Text>
                <Text style={styles.infoValue}>{profile.languages.join(', ')}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Education</Text>
                <Text style={styles.infoValue}>{profile.education}</Text>
              </View>
            </View>
          </>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pro Bono Periods</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddProBono(true)}
            >
              <Plus size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {showAddProBono && (
            <View style={styles.addProBonoForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Start Date</Text>
                <TextInput
                  style={styles.input}
                  value={newProBono.start_date}
                  onChangeText={(text) => setNewProBono(prev => ({ ...prev, start_date: text }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>End Date</Text>
                <TextInput
                  style={styles.input}
                  value={newProBono.end_date}
                  onChangeText={(text) => setNewProBono(prev => ({ ...prev, end_date: text }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={styles.editActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddProBono(false);
                    setNewProBono({ start_date: '', end_date: '' });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleAddProBono}
                >
                  <Text style={styles.saveButtonText}>Add Period</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {proBonoPeriods.map((period) => (
            <View key={period.id} style={styles.proBonoPeriod}>
              <View style={styles.periodInfo}>
                <Calendar size={16} color={theme.colors.text.secondary} />
                <Text style={styles.periodText}>
                  {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteProBono(period.id)}
              >
                <X size={16} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))}

          {proBonoPeriods.length === 0 && !showAddProBono && (
            <Text style={styles.noPeriodsText}>No pro bono periods set</Text>
          )}
        </View>

        <TouchableOpacity 
          style={styles.clientSwitchButton} 
          onPress={() => router.replace('/(client-tabs)')}
        >
          <User size={20} color={theme.colors.text.primary} />
          <View style={styles.clientSwitchContent}>
            <Text style={styles.clientSwitchTitle}>Switch to Client View</Text>
            <Text style={styles.clientSwitchDescription}>
              Browse and connect with other lawyers
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem}>
              <View style={styles.menuItemContent}>
                <item.icon size={20} color={theme.colors.text.secondary} />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={[styles.menuItem, styles.logoutButton]} onPress={handleSignOut}>
            <View style={styles.menuItemContent}>
              <LogOut size={20} color={theme.colors.error} />
              <Text style={[styles.menuItemText, styles.logoutText]}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme.colors.white,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.white,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  editForm: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
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
  editActions: {
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
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  specialty: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  validationStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
  },
  approvedStatus: {
    backgroundColor: theme.colors.success + '20',
  },
  rejectedStatus: {
    backgroundColor: theme.colors.error + '20',
  },
  validationText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  approvedText: {
    color: theme.colors.success,
  },
  rejectedText: {
    color: theme.colors.error,
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    marginTop: 12,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
    marginHorizontal: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  infoSection: {
    backgroundColor: theme.colors.white,
    marginTop: 12,
    padding: 20,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  section: {
    backgroundColor: theme.colors.white,
    marginTop: 12,
    padding: 20,
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
    color: theme.colors.text.primary,
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  addProBonoForm: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  proBonoPeriod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  periodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  deleteButton: {
    padding: 8,
  },
  noPeriodsText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  clientSwitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    marginTop: 12,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    gap: 12,
  },
  clientSwitchContent: {
    flex: 1,
  },
  clientSwitchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  clientSwitchDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  menuSection: {
    backgroundColor: theme.colors.white,
    marginTop: 12,
    paddingHorizontal: 20,
  },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginLeft: 12,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: theme.colors.error,
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
});