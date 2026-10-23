import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { createApi } from '../api';
import { Button } from '../components/ui';
import { colors } from '../theme';

export default function SettingsModal({ visible, host, onSave, onClose }) {
  const [value, setValue] = useState(host);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (visible) {
      setValue(host);
      setResult(null);
    }
  }, [visible, host]);

  const cleanHost = value.trim().replace(/^https?:\/\//, '').replace(/[:/].*$/, '');
  const api = createApi(cleanHost || 'localhost');

  async function test() {
    setTesting(true);
    try {
      const foods = await api.foods();
      setResult({ ok: true, message: `Conectado: ${foods.length} alimentos na tabela.` });
    } catch (e) {
      setResult({ ok: false, message: e.message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Servidor</Text>
          <Text style={styles.muted}>
            Endereço do computador onde a API está rodando, na porta 8080. No celular, use o IP da rede
            (ex.: 192.168.0.10). No emulador Android, use 10.0.2.2.
          </Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="192.168.0.10"
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.url}>{api.base}</Text>
          {result && (
            <Text style={[styles.result, { color: result.ok ? colors.success : colors.danger }]}>
              {result.ok ? '✓ ' : '✕ '}
              {result.message}
            </Text>
          )}
          <Button title="Testar conexão" variant="secondary" onPress={test} loading={testing} />
          <Button title="Salvar" onPress={() => onSave(cleanHost)} disabled={!cleanHost} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.7)' },
  card: {
    gap: 14,
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 16,
  },
  url: { color: colors.muted, fontSize: 13, fontFamily: 'monospace' },
  result: { fontSize: 14, lineHeight: 20 },
});
