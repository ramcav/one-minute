import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

type QuickAction = 'call' | 'sms' | 'log' | 'assessment';

interface QuickActionBarProps {
  onAction: (action: QuickAction) => void;
  disabled?: boolean;
}

const actions = [
  { key: 'call', emoji: '📞', label: 'Call Emergency', color: '#EF4444' },
  { key: 'sms', emoji: '✉️', label: 'Message Contact', color: '#F59E42' },
  { key: 'log', emoji: '📝', label: 'Log Event', color: '#3B82F6' },
  { key: 'assessment', emoji: '🩺', label: 'Assessment', color: '#10B981' },
] as const;

type ActionType = typeof actions[number]['key'];

const QuickActionBar: React.FC<QuickActionBarProps> = ({ onAction, disabled }) => (
  <View style={styles.quickActionBar}>
    {actions.map(action => (
      <TouchableOpacity
        key={action.key}
        style={[styles.quickActionButton, { backgroundColor: action.color }]}
        onPress={() => onAction(action.key as QuickAction)}
        disabled={disabled}
      >
        <Text style={styles.emoji}>{action.emoji}</Text>
        <Text style={styles.label}>{action.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  quickActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 8,
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  emoji: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 2,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default QuickActionBar; 