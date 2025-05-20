import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function Messages() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const numColumns = isWeb ? Math.max(2, Math.floor(width / 400)) : 1;

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: chatsError } = await supabase
        .from('chats')
        .select(`
          *,
          lawyer:lawyers(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (chatsError) throw chatsError;
      setChats(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchChats}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderGrid = () => {
    const rows = [];
    for (let i = 0; i < chats.length; i += numColumns) {
      const row = chats.slice(i, i + numColumns);
      rows.push(
        <View key={i} style={styles.row}>
          {row.map((chat) => renderChatCard(chat))}
          {/* Add empty cells to complete the row */}
          {row.length < numColumns && Array(numColumns - row.length).fill(null).map((_, index) => (
            <View key={`empty-${index}`} style={[styles.messageCard, styles.emptyCard]} />
          ))}
        </View>
      );
    }
    return rows;
  };

  const renderChatCard = (chat: any) => (
    <Link 
      key={chat.id} 
      href={`/chat/${chat.id}`}
      style={[
        styles.messageCardWrapper,
        Platform.select({ web: { textDecoration: 'none' } })
      ]}
    >
      <View style={styles.messageCard}>
        <Image 
          source={{ uri: chat.lawyer?.image_url || 'https://images.pexels.com/photos/5668770/pexels-photo-5668770.jpeg' }} 
          style={styles.lawyerImage} 
        />
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.lawyerName}>{chat.lawyer?.name || 'Lawyer'}</Text>
            <Text style={styles.timestamp}>
              {new Date(chat.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.messagePreview}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              Tap to view conversation
            </Text>
          </View>
        </View>
      </View>
    </Link>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <ScrollView style={styles.messagesList}>
        {chats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Start a conversation by finding a lawyer and clicking "Start Chat"
            </Text>
          </View>
        ) : isWeb ? (
          <View style={styles.grid}>{renderGrid()}</View>
        ) : (
          chats.map((chat) => renderChatCard(chat))
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
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  messagesList: {
    flex: 1,
  },
  grid: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -10,
    marginBottom: 20,
  },
  messageCardWrapper: {
    flex: 1,
    marginHorizontal: 10,
  },
  messageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
  },
  emptyCard: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  lawyerImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 12,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});