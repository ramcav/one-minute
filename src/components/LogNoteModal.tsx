import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';

interface LogNoteModalProps {
  visible: boolean;
  value: string;
  onChange: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const LogNoteModal: React.FC<LogNoteModalProps> = ({ visible, value, onChange, onSave, onCancel }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onCancel}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Add Note</Text>
        <TextInput
          style={styles.modalInput}
          placeholder="Describe what's happening..."
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChange}
          multiline
        />
        <View style={styles.modalButtonRow}>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: '#3B82F6' }]}
            onPress={onSave}
          >
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: '#EF4444' }]}
            onPress={onCancel}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(30,41,59,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  modalInput: {
    width: '100%',
    minHeight: 60,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#334155',
    marginBottom: 16,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default LogNoteModal; 