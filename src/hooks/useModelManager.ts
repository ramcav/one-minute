import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { initLlama, releaseAllLlama } from 'llama.rn';
import { downloadModel } from '../api/model';

const LAST_MODEL_KEY = 'last_used_model';

export const HF_TO_GGUF = {
  'Llama-3.2-1B-Instruct': 'medmekk/Llama-3.2-1B-Instruct.GGUF',
  'DeepSeek-R1-Distill-Qwen-1.5B': 'medmekk/DeepSeek-R1-Distill-Qwen-1.5B.GGUF',
  'Qwen2-0.5B-Instruct': 'medmekk/Qwen2.5-0.5B-Instruct.GGUF',
  'SmolLM2-1.7B-Instruct': 'medmekk/SmolLM2-1.7B-Instruct.GGUF',
};

export function useModelManager() {
  const [selectedModelFormat, setSelectedModelFormat] = useState<string>('');
  const [selectedGGUF, setSelectedGGUF] = useState<string | null>(null);
  const [availableGGUFs, setAvailableGGUFs] = useState<string[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [context, setContext] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<'modelSelection' | 'conversation'>('modelSelection');

  // On mount: load last model if it exists locally
  useEffect(() => {
    (async () => {
      try {
        const lastModel = await AsyncStorage.getItem(LAST_MODEL_KEY);
        if (lastModel) {
          const destPath = `${RNFS.DocumentDirectoryPath}/${lastModel}`;
          if (await RNFS.exists(destPath)) {
            const ok = await loadModel(lastModel);
            if (ok) {
              setSelectedGGUF(lastModel);
              setCurrentPage('conversation');
            }
          }
        }
      } catch {
        setCurrentPage('modelSelection');
      }
    })();
  }, []);

  const fetchAvailableGGUFs = useCallback(async (modelFormat: string) => {
    if (!modelFormat) {
      Alert.alert('Error', 'Please select a model format first.');
      return;
    }
    setIsFetching(true);
    try {
      const repoPath = HF_TO_GGUF[modelFormat as keyof typeof HF_TO_GGUF];
      if (!repoPath) throw new Error(`No mapping for ${modelFormat}`);
      const resp = await axios.get(`https://huggingface.co/api/models/${repoPath}`);
      const siblings = resp.data?.siblings;
      if (!Array.isArray(siblings)) throw new Error('Unexpected API response');
      const ggufs = siblings
        .filter((f: any) => f.rfilename?.endsWith('.gguf'))
        .map((f: any) => f.rfilename);
      setAvailableGGUFs(ggufs);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to list files');
      setAvailableGGUFs([]);
    } finally {
      setIsFetching(false);
    }
  }, []);

  const handleFormatSelection = useCallback((format: string) => {
    setSelectedModelFormat(format);
    setAvailableGGUFs([]);
    fetchAvailableGGUFs(format);
  }, [fetchAvailableGGUFs]);

  const loadModel = useCallback(async (modelName: string) => {
    try {
      const destPath = `${RNFS.DocumentDirectoryPath}/${modelName}`;
      if (!(await RNFS.exists(destPath))) {
        Alert.alert('Error Loading Model', 'The model file does not exist.');
        return false;
      }
      if (context) {
        await releaseAllLlama();
        setContext(null);
      }
      const llamaContext = await initLlama({
        model: destPath,
        use_mlock: true,
        n_ctx: 2048,
        n_gpu_layers: 1,
      });
      setContext(llamaContext);
      Alert.alert('Model Loaded', 'Yaay! 🎉 Model is ready.');
      return true;
    } catch (e: any) {
      Alert.alert('Error Loading Model', e.message ?? 'Unknown error');
      return false;
    }
  }, [context]);

  const handleDownloadModel = useCallback(async (file: string) => {
    if (!selectedModelFormat) {
      Alert.alert('Error', 'No model format selected first.');
      return;
    }
    const downloadUrl = `https://huggingface.co/${
      HF_TO_GGUF[selectedModelFormat as keyof typeof HF_TO_GGUF]
    }/resolve/main/${file}`;
    setIsDownloading(true);
    setProgress(0);

    try {
      const destPath = await downloadModel(file, downloadUrl, pct => setProgress(pct));
      Alert.alert('Downloaded', `Saved to: ${destPath}`);
      await AsyncStorage.setItem(LAST_MODEL_KEY, file);
      await loadModel(file);
      setSelectedGGUF(file);
    } catch (e: any) {
      Alert.alert('Download Error', e.message ?? 'Could not download');
      setCurrentPage('modelSelection');
    } finally {
      setIsDownloading(false);
    }
  }, [selectedModelFormat, loadModel]);

  const handleGGUFSelection = useCallback((file: string) => {
    Alert.alert(
      'Confirm Download?',
      `Download ${file}?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setSelectedGGUF(null) },
        { text: 'Yes', onPress: () => {
            setSelectedGGUF(file); // Set immediately so UI can show model name
            setCurrentPage('conversation');
            handleDownloadModel(file);
          }
        },
      ],
      { cancelable: true }
    );
  }, [handleDownloadModel]);

  return {
    selectedModelFormat,
    availableGGUFs,
    selectedGGUF,
    isFetching,
    isDownloading,
    progress,
    currentPage,
    handleFormatSelection,
    handleGGUFSelection,
  };
}
