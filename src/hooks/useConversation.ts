import { useState } from 'react';
import { Alert } from 'react-native';

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const INITIAL_CONVERSATION: Message[] = [
  {
    role: 'system',
    content:
      'This is a conversation between user and assistant, a friendly chatbot.',
  },
];

export function useConversation(context: any) {
  const [conversation, setConversation] = useState<Message[]>(INITIAL_CONVERSATION);
  const [userInput, setUserInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleSendMessage = async () => {
    if (!context) {
      Alert.alert('Model Not Loaded', 'Please load the model first.');
      return;
    }
    if (!userInput.trim()) {
      Alert.alert('Input Error', 'Please enter a message.');
      return;
    }
    const newConversation: Message[] = [
      ...conversation,
      { role: 'user', content: userInput },
    ];
    setConversation(newConversation);
    setUserInput('');
    setIsGenerating(true);
    try {
      const stopWords = [
        '</s>',
        '<|end|>',
        'user:',
        'assistant:',
        '<|im_end|>',
        '<|eot_id|>',
        '<|end▁of▁sentence|>',
        '',
      ];
      const result = await context.completion(
        {
          messages: newConversation,
          n_predict: 10000,
          stop: stopWords,
        },
        (data: { token: string }) => {
          // Partial completion callback (can be used for streaming)
        },
      );
      if (result && result.text) {
        setConversation(prev => [
          ...prev,
          { role: 'assistant', content: result.text.trim() },
        ]);
      } else {
        throw new Error('No response from the model.');
      }
    } catch (error) {
      Alert.alert(
        'Error During Inference',
        error instanceof Error ? error.message : 'An unknown error occurred.',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    conversation,
    setConversation,
    userInput,
    setUserInput,
    isGenerating,
    handleSendMessage,
  };
} 