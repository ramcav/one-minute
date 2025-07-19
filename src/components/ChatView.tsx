import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

interface ChatViewProps {
  messages: Message[];
}

const ChatView: React.FC<ChatViewProps> = ({ messages }) => (
  <View style={styles.chatContainer}>
    <Text style={styles.greetingText}>
    One minute is the difference between life and death.
    </Text>
    <Text style={styles.greetingText}>
    We're here to help you.
    </Text>
    {messages.slice(1).map((msg, index) => (
      <View key={index} style={styles.messageWrapper}>
        <View
          style={[
            styles.messageBubble,
            msg.role === 'user' ? styles.userBubble : styles.llamaBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              msg.role === 'user' && styles.userMessageText,
            ]}
          >
            {msg.content}
          </Text>
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
  },
  llamaBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: {
    fontSize: 16,
    color: '#334155',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginVertical: 12,
    color: '#64748B',
  },
});

export default ChatView; 