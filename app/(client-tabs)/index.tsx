import { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Search, MapPin, Star, ChevronDown } from 'lucide-react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';

const specialties = [
  'Criminal Law',
  'Family Law',
  'Corporate Law',
  'Immigration',
  'Real Estate',
  'Intellectual Property',
];

type SortOption = {
  label: string;
  value: string;
  order: 'asc' | 'desc';
};

const sortOptions: SortOption[] = [
  { label: 'Highest Rated', value: 'rating', order: 'desc' },
  { label: 'Most Reviews', value: 'reviews_count', order: 'desc' },
  { label: 'Newest', value: 'created_at', order: 'desc' },
];

export default function FindLawyers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(sortOptions[0]);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    fetchLawyers();
  }, [sortBy]);

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const fetchLawyers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('lawyers')
        .select('*')
        .eq('validation_status', 'approved')
        .order(sortBy.value, { ascending: sortBy.order === 'asc' });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
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
      const matchesSearch = 
        lawyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lawyer.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lawyer.specialty.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSpecialty = !selectedSpecialty || lawyer.specialty === selectedSpecialty;

      return matchesSearch && matchesSpecialty;
    });
  }, [searchQuery, selectedSpecialty, lawyers]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.sort-container')) {
          setShowSortMenu(false);
        }
      };

      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, []);

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
      <Header>
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
      </Header>

      <View style={styles.filtersContainer}>
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

        <View style={[styles.sortContainer, Platform.OS === 'web' && { className: 'sort-container' }]}>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Text style={styles.sortButtonText}>{sortBy.label}</Text>
            <ChevronDown size={16} color="#64748b" />
          </TouchableOpacity>

          {showSortMenu && (
            <View style={[styles.sortMenu, Platform.OS === 'web' && styles.sortMenuWeb]}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    sortBy.value === option.value && styles.selectedSortOption,
                  ]}
                  onPress={() => {
                    setSortBy(option);
                    setShowSortMenu(false);
                  }}
                >
                  <Text style={[
                    styles.sortOptionText,
                    sortBy.value === option.value && styles.selectedSortOptionText,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.lawyersList}
        contentContainerStyle={styles.lawyersContent}
        showsVerticalScrollIndicator={true}
      >
        {filteredLawyers().length > 0 ? (
          filteredLawyers().map((lawyer) => (
            <Link key={lawyer.id} href={`/lawyer/${lawyer.id}`} style={[styles.lawyerLink, Platform.select({ web: { textDecoration: 'none' } })]}>
              <View style={styles.lawyerCard}>
                <Image source={{ uri: lawyer.image_url }} style={styles.lawyerImage} />
                <View style={styles.lawyerInfo}>
                  <Text style={styles.lawyerName}>{lawyer.name}</Text>
                  <Text style={styles.specialty}>{lawyer.specialty}</Text>
                  <View style={styles.locationContainer}>
                    <MapPin size={14} color="#64748b" />
                    <Text style={styles.location}>{lawyer.location}</Text>
                  </View>
                  {isAuthenticated && (
                    <View style={styles.ratingContainer}>
                      <Star size={14} color="#fbbf24" fill="#fbbf24" />
                      <Text style={styles.rating}>{lawyer.rating.toFixed(1)}</Text>
                      <Text style={styles.reviews}>({lawyer.reviews_count} reviews)</Text>
                    </View>
                  )}
                </View>
              </View>
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
  filtersContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  specialtiesContainer: {
    maxHeight: 52,
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
  sortContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    position: 'relative',
    zIndex: 1000,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 4,
  },
  sortMenu: {
    position: 'absolute',
    top: '100%',
    left: 12,
    right: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  sortMenuWeb: {
    position: 'absolute',
    zIndex: 1000,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  sortOption: {
    padding: 12,
    borderRadius: 8,
  },
  selectedSortOption: {
    backgroundColor: '#f1f5f9',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#64748b',
  },
  selectedSortOptionText: {
    color: '#1e293b',
    fontWeight: '600',
  },
  lawyersList: {
    flex: 1,
  },
  lawyersContent: {
    padding: 20,
    paddingBottom: 100,
  },
  lawyerLink: {
    width: '100%',
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
    width: '100%',
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
  },
  location: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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