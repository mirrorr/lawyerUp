import { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Search, MapPin, Star, ChevronDown } from 'lucide-react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';

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
  const [showProBonoOnly, setShowProBonoOnly] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    fetchLawyers();
  }, [sortBy, showProBonoOnly]);

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const fetchLawyers = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      let { data: lawyers, error: lawyersError } = await supabase
        .from('lawyers')
        .select(`
          *,
          pro_bono_periods(
            id,
            start_date,
            end_date
          )
        `)
        .eq('validation_status', 'approved')
        .order(sortBy.value, { ascending: sortBy.order === 'asc' });

      if (lawyersError) throw lawyersError;

      const processedLawyers = lawyers?.map(lawyer => ({
        ...lawyer,
        is_pro_bono: lawyer.pro_bono_periods?.some((period: any) => 
          period.start_date <= today && period.end_date >= today
        ) || false
      })) || [];

      const filteredLawyers = showProBonoOnly 
        ? processedLawyers.filter(lawyer => lawyer.is_pro_bono)
        : processedLawyers;

      setLawyers(filteredLawyers);
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
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading lawyers...</Text>
        </View>
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
          <Search size={20} color={theme.colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, location, or specialty..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.text.secondary}
          />
        </View>
      </View>

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

        <View style={styles.filterActions}>
          <TouchableOpacity
            style={[styles.proBonoToggle, showProBonoOnly && styles.proBonoToggleActive]}
            onPress={() => setShowProBonoOnly(!showProBonoOnly)}
          >
            <Text style={[styles.proBonoToggleText, showProBonoOnly && styles.proBonoToggleTextActive]}>
              Pro Bono Offered
            </Text>
          </TouchableOpacity>

          <View style={[styles.sortContainer, Platform.OS === 'web' && { className: 'sort-container' }]}>
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={() => setShowSortMenu(!showSortMenu)}
            >
              <Text style={styles.sortButtonText}>{sortBy.label}</Text>
              <ChevronDown size={16} color={theme.colors.text.secondary} />
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
                    <MapPin size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.location}>{lawyer.location}</Text>
                  </View>
                  {lawyer.is_pro_bono && (
                    <View style={styles.proBonoBadge}>
                      <Text style={styles.proBonoBadgeText}>Pro Bono</Text>
                    </View>
                  )}
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
                setShowProBonoOnly(false);
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
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  logo: {
    width: 200,
    height: 50,
    marginBottom: 16,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  filtersContainer: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    marginRight: 8,
    height: 32,
    justifyContent: 'center',
  },
  selectedSpecialty: {
    backgroundColor: theme.colors.primary,
  },
  specialtyText: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  selectedSpecialtyText: {
    color: theme.colors.white,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  proBonoToggle: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
  },
  proBonoToggleActive: {
    backgroundColor: theme.colors.primary,
  },
  proBonoToggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  proBonoToggleTextActive: {
    color: theme.colors.white,
  },
  sortContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
  sortButtonText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginRight: 4,
  },
  sortMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: theme.colors.white,
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
    minWidth: 180,
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
    backgroundColor: theme.colors.background,
  },
  sortOptionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  selectedSortOptionText: {
    color: theme.colors.text.primary,
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
    backgroundColor: theme.colors.white,
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
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  proBonoBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  proBonoBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.error,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 4,
  },
  reviews: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
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