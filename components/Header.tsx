import { View, Image, StyleSheet } from 'react-native';

interface HeaderProps {
  children?: React.ReactNode;
}

export default function Header({ children }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Image 
        source={require('../assets/images/logo2.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 50,
    marginBottom: 16,
  },
});