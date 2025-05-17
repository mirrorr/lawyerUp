import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform } from 'react-native';
import { Link } from 'expo-router';

const messages = [
  {
    id: '1',
    lawyer: {
      name: 'Sarah Johnson',
      image: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg',
    },
    lastMessage: 'I\'ve reviewed your case details...',
    timestamp: '2:30 PM',
    unread: true,
  },
  {
    id: '2',
    lawyer: {
      name: 'Michael Chen',
      image: 'https://images.pexels.com/photos/5668770/pexels-photo-5668770.jpeg',
    },
    lastMessage: 'The documents have been filed...',
    timestamp: 'Yesterday',
    unread: false,
  },
];

export default function Messages() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <ScrollView style={styles.messagesList}>
        {messages.map((message) => (
          <Link key={message.id} href={`/chat/${message.id}`} style={Platform.select({ web: { textDecoration: 'none' } })}>
            <TouchableOpacity style={styles.messageCard}>
              <Image source={{ uri: message.lawyer.image }} style={styles.lawyerImage} />
              <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                  <Text style={styles.lawyerName}>{message.lawyer.name}</Text>
                  <Text style={styles.timestamp}>{message.timestamp}</Text>
                </View>
                <View style={styles.messagePreview}>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {message.lastMessage}
                  </Text>
                  {message.unread && <View style={styles.unreadBadge} />}
                </View>
              </View>
            </TouchableOpacity>
          </Link>
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
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  messagesList: {
    padding: 20,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lawyerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  timestamp: {
    fontSize: 12,
    color: '#64748b',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
    marginRight: 8,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
});