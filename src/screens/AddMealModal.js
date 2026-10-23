import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { kcal, MEAL_TYPES } from '../api';
import { Button, Chips, ErrorBox, Field } from '../components/ui';
import { colors } from '../theme';

function defaultMealType() {
  const hour = new Date().getHours();
  if (hour < 10) return 'BREAKFAST';
  if (hour < 15) return 'LUNCH';
  if (hour < 18) return 'SNACK';
  return 'DINNER';
}

// Registra um alimento no diário de hoje
export default function AddMealModal({ api, food, onClose, onSaved }) {
  const [mealType, setMealType] = useState(defaultMealType);
  const [amount, setAmount] = useState('100');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (food) {
      setMealType(defaultMealType());
      setAmount('100');
      setError(null);
    }
  }, [food]);

  const value = Number(amount.replace(',', '.')) || 0;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await api.addMeal({ mealType, foodId: food.id, grams: value });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={!!food} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {food && (
            <>
              <Text style={styles.title}>{food.name}</Text>
              <Text style={styles.muted}>{food.category} · por 100 g</Text>
              <View style={styles.grid}>
                <Info label="kcal" value={food.calories} />
                <Info label="Prot." value={food.protein} />
                <Info label="Carb." value={food.carbs} />
                <Info label="Gord." value={food.fat} />
              </View>
              <Text style={styles.label}>Refeição</Text>
              <Chips options={MEAL_TYPES} value={mealType} onChange={setMealType} />
              <Field
                label="Quantidade (g)"
                value={amount}
                onChangeText={(v) => setAmount(v.replace(/[^\d,.]/g, ''))}
                keyboardType="decimal-pad"
                hint={`${kcal((food.calories * value) / 100)} kcal`}
              />
              {error && <ErrorBox message={error} />}
              <Button title="Adicionar ao diário de hoje" onPress={save} loading={saving} disabled={value <= 0} />
              <Button title="Cancelar" variant="secondary" onPress={onClose} />
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Info({ label, value }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.7)' },
  card: { gap: 14, padding: 20, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 13 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  grid: { flexDirection: 'row', gap: 8 },
  info: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  infoValue: { color: colors.text, fontSize: 16, fontWeight: '700' },
});
