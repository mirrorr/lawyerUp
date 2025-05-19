import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Settings, Bell, Shield, CreditCard, CircleHelp as HelpCircle, LogOut } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';

export default function LawyerProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: profileError } = await supabase
        .from('lawyers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: profile.image_url }}
            style={styles.profileImage}
          />
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.specialty}>{profile.specialty}</Text>
          <View style={styles.validationStatus}>
            <Text style={[
              styles.validationText,
              profile.validation_status === 'approved' && styles.approvedText,
              profile.validation_status === 'rejected' && styles.rejectedText,
            ]}>
              {profile.validation_status.charAt(0).toUpperCase() + profile.validation_status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <Settings size={20} color="#64748b" />
              <Text style={styles.menuItemText}>Account Settings</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <Bell size={20} color="#64748b" />
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <Shield size={20} color="#64748b" />
              <Text style={styles.menuItemText}>Privacy & Security</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <CreditCard size={20} color="#64748b" />
              <Text style={styles.menuItemText}>Payment Settings</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <HelpCircle size={20} color="#64748b" />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.logoutButton]} onPress={handleSignOut}>
            <View style={styles.menuItemContent}>
              <LogOut size={20} color="#ef4444" />
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
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 12,
  },
  validationStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  validationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  approvedText: {
    color: '#059669',
  },
  rejectedText: {
    color: '#ef4444',
  },
  menuSection: {
    backgroundColor: '#ffffff',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#ef4444',
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