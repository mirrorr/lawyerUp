import { useState } from 'react';
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, MapPin, Star } from 'lucide-react-native';

const lawyers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    specialty: 'Criminal Law',
    rating: 4.8,
    reviews: 127,
    image: 'https://images.pexels.com/photos/5668770/pexels-photo-5668770.jpeg',
    location: 'New York, NY',
    languages: ['English', 'Spanish'],
  },
  {
    id: '2',
    name: 'Michael Chen',
    specialty: 'Family Law',
    rating: 4.9,
    reviews: 89,
    image: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg',
    location: 'Los Angeles, CA',
    languages: ['English', 'Mandarin'],
  },
  // Add more lawyers as needed
];

const specialties = [
  'Criminal Law',
  'Family Law',
  'Corporate Law',
  'Immigration',
  'Real Estate',
  'Intellectual Property',
];

export default function FindLawyers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Lawyers</Text>
        <View style={styles.searchContainer}>
          <Search size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, location, or specialty..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.specialtiesContainer}
        contentContainerStyle={styles.specialtiesContent}
      >
        <TouchableOpacity
          style={[
            styles.specialtyChip,
            !selectedSpecialty && styles.selectedSpecialty,
          ]}
          onPress={() => setSelectedSpecialty('')}>
          <Text
            style={[
              styles.specialtyText,
              !selectedSpecialty && styles.selectedSpecialtyText,
            ]}>
            All
          </Text>
        </TouchableOpacity>
        {specialties.map((specialty) => (
          <TouchableOpacity
            key={specialty}
            style={[
              styles.specialtyChip,
              selectedSpecialty === specialty && styles.selectedSpecialty,
            ]}
            onPress={() => setSelectedSpecialty(specialty)}>
            <Text
              style={[
                styles.specialtyText,
                selectedSpecialty === specialty && styles.selectedSpecialtyText,
              ]}>
              {specialty}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.lawyersList}>
        {lawyers.map((lawyer) => (
          <TouchableOpacity key={lawyer.id} style={styles.lawyerCard}>
            <Image source={{ uri: lawyer.image }} style={styles.lawyerImage} />
            <View style={styles.lawyerInfo}>
              <Text style={styles.lawyerName}>{lawyer.name}</Text>
              <Text style={styles.specialty}>{lawyer.specialty}</Text>
              <View style={styles.locationContainer}>
                <MapPin size={14} color="#64748b" />
                <Text style={styles.location}>{lawyer.location}</Text>
              </View>
              <View style={styles.ratingContainer}>
                <Star size={14} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.rating}>{lawyer.rating}</Text>
                <Text style={styles.reviews}>({lawyer.reviews} reviews)</Text>
              </View>
              <View style={styles.languagesContainer}>
                {lawyer.languages.map((language) => (
                  <View key={language} style={styles.languageBadge}>
                    <Text style={styles.languageBadgeText}>{language}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  specialtiesContainer: {
    maxHeight: 52,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  specialtiesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  specialtyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    marginRight: 8,
    height: 32,
    justifyContent: 'center',
  },
  selectedSpecialty: {
    backgroundColor: '#7C3AED',
  },
  specialtyText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  selectedSpecialtyText: {
    color: '#ffffff',
  },
  lawyersList: {
    flex: 1,
    padding: 20,
  },
  lawyerCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lawyerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  lawyerInfo: {
    flex: 1,
  },
  lawyerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
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
    marginBottom: 8,
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
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  languageBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  languageBadgeText: {
    fontSize: 12,
    color: '#64748b',
  },
});