import { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, Link, useRouter } from 'expo-router';
import { MapPin, Star, MessageSquare, Calendar, Clock, Briefcase, Award, Globe, ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Lawyer {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews_count: number;
  image_url: string;
  location: string;
  experience: string;
  languages: string[];
  education: string;
  consultation_fee: string;
  availability: string;
  about: string;
}

export default function LawyerProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState(false);

  useEffect(() => {
    fetchLawyer();
  }, [id]);

  const fetchLawyer = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('lawyers')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Lawyer not found');

      setLawyer(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching lawyer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    try {
      setCreatingChat(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/sign-in');
        return;
      }

      // Check if chat already exists
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('lawyer_id', id)
        .eq('user_id', user.id)
        .single();

      if (existingChat) {
        router.push(`/chat/${existingChat.id}`);
        return;
      }

      // Create new chat
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          lawyer_id: id,
          user_id: user.id,
        })
        .select()
        .single();

      if (chatError) throw chatError;

      router.push(`/chat/${newChat.id}`);
    } catch (err) {
      console.error('Error creating chat:', err);
      setError('Failed to start chat. Please try again.');
    } finally {
      setCreatingChat(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.navigationHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lawyer Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading lawyer profile...</Text>
        </View>
      </View>
    );
  }

  if (error || !lawyer) {
    return (
      <View style={styles.container}>
        <View style={styles.navigationHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lawyer Profile</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Lawyer not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLawyer}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lawyer Profile</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Image source={{ uri: lawyer.image_url }} style={styles.profileImage} />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{lawyer.name}</Text>
            <Text style={styles.specialty}>{lawyer.specialty}</Text>
            <View style={styles.locationContainer}>
              <MapPin size={16} color="#64748b" />
              <Text style={styles.location}>{lawyer.location}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Star size={16} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.rating}>{lawyer.rating}</Text>
              <Text style={styles.reviews}>({lawyer.reviews_count} reviews)</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Briefcase size={20} color="#64748b" />
              <Text style={styles.infoLabel}>Experience</Text>
              <Text style={styles.infoValue}>{lawyer.experience}</Text>
            </View>
            <View style={styles.infoItem}>
              <Clock size={20} color="#64748b" />
              <Text style={styles.infoLabel}>Consultation Fee</Text>
              <Text style={styles.infoValue}>{lawyer.consultation_fee}</Text>
            </View>
            <View style={styles.infoItem}>
              <Globe size={20} color="#64748b" />
              <Text style={styles.infoLabel}>Languages</Text>
              <Text style={styles.infoValue}>{lawyer.languages.join(', ')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Award size={20} color="#64748b" />
              <Text style={styles.infoLabel}>Education</Text>
              <Text style={styles.infoValue}>{lawyer.education}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.about}>{lawyer.about}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.button, styles.messageButton, creatingChat && styles.buttonDisabled]}
            onPress={handleStartChat}
            disabled={creatingChat}
          >
            <MessageSquare size={20} color="#ffffff" />
            <Text style={styles.buttonText}>
              {creatingChat ? 'Starting Chat...' : 'Start Chat'}
            </Text>
          </TouchableOpacity>
          <Link href={`/book/${lawyer.id}`} style={Platform.select({ web: { textDecoration: 'none' } })}>
            <TouchableOpacity style={[styles.button, styles.scheduleButton]}>
              <Calendar size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Schedule Consultation</Text>
            </TouchableOpacity>
          </Link>
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
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 20,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  section: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  infoItem: {
    width: '50%',
    padding: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    textAlign: 'center',
  },
  about: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
  },
  actionButtons: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 12,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  messageButton: {
    backgroundColor: '#2563eb',
  },
  scheduleButton: {
    backgroundColor: '#059669',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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