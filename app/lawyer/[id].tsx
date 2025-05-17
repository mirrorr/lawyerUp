import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, Link, useRouter } from 'expo-router';
import { MapPin, Star, MessageSquare, Calendar, Clock, Briefcase, Award, Globe, ArrowLeft } from 'lucide-react-native';

const lawyerData = {
  '1': {
    id: '1',
    name: 'Sarah Johnson',
    specialty: 'Criminal Law',
    rating: 4.8,
    reviews: 127,
    image: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg',
    location: 'New York, NY',
    experience: '15 years',
    languages: ['English', 'Spanish'],
    education: 'Harvard Law School',
    consultationFee: '$200/hour',
    availability: 'Mon-Fri, 9AM-5PM',
    about: 'Specializing in criminal defense with a proven track record of successful cases. Dedicated to providing aggressive representation while maintaining the highest ethical standards.',
    reviews_list: [
      {
        id: '1',
        user: 'John D.',
        rating: 5,
        date: '2 weeks ago',
        comment: 'Sarah was extremely professional and helped me navigate through my case with expertise and compassion.',
      },
      {
        id: '2',
        user: 'Maria R.',
        rating: 4,
        date: '1 month ago',
        comment: 'Very knowledgeable and responsive. Would definitely recommend her services.',
      },
    ],
  },
  '2': {
    id: '2',
    name: 'Michael Chen',
    specialty: 'Corporate Law',
    rating: 4.9,
    reviews: 89,
    image: 'https://images.pexels.com/photos/5668770/pexels-photo-5668770.jpeg',
    location: 'San Francisco, CA',
    experience: '12 years',
    languages: ['English', 'Mandarin'],
    education: 'Stanford Law School',
    consultationFee: '$250/hour',
    availability: 'Mon-Fri, 8AM-6PM',
    about: 'Expert in corporate law and business transactions. Helping companies navigate complex legal challenges and achieve their business objectives.',
    reviews_list: [
      {
        id: '1',
        user: 'David L.',
        rating: 5,
        date: '1 week ago',
        comment: 'Michael provided excellent guidance for our startup\'s legal needs.',
      },
      {
        id: '2',
        user: 'Sarah P.',
        rating: 5,
        date: '3 weeks ago',
        comment: 'Extremely thorough and professional. Great experience working with him.',
      },
    ],
  },
};

export default function LawyerProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const lawyer = lawyerData[id as keyof typeof lawyerData];

  if (!lawyer) {
    return (
      <View style={styles.container}>
        <Text>Lawyer not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lawyer Profile</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Image source={{ uri: lawyer.image }} style={styles.profileImage} />
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
              <Text style={styles.reviews}>({lawyer.reviews} reviews)</Text>
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
              <Text style={styles.infoValue}>{lawyer.consultationFee}</Text>
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
          {lawyer.reviews_list.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewUser}>{review.user}</Text>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
              <View style={styles.reviewRating}>
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    size={16}
                    color="#fbbf24"
                    fill={index < review.rating ? '#fbbf24' : 'transparent'}
                  />
                ))}
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionButtons}>
          <Link href={`/chat/${lawyer.id}`} style={Platform.select({ web: { textDecoration: 'none' } })}>
            <TouchableOpacity style={[styles.button, styles.messageButton]}>
              <MessageSquare size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Start Chat</Text>
            </TouchableOpacity>
          </Link>
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
  reviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  reviewDate: {
    fontSize: 14,
    color: '#64748b',
  },
  reviewRating: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
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
});