import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';

export default function LawyerMessages() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChats();
    
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, () => {
        fetchChats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select(`
          *,
          lawyer:lawyers(*)
        `)
        .eq('lawyer_id', user.id)
        .order('created_at', { ascending: false });

      if (chatsError) throw chatsError;

      const processedChats = (chatsData || []).map(chat => ({
        ...chat,
        latest_message: chat.messages?.[0] || null
      }));

      setChats(processedChats);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <ScrollView style={styles.chatsList}>
        {chats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        ) : (
          chats.map((chat) => (
            <Link 
              key={chat.id} 
              href={`/chat/${chat.id}`}
              style={Platform.select({ web: { textDecoration: 'none' } })}
            >
              <TouchableOpacity style={styles.chatCard}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userInitial}>
                    {chat.user_id?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={styles.chatInfo}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.userName}>Client #{chat.user_id.slice(0, 8)}</Text>
                    <Text style={styles.timestamp}>
                      {new Date(chat.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {chat.latest_message ? chat.latest_message.content : 'No messages yet'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Link>
          ))
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  chatsList: {
    padding: 20,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInitial: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});