import { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Platform, TextInput } from 'react-native';
import { useLocalSearchParams, Link, useRouter } from 'expo-router';
import { MapPin, Star, MessageSquare, Calendar, Clock, Briefcase, Award, Globe, ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
}

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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingChat, setCreatingChat] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    fetchLawyer();
    if (isAuthenticated) {
      fetchReviews();
      checkReviewEligibility();
    }
  }, [id, isAuthenticated]);

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

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

  const fetchReviews = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('lawyer_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(data || []);

      if (user) {
        const userReview = data?.find(review => review.user_id === user.id);
        if (userReview) {
          setUserReview(userReview);
          setNewRating(userReview.rating);
          setNewComment(userReview.comment || '');
        }
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const checkReviewEligibility = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: chat } = await supabase
        .from('chats')
        .select('id')
        .eq('lawyer_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      setCanReview(!!chat);
    } catch (err) {
      console.error('Error checking review eligibility:', err);
    }
  };

  const handleSubmitReview = async () => {
    try {
      setSubmittingReview(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (newRating < 1 || newRating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const review = {
        lawyer_id: id,
        user_id: user.id,
        rating: newRating,
        comment: newComment.trim(),
      };

      const { error } = userReview
        ? await supabase
            .from('reviews')
            .update(review)
            .eq('id', userReview.id)
        : await supabase
            .from('reviews')
            .insert(review);

      if (error) throw error;

      // Refresh reviews and lawyer data
      await Promise.all([fetchReviews(), fetchLawyer()]);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      router.push('/auth/sign-in');
      return;
    }

    try {
      setCreatingChat(true);
      const { data: { user } } = await supabase.auth.getUser();

      // Check if chat already exists
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('lawyer_id', id)
        .eq('user_id', user!.id)
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
          user_id: user!.id,
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

  const renderStars = (rating: number, interactive = false) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && setNewRating(star)}
            disabled={!interactive}
          >
            <Star
              size={interactive ? 32 : 16}
              color="#fbbf24"
              fill={star <= rating ? '#fbbf24' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
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
              {renderStars(lawyer.rating)}
              <Text style={styles.rating}>{lawyer.rating.toFixed(1)}</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          
          {!isAuthenticated ? (
            <View style={styles.loginPromptContainer}>
              <Text style={styles.loginPromptText}>
                Sign in to see reviews and access chat features
              </Text>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push('/auth/sign-in')}
              >
                <Text style={styles.loginButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {canReview && (
                <View style={styles.reviewForm}>
                  <Text style={styles.reviewFormTitle}>
                    {userReview ? 'Update Your Review' : 'Write a Review'}
                  </Text>
                  <View style={styles.ratingInput}>
                    {renderStars(newRating, true)}
                  </View>
                  <TextInput
                    style={styles.commentInput}
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholder="Write your review here..."
                    multiline
                    numberOfLines={4}
                  />
                  <TouchableOpacity
                    style={[styles.submitButton, submittingReview && styles.buttonDisabled]}
                    onPress={handleSubmitReview}
                    disabled={submittingReview || newRating === 0}
                  >
                    <Text style={styles.submitButtonText}>
                      {submittingReview ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerAvatar}>
                        <Text style={styles.reviewerInitial}>
                          {review.user_id[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.reviewInfo}>
                        <Text style={styles.reviewerName}>
                          Client #{review.user_id.slice(0, 8)}
                        </Text>
                        <Text style={styles.reviewDate}>
                          {new Date(review.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    {renderStars(review.rating)}
                    {review.comment && (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noReviews}>No reviews yet</Text>
              )}
            </>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.button, styles.messageButton, creatingChat && styles.buttonDisabled]}
            onPress={handleStartChat}
            disabled={creatingChat}
          >
            <MessageSquare size={20} color="#ffffff" />
            <Text style={styles.buttonText}>
              {!isAuthenticated ? 'Sign In to Chat' : creatingChat ? 'Starting Chat...' : 'Start Chat'}
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
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  loginPromptContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  loginPromptText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewForm: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  reviewFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  ratingInput: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewerInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  reviewInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#64748b',
  },
  reviewComment: {
    fontSize: 14,
    color: '#334155',
    marginTop: 8,
    lineHeight: 20,
  },
  noReviews: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    padding: 20,
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