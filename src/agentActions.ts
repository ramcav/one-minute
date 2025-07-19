import { Linking, Platform, Alert } from 'react-native';
import RNFS from 'react-native-fs';

// Make a phone call to the given number
export const makePhoneCall = async (number: string) => {
  const url = `tel:${number}`;
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert('Error', 'Phone call not supported on this device.');
  }
};

// Send an SMS to the given number with the given message
export const sendSMS = async (number: string, message: string) => {
  let url = '';
  if (Platform.OS === 'ios') {
    url = `sms:${number}&body=${encodeURIComponent(message)}`;
  } else {
    url = `sms:${number}?body=${encodeURIComponent(message)}`;
  }
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert('Error', 'SMS not supported on this device.');
  }
};

// Append a log event with timestamp to a local file
export const logEvent = async (event: string) => {
  const logPath = `${RNFS.DocumentDirectoryPath}/emergency_log.txt`;
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${event}\n`;
  try {
    await RNFS.appendFile(logPath, logEntry, 'utf8');
    Alert.alert('Log Updated', 'Event logged successfully.');
  } catch (error) {
    Alert.alert('Error', 'Failed to write to log file.');
  }
}; 