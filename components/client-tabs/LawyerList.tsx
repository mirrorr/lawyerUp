import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';
import LawyerCard from './LawyerCard';

interface LawyerListProps {
  filteredLawyers: any[];
  isAuthenticated: boolean;
  setSearchQuery: (query: string) => void;
  setSelectedSpecialty: (specialty: string) => void;
  setShowProBonoOnly: (show: boolean) => void;
}

export default function LawyerList({ 
  filteredLawyers, 
  isAuthenticated, 
  setSearchQuery, 
  setSelectedSpecialty, 
  setShowProBonoOnly 
}: LawyerListProps) {
  return (
    <View>
      {filteredLawyers.length > 0 ? (
        filteredLawyers.map((lawyer) => (
          <LawyerCard key={lawyer.id} lawyer={lawyer} isAuthenticated={isAuthenticated} />
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
    </View>
  );
}

const styles = StyleSheet.create({
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
});