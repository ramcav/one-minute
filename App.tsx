import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';

import axios from 'axios';
import RNFS from 'react-native-fs'; // File system module
import {initLlama, releaseAllLlama} from 'llama.rn';

import {downloadModel} from './src/api/model'; // Download function
import ProgressBar from './src/components/ProgressBar'; // Progress bar component

function App(): React.JSX.Element {
  type Message = {
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

  const [conversation, setConversation] =
    useState<Message[]>(INITIAL_CONVERSATION);
  const [selectedModelFormat, setSelectedModelFormat] = useState<string>('');
  const [selectedGGUF, setSelectedGGUF] = useState<string | null>(null);
  const [availableGGUFs, setAvailableGGUFs] = useState<string[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [context, setContext] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<
    'modelSelection' | 'conversation'
  >('modelSelection');
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const modelFormats = [
    {label: 'Llama-3.2-1B-Instruct'},
    {label: 'Qwen2-0.5B-Instruct'},
    {label: 'DeepSeek-R1-Distill-Qwen-1.5B'},
    {label: 'SmolLM2-1.7B-Instruct'},
  ];

  const HF_TO_GGUF = {
    // 'Llama-3.2-1B-Instruct': 'bartowski/Llama-3.2-1B-Instruct-GGUF',
    "Llama-3.2-1B-Instruct": "medmekk/Llama-3.2-1B-Instruct.GGUF",
    "DeepSeek-R1-Distill-Qwen-1.5B":
      "medmekk/DeepSeek-R1-Distill-Qwen-1.5B.GGUF",
    "Qwen2-0.5B-Instruct": "medmekk/Qwen2.5-0.5B-Instruct.GGUF",
    "SmolLM2-1.7B-Instruct": "medmekk/SmolLM2-1.7B-Instruct.GGUF",
  };

  // #################### Button functions ######################
  const handleFormatSelection = (format: string) => {
    setSelectedModelFormat(format);
    setAvailableGGUFs([]); // Clear any previous list
    fetchAvailableGGUFs(format); // Fetch .gguf files for selected format
  };

  const handleGGUFSelection = (file: string) => {
    setSelectedGGUF(file);
    Alert.alert(
      'Confirm Download',
      `Do you want to download ${file}?`,
      [
        {
          text: 'No',
          onPress: () => setSelectedGGUF(null),
          style: 'cancel',
        },
        {text: 'Yes', onPress: () => handleDownloadAndNavigate(file)},
      ],
      {cancelable: false},
    );
  };

  const handleDownloadModel = async (file: string) => {
    const downloadUrl = `https://huggingface.co/${
      HF_TO_GGUF[selectedModelFormat as keyof typeof HF_TO_GGUF]
    }/resolve/main/${file}`;
    // we set the isDownloading state to true to show the progress bar and set the progress to 0
    setIsDownloading(true);
    setProgress(0);
    console.log('downloadUrl', downloadUrl);
    console.log(file);
    try {
      // we download the model using the downloadModel function
      const destPath = await downloadModel(file, downloadUrl, progress =>
        setProgress(progress),
      );
      Alert.alert('Success', `Model downloaded to: ${destPath}`);
      if (destPath) {
        await loadModel(file);
      } else {
        throw new Error('Model download path is invalid.');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Download failed due to an unknown error.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsDownloading(false);
      setCurrentPage('modelSelection');
    }
  };

  const handleSendMessage = async () => {
    // Check if context is loaded and user input is valid
    if (!context) {
      Alert.alert('Model Not Loaded', 'Please load the model first.');
      return;
    }

    if (!userInput.trim()) {
      Alert.alert('Input Error', 'Please enter a message.');
      return;
    }

    const newConversation: Message[] = [
      // ... is a spread operator that spreads the previous conversation array to which we add the new user message
      ...conversation,
      {role: 'user', content: userInput},
    ];

    // Update conversation state and clear user input
    setConversation(newConversation);
    setUserInput('');
    setIsGenerating(true);

    console.log('newConversation', newConversation);
    try {
      const stopWords = [
        '</s>',
        '<|end|>',
        'user:',
        'assistant:',
        '<|im_end|>',
        '<|eot_id|>',
        '<|end▁of▁sentence|>',
        '<｜end▁of▁sentence｜>',
      ];
      const result = await context.completion(
        {
          messages: newConversation,
          n_predict: 10000,
          stop: stopWords,
        },
        (data: {token: string}) => {
          // This is a partial completion callback
          const {token} = data;
        },
      );
      console.log('result', result.text);
      console.log('context', context);
      // Ensure the result has text before updating the conversation
      if (result && result.text) {
        setConversation(prev => [
          ...prev,
          {role: 'assistant', content: result.text.trim()},
        ]);
      } else {
        throw new Error('No response from the model.');
      }
    } catch (error) {
      // Handle errors during inference
      Alert.alert(
        'Error During Inference',
        error instanceof Error ? error.message : 'An unknown error occurred.',
      );
    } finally {
      setIsGenerating(false);
    }
  };
  // #################### End of Button functions ######################
  const handleDownloadAndNavigate = async (file: string) => {
    await handleDownloadModel(file);
    setCurrentPage('conversation'); // Navigate to conversation after download
  };

  const fetchAvailableGGUFs = async (modelFormat: string) => {
    if (!modelFormat) {
      Alert.alert('Error', 'Please select a model format first.');
      return;
    }
    setIsFetching(true);
    try {
      const repoPath = HF_TO_GGUF[modelFormat as keyof typeof HF_TO_GGUF];
      if (!repoPath) {
        throw new Error(
          `No repository mapping found for model format: ${modelFormat}`,
        );
      }

      const response = await axios.get(
        `https://huggingface.co/api/models/${repoPath}`,
      );

      if (!response.data?.siblings) {
        throw new Error('Invalid API response format');
      }

      const files = response.data.siblings.filter((file: {rfilename: string}) =>
        file.rfilename.endsWith('.gguf'),
      );

      setAvailableGGUFs(
        files.map((file: {rfilename: string}) => file.rfilename),
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch .gguf files';
      Alert.alert('Error', errorMessage);
      setAvailableGGUFs([]);
    } finally {
      setIsFetching(false);
    }
  };

  const loadModel = async (modelName: string) => {
    try {
      const destPath = `${RNFS.DocumentDirectoryPath}/${modelName}`;

      // Ensure the model file exists before attempting to load it
      const fileExists = await RNFS.exists(destPath);
      if (!fileExists) {
        Alert.alert('Error Loading Model', 'The model file does not exist.');
        return false;
      }

      if (context) {
        await releaseAllLlama();
        setContext(null);
        setConversation(INITIAL_CONVERSATION);
      }

      const llamaContext = await initLlama({
        model: destPath,
        use_mlock: true,
        n_ctx: 2048,
        n_gpu_layers: 1,
      });

      setContext(llamaContext);
      Alert.alert('Model Loaded', 'The model was successfully loaded.');
      return true;
    } catch (error) {
      Alert.alert(
        'Error Loading Model',
        error instanceof Error ? error.message : 'An unknown error occurred.',
      );
      return false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>Llama Chat</Text>
        {/* Model Selection Section */}
        {currentPage === 'modelSelection' && !isDownloading && (
          <View style={styles.card}>
            <Text style={styles.subtitle}>Choose a model format</Text>
            {modelFormats.map(format => (
              <TouchableOpacity
                key={format.label}
                style={[
                  styles.button,
                  selectedModelFormat === format.label && styles.selectedButton,
                ]}
                onPress={() => handleFormatSelection(format.label)}>
                <Text style={styles.buttonText}>{format.label}</Text>
              </TouchableOpacity>
            ))}

            {selectedModelFormat && (
              <View>
                <Text style={styles.subtitle}>Select a .gguf file</Text>
                {isFetching && (
                  <ActivityIndicator size="small" color="#2563EB" />
                )}
                {availableGGUFs.map((file, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      selectedGGUF === file && styles.selectedButton,
                    ]}
                    onPress={() => handleGGUFSelection(file)}>
                    <Text style={styles.buttonTextGGUF}>{file}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
        {currentPage == 'conversation' && !isDownloading && (
          <View style={styles.chatContainer}>
            <Text style={styles.greetingText}>
              🦙 Welcome! The Llama is ready to chat. Ask away! 🎉
            </Text>
            {conversation.slice(1).map((msg, index) => (
              <View key={index} style={styles.messageWrapper}>
                <View
                  style={[
                    styles.messageBubble,
                    msg.role === 'user'
                      ? styles.userBubble
                      : styles.llamaBubble,
                  ]}>
                  <Text
                    style={[
                      styles.messageText,
                      msg.role === 'user' && styles.userMessageText,
                    ]}>
                    {msg.content}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        {isDownloading && (
          <View style={styles.card}>
            <Text style={styles.subtitle}>Downloading : </Text>
            <Text style={styles.subtitle2}>{selectedGGUF}</Text>
            <ProgressBar progress={progress} />
          </View>
        )}
      </ScrollView>
      {currentPage === 'conversation' && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#94A3B8"
            value={userInput}
            onChangeText={setUserInput}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              disabled={isGenerating}>
              <Text style={styles.buttonText}>
                {isGenerating ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    marginVertical: 24,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 16,
    shadowColor: '#475569',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
    marginTop: 16,
  },
  subtitle2: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    color: '#93C5FD',
  },
  button: {
    backgroundColor: '#93C5FD', // Lighter blue
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: '#93C5FD', // Matching lighter shadow color
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15, // Slightly reduced opacity for subtle shadows
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedButton: {
    backgroundColor: '#2563EB',
  },
  buttonTextGGUF: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
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
    color: '#64748B', // Soft gray that complements #2563EB
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#334155',
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  inputContainer: {
    flexDirection: 'column',
    gap: 12,
    margin: 16,
  },
});

export default App;