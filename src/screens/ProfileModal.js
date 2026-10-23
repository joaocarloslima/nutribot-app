import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { GOALS } from '../api';
import { Button, Chips, ErrorBox, Field } from '../components/ui';
import { colors } from '../theme';

export default function ProfileModal({ api, profile, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('MAINTAIN');
  const [calories, setCalories] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setGoal(profile.goal ?? 'MAINTAIN');
      setCalories(String(profile.dailyCalories ?? ''));
      setError(null);
    }
  }, [profile]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await api.updateProfile({ name: name.trim(), goal, dailyCalories: Number(calories) });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={!!profile} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Perfil</Text>
          <Field label="Nome" value={name} onChangeText={setName} />
          <Text style={styles.label}>Objetivo</Text>
          <Chips options={GOALS} value={goal} onChange={setGoal} />
          <Field
            label="Meta diária (kcal)"
            value={calories}
            onChangeText={(v) => setCalories(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            hint="Entre 1000 e 5000"
          />
          {error && <ErrorBox message={error} />}
          <Button title="Salvar" onPress={save} loading={saving} disabled={!name.trim() || !calories} />
          <Button title="Cancelar" variant="secondary" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.7)' },
  card: { gap: 14, padding: 20, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
