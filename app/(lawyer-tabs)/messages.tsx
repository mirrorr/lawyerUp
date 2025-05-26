import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';

export default function LawyerMessages() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const numColumns = isWeb ? Math.max(2, Math.floor(width / 400)) : 1;

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
          lawyer:lawyers(*),
          user:users(
            id,
            fname,
            lname
          )
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

  const renderChatCard = (chat: any) => (
    <View style={styles.messageCardWrapper} key={chat.id}>
      <Link href={`/chat/${chat.id}`} style={Platform.select({ web: { textDecoration: 'none' } })}>
        <TouchableOpacity style={styles.messageCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>
              {chat.user?.fname?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.messageContent}>
            <View style={styles.messageHeader}>
              <Text style={styles.userName}>
                {chat.user?.fname && chat.user?.lname 
                  ? `${chat.user.fname} ${chat.user.lname}`
                  : 'Anonymous User'}
              </Text>
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
    </View>
  );

  const renderGrid = () => {
    const rows = [];
    for (let i = 0; i < chats.length; i += numColumns) {
      const row = [];
      for (let j = 0; j < numColumns; j++) {
        const index = i + j;
        if (index < chats.length) {
          row.push(renderChatCard(chats[index]));
        } else {
          row.push(
            <View key={`empty-${j}`} style={[styles.messageCardWrapper, { flex: 1, marginHorizontal: 10 }]}>
              <View style={[styles.messageCard, styles.emptyCard]} />
            </View>
          );
        }
      }
      rows.push(<View key={i} style={styles.row}>{row}</View>);
    }
    return rows;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
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
    backgroundColor: theme.colors.white,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
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
  messageContent: {
    flex: 1,
  },
  messageHeader: {
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