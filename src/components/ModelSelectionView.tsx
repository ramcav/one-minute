import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import ProgressBar from './ProgressBar';

interface ModelSelectionViewProps {
  modelFormats: { label: string }[];
  selectedModelFormat: string;
  onFormatSelect: (format: string) => void;
  availableGGUFs: string[];
  selectedGGUF: string | null;
  onGGUFSelect: (file: string) => void;
  isFetching: boolean;
  isDownloading: boolean;
  progress: number;
}

const ModelSelectionView: React.FC<ModelSelectionViewProps> = ({
  modelFormats,
  selectedModelFormat,
  onFormatSelect,
  availableGGUFs,
  selectedGGUF,
  onGGUFSelect,
  isFetching,
  isDownloading,
  progress,
}) => (
  <View style={styles.card}>
    <Text style={styles.subtitle}>Choose a model format</Text>
    {modelFormats.map(format => (
      <TouchableOpacity
        key={format.label}
        style={[
          styles.button,
          selectedModelFormat === format.label && styles.selectedButton,
        ]}
        onPress={
            () => {
                onFormatSelect(format.label);
            }
        }
      >
        <Text style={styles.buttonText}>{format.label}</Text>
      </TouchableOpacity>
    ))}
    {selectedModelFormat && (
      <View>
        <Text style={styles.subtitle}>Select a .gguf file</Text>
        {isFetching && <ActivityIndicator size="small" color="#2563EB" />}
        {availableGGUFs.map((file, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.button,
              selectedGGUF === file && styles.selectedButton,
            ]}
            onPress={() => onGGUFSelect(file)}
            disabled={!selectedModelFormat || isFetching}
          >
            <Text style={styles.buttonTextGGUF}>{file}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
    {isDownloading && (
      <View>
        <Text style={styles.subtitle}>Downloading : </Text>
        <Text style={styles.subtitle2}>{selectedGGUF}</Text>
        <ProgressBar progress={progress} />
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
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
    backgroundColor: '#93C5FD',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: '#93C5FD',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
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
});

export default ModelSelectionView; 