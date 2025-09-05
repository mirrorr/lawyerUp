import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Send, ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    checkAuthStatus();
    fetchMessages();
    
    // Subscribe to new messages
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select(`
          *,
          lawyer:lawyers(
            id,
            name,
            specialty,
            image_url
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (chatError) throw chatError;
      
      if (!chatData) {
        setError('Chat not found');
        return;
      }

      setChatInfo(chatData);
      
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      setMessages(messagesData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const messageToSend = {
        chat_id: id,
        sender_id: userData.user.id,
        content: newMessage.trim(),
      };

      const { data: newMessage_, error: insertError } = await supabase
        .from('messages')
        .insert(messageToSend)
        .select()
        .single();

      if (insertError) throw insertError;

      // Update local messages state immediately
      setMessages(prev => [...prev, newMessage_]);
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleBack = useCallback(() => {
    const isLawyer = currentUser?.id === chatInfo?.lawyer_id;
    router.replace(isLawyer ? '/(lawyer-tabs)/messages' : '/(client-tabs)/messages');
  }, [currentUser?.id, chatInfo?.lawyer_id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.navigationHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.navigationHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMessages}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isLawyer = currentUser?.id === chatInfo?.lawyer_id;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.navigationHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {isLawyer ? `Client #${chatInfo.user_id.slice(0, 8)}` : chatInfo.lawyer.name}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isLawyer ? 'Client' : chatInfo.lawyer.specialty}
          </Text>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
          </View>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.sender_id === currentUser?.id;
            const isLawyerMessage = message.sender_id === chatInfo.lawyer_id;
            return (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  isCurrentUser ? styles.userMessage : styles.otherMessage,
                  isLawyerMessage && !isCurrentUser && styles.lawyerMessage
                ]}
              >
                <Text style={[
                  styles.messageText,
                  isCurrentUser ? styles.userMessageText : styles.otherMessageText,
                ]}>
                  {message.content}
                </Text>
                <Text style={[
                  styles.timestamp,
                  isCurrentUser ? styles.userTimestamp : styles.otherTimestamp,
                ]}>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {isLawyerMessage && !isCurrentUser && (
                  <View style={styles.lawyerBadge}>
                    <Text style={styles.lawyerBadgeText}>Lawyer</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
          placeholderTextColor={theme.colors.text.secondary}
          multiline
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled,
          ]} 
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          <Send size={20} color={theme.colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    padding: 20,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: theme.colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: theme.colors.white,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lawyerMessage: {
    backgroundColor: '#E3F2FD',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: theme.colors.white,
  },
  otherMessageText: {
    color: theme.colors.text.primary,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: theme.colors.white,
    opacity: 0.8,
  },
  otherTimestamp: {
    color: theme.colors.text.secondary,
  },
  lawyerBadge: {
    position: 'absolute',
    top: -20,
    left: 0,
    backgroundColor: theme.colors.info,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  lawyerBadgeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
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