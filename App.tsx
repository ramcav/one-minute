import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useModelManager } from './src/hooks/useModelManager';
import { useConversation } from './src/hooks/useConversation';
import QuickActionBar from './src/components/QuickActionBar';
import LogNoteModal from './src/components/LogNoteModal';
import ChatView from './src/components/ChatView';
import ModelSelectionView from './src/components/ModelSelectionView';
import { makePhoneCall, sendSMS, logEvent } from './src/agentActions';
import ProgressBar from './src/components/ProgressBar';
import { useEffect } from 'react';

function App(): React.JSX.Element {
  // Model management hook
  const modelManager = useModelManager();
  // Conversation hook (pass model context if available)
  const {
    conversation,
    setConversation,
    userInput,
    setUserInput,
    isGenerating,
    handleSendMessage,
  } = useConversation((modelManager as any).context);

  // Log note modal state
  const [logNote, setLogNote] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);

  // Hardcoded numbers for MVP
  const EMERGENCY_NUMBER = '911';
  const EMERGENCY_CONTACT = '+1234567890';

  // Quick action handler
  const handleQuickAction = async (action: 'call' | 'sms' | 'log' | 'assessment') => {
    switch (action) {
      case 'call':
        await makePhoneCall(EMERGENCY_NUMBER);
        await logEvent('User pressed Call Emergency');
        break;
      case 'sms':
        await sendSMS(EMERGENCY_CONTACT, 'This is an emergency. Please help!');
        await logEvent('User pressed Message Contact');
        break;
      case 'log':
        setShowLogModal(true);
        break;
      case 'assessment':
        await logEvent('User started assessment');
        // Placeholder for assessment logic
        break;
    }
  };

  // Log note save handler
  const handleSaveLogNote = async () => {
    if (logNote.trim()) {
      await logEvent(`User note: ${logNote.trim()}`);
      setLogNote('');
      setShowLogModal(false);
    }
  };

  // Show alert when model download starts
  useEffect(() => {
    if (modelManager.isDownloading) {
      Alert.alert('Model Downloading', 'Model is downloading. Please wait until the download is complete.');
    }
  }, [modelManager.isDownloading]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>One Minute</Text>
        {modelManager.currentPage === 'modelSelection' && (
          <ModelSelectionView
            modelFormats={[
              { label: 'Llama-3.2-1B-Instruct' },
              { label: 'Qwen2-0.5B-Instruct' },
              { label: 'DeepSeek-R1-Distill-Qwen-1.5B' },
              { label: 'SmolLM2-1.7B-Instruct' },
            ]}
            selectedModelFormat={modelManager.selectedModelFormat}
            onFormatSelect={modelManager.handleFormatSelection}
            availableGGUFs={modelManager.availableGGUFs}
            selectedGGUF={modelManager.selectedGGUF}
            onGGUFSelect={modelManager.handleGGUFSelection}
            isFetching={modelManager.isFetching}
            isDownloading={modelManager.isDownloading}
            progress={modelManager.progress}
          />
        )}
        {modelManager.currentPage === 'conversation' && (
          <>
            {modelManager.isDownloading && (
              <View style={styles.progressBanner}>
                <Text style={styles.progressBannerText}>
                  Downloading model: {modelManager.selectedGGUF}
                </Text>
               
              </View>
            )}
            <ProgressBar progress={modelManager.progress} />
            <ChatView messages={conversation} />
            <QuickActionBar onAction={handleQuickAction} disabled={isGenerating || modelManager.isDownloading} />
            <LogNoteModal
              visible={showLogModal}
              value={logNote}
              onChange={setLogNote}
              onSave={handleSaveLogNote}
              onCancel={() => { setShowLogModal(false); setLogNote(''); }}
            />
          </>
        )}
      </ScrollView>
      {modelManager.currentPage === 'conversation' && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#94A3B8"
            value={userInput}
            onChangeText={setUserInput}
            editable={!modelManager.isDownloading}
          />
          <View style={styles.buttonRow}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              disabled={isGenerating || modelManager.isDownloading}
            >
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
  progressBanner: {
    backgroundColor: '#F59E42',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressBannerText: {
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
});

export default App;