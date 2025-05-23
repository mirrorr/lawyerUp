import React from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { Link } from 'expo-router';
import { theme } from '@/constants/theme';

interface LawyerCardProps {
  lawyer: any;
  isAuthenticated: boolean;
}

export default function LawyerCard({ lawyer, isAuthenticated }: LawyerCardProps) {
  return (
    <Link href={`/lawyer/${lawyer.id}`} style={[styles.lawyerLink, Platform.select({ web: { textDecoration: 'none' } })]}>
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
  );
}

const styles = StyleSheet.create({
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
});