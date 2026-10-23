import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';

export function Button({ title, onPress, disabled, loading, variant = 'primary', style }) {
  const variantStyle = { primary: styles.primary, secondary: styles.secondary, danger: styles.danger }[variant];
  const textColor = variant === 'secondary' ? colors.text : colors.accentText;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        variantStyle,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && <Button title="Tentar de novo" variant="secondary" onPress={onRetry} />}
    </View>
  );
}

export function Field({ label, hint, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.muted} {...inputProps} />
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

export function Chips({ options, value, onChange, allowEmpty }) {
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(active && allowEmpty ? null : option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentTitle, active && { color: colors.text }]}>{option.label}</Text>
            {!!option.caption && <Text style={styles.segmentCaption}>{option.caption}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: '#B91C1C' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  errorBox: {
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#2A1416',
    borderWidth: 1,
    borderColor: '#5B2128',
  },
  errorText: { color: colors.danger, fontSize: 15, lineHeight: 21 },
  field: { gap: 6, flex: 1 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  hint: { color: colors.muted, fontSize: 12 },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 15,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextActive: { color: colors.accentText, fontWeight: '700' },
  segmented: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  segmentActive: { backgroundColor: colors.surfaceAlt },
  segmentTitle: { color: colors.muted, fontSize: 15, fontWeight: '700' },
  segmentCaption: { color: colors.muted, fontSize: 11, marginTop: 2 },
});
