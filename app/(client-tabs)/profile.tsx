import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Settings, Bell, Shield, CreditCard, CircleHelp as HelpCircle, LogOut, Briefcase } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
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
    title: 'Payment Methods',
    route: '/payment',
  },
  {
    icon: HelpCircle,
    title: 'Help & Support',
    route: '/support',
  },
];

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lawyerStatus, setLawyerStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Check lawyer status
        const { data: lawyer } = await supabase
          .from('lawyers')
          .select('validation_status')
          .eq('id', user.id)
          .maybeSingle();

        setLawyerStatus(lawyer ? lawyer.validation_status : 'none');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/sign-in');
  };

  const handleLawyerSwitch = () => {
    if (!user) {
      router.push('/auth/sign-in');
      return;
    }

    switch (lawyerStatus) {
      case 'none':
        router.push('/auth/lawyer-validation');
        break;
      case 'approved':
        router.replace('/(lawyer-tabs)');
        break;
      case 'pending':
        // Do nothing, show pending status
        break;
      case 'rejected':
        // Do nothing, show rejected status
        break;
    }
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

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.notAuthenticatedContainer}>
          <Text style={styles.notAuthenticatedText}>
            Sign in to access your profile and manage your account
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
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' }}
            style={styles.profileImage}
          />
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.userTypeBadge}>
            <Text style={styles.userTypeText}>Client</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.lawyerSwitchButton,
            lawyerStatus === 'approved' && styles.lawyerSwitchButtonApproved,
            lawyerStatus === 'rejected' && styles.lawyerSwitchButtonRejected,
          ]} 
          onPress={handleLawyerSwitch}
          disabled={lawyerStatus === 'pending' || lawyerStatus === 'rejected'}
        >
          <Briefcase size={20} color={lawyerStatus === 'approved' ? theme.colors.white : theme.colors.text.primary} />
          <View style={styles.lawyerSwitchContent}>
            <Text style={[
              styles.lawyerSwitchTitle,
              lawyerStatus === 'approved' && styles.lawyerSwitchTitleApproved,
            ]}>
              {lawyerStatus === 'none' && 'Become a Lawyer'}
              {lawyerStatus === 'pending' && 'Lawyer Verification Pending'}
              {lawyerStatus === 'approved' && 'Switch to Lawyer View'}
              {lawyerStatus === 'rejected' && 'Lawyer Verification Rejected'}
            </Text>
            <Text style={styles.lawyerSwitchDescription}>
              {lawyerStatus === 'none' && 'Create your lawyer profile and start helping clients'}
              {lawyerStatus === 'pending' && 'Your lawyer profile is being reviewed'}
              {lawyerStatus === 'approved' && 'Access your lawyer dashboard'}
              {lawyerStatus === 'rejected' && 'Contact support for more information'}
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme.colors.white,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
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
  email: {
    fontSize: 18,
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  userTypeBadge: {
    backgroundColor: theme.colors.info + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  userTypeText: {
    color: theme.colors.info,
    fontSize: 14,
    fontWeight: '500',
  },
  lawyerSwitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    marginTop: 16,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    gap: 12,
  },
  lawyerSwitchButtonApproved: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  lawyerSwitchButtonRejected: {
    backgroundColor: theme.colors.error + '20',
    borderColor: theme.colors.error + '20',
  },
  lawyerSwitchContent: {
    flex: 1,
  },
  lawyerSwitchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  lawyerSwitchTitleApproved: {
    color: theme.colors.white,
  },
  lawyerSwitchDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  menuSection: {
    backgroundColor: theme.colors.white,
    marginTop: 16,
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
});