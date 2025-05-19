import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { Briefcase, Search } from 'lucide-react-native';

export default function UserType() {
  const handleUserTypeSelection = (type: 'client' | 'lawyer') => {
    if (type === 'client') {
      router.replace('/(client-tabs)');
    } else {
      router.replace('/auth/lawyer-validation');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/logo2.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>Select how you want to use the app</Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.option}
          onPress={() => handleUserTypeSelection('client')}
        >
          <Search size={40} color="#7C3AED" />
          <Text style={styles.optionTitle}>Looking for a Lawyer</Text>
          <Text style={styles.optionDescription}>
            Find and connect with legal professionals
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => handleUserTypeSelection('lawyer')}
        >
          <Briefcase size={40} color="#7C3AED" />
          <Text style={styles.optionTitle}>I am a Lawyer</Text>
          <Text style={styles.optionDescription}>
            Offer your legal services to clients
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 50,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  option: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});