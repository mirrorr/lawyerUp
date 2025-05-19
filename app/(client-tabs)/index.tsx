import { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Search, MapPin, Star } from 'lucide-react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';

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
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLawyers();
  }, []);

  const fetchLawyers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lawyers')
        .select('*');

      if (error) throw error;

      setLawyers(data || []);
    } catch (err) {
      setError('Failed to load lawyers');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLawyers = useCallback(() => {
    return lawyers.filter(lawyer => {
      const matchesSearch = lawyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lawyer.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lawyer.specialty.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSpecialty = !selectedSpecialty || lawyer.specialty === selectedSpecialty;

      return matchesSearch && matchesSpecialty;
    });
  }, [searchQuery, selectedSpecialty, lawyers]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading lawyers...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchLawyers}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/logo2.png')}
          style={styles.logo}
          resizeMode="contain"
        />
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

      <ScrollView 
        style={styles.lawyersList}
        contentContainerStyle={styles.lawyersContent}
      >
        {filteredLawyers().length > 0 ? (
          filteredLawyers().map((lawyer) => (
            <Link key={lawyer.id} href={`/lawyer/${lawyer.id}`} style={Platform.select({ web: { textDecoration: 'none' } })}>
              <TouchableOpacity style={styles.lawyerCard}>
                <Image source={{ uri: lawyer.image_url }} style={styles.lawyerImage} />
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
                    <Text style={styles.reviews}>({lawyer.reviews_count} reviews)</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          ))
        ) : (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No lawyers found matching your search criteria</Text>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedSpecialty('');
              }}>
              <Text style={styles.resetButtonText}>Reset Search</Text>
            </TouchableOpacity>
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  logo: {
    width: 200,
    height: 50,
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
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  specialtiesContent: {
    padding: 12,
  },
  specialtyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    marginRight: 8,
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
  },
  lawyersContent: {
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
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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