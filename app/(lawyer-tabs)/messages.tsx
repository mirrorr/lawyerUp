// app/(lawyer-tabs)/messages.tsx
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';
import { MapPin, Mail, Calendar } from 'lucide-react-native';

interface ClientProfile {
  id: string;
  email: string;
  location?: string;
  created_at: string;
  cases_count: number;
}

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

      // Get chats with client profile information and case count
      const { data, error: chatsError } = await supabase
        .from('chats')
        .select(`
          *,
          user:auth.users(
            id,
            email,
            created_at
          )
        `)
        .eq('lawyer_id', user.id)
        .order('created_at', { ascending: false });

      if (chatsError) throw chatsError;

      // Process the data to include case count
      const processedChats = (data || []).map(chat => ({
        ...chat,
        client: {
          id: chat.user.id,
          email: chat.user.email,
          created_at: chat.user.created_at,
          cases_count: chat.cases_count[0]?.count || 0
        }
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
      <Link 
        href={`/chat/${chat.id}`} 
        style={Platform.select({ web: { textDecoration: 'none' } })}
      >
        <TouchableOpacity style={styles.messageCard}>
          <View style={styles.clientInfo}>
            <View style={styles.clientAvatar}>
              <Text style={styles.clientInitial}>
                {chat.client.email[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.clientDetails}>
              <Text style={styles.clientEmail}>{chat.client.email}</Text>
              <View style={styles.clientMetadata}>
                <View style={styles.metadataItem}>
                  <Calendar size={14} color={theme.colors.text.secondary} />
                  <Text style={styles.metadataText}>
                    Client since {new Date(chat.client.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.metadataItem}>
                  <Mail size={14} color={theme.colors.text.secondary} />
                  <Text style={styles.metadataText}>
                    {chat.client.cases_count} {chat.client.cases_count === 1 ? 'case' : 'cases'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.chatPreview}>
            <Text style={styles.lastMessageTime}>
              {new Date(chat.created_at).toLocaleString()}
            </Text>
            <View style={styles.chatStatus}>
              <View style={styles.statusIndicator} />
              <Text style={styles.statusText}>Active</Text>
            </View>
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
            <View key={`empty-${j}`} style={[styles.messageCardWrapper, { flex: 1, marginHorizontal: 10 }]} />
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

      <ScrollView style={styles.messagesList}>
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
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  clientInitial: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  clientDetails: {
    flex: 1,
  },
  clientEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  clientMetadata: {
    gap: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  chatPreview: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  lastMessageTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  chatStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '500',
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