import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { grams, kcal } from '../api';
import { Button, ErrorBox } from '../components/ui';
import { colors } from '../theme';

const EXAMPLES = [
  'Almocei arroz, feijão, um bife e salada de alface e tomate',
  'No café comi 2 ovos mexidos, um pão francês e um café com leite',
  'Jantei duas fatias de pizza de muçarela e um copo de refrigerante',
];

// POST /meals/analyze: a descrição em texto livre vira um JSON estruturado
export default function AnalyzeScreen({ api }) {
  const [description, setDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function analyze(text = description) {
    if (!text.trim()) return;
    setDescription(text);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await api.analyze(text.trim()));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>Descreva uma refeição com suas palavras. A IA estima os alimentos, as porções e as calorias.</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="O que você comeu?"
        placeholderTextColor={colors.muted}
        multiline
        textAlignVertical="top"
      />
      <Button title="Analisar refeição" onPress={() => analyze()} loading={loading} disabled={!description.trim()} />

      {!result && !loading && !error && (
        <View style={styles.examples}>
          <Text style={styles.caption}>Exemplos</Text>
          {EXAMPLES.map((e) => (
            <Pressable key={e} onPress={() => analyze(e)} style={({ pressed }) => [styles.example, pressed && { opacity: 0.7 }]}>
              <Text style={styles.exampleText}>{e}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {error && <ErrorBox message={error} />}

      {result && (
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.total}>{kcal(result.totalCalories)}</Text>
            <Text style={styles.caption}>kcal no total</Text>
          </View>
          <View style={styles.macros}>
            <Macro label="Proteínas" value={result.protein} />
            <Macro label="Carboidratos" value={result.carbs} />
            <Macro label="Gorduras" value={result.fat} />
          </View>
          {result.items.length === 0 && <Text style={styles.caption}>Nenhum alimento identificado.</Text>}
          {result.items.map((item, i) => (
            <View key={i} style={styles.item}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.food}</Text>
                <Text style={styles.caption}>{grams(item.grams)}</Text>
              </View>
              <Text style={styles.itemKcal}>{kcal(item.calories)} kcal</Text>
            </View>
          ))}
          <Text style={styles.note}>Estimativa feita pelo modelo. Nada foi registrado no diário.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function Macro({ label, value }) {
  return (
    <View style={styles.macro}>
      <Text style={styles.macroValue}>{grams(value)}</Text>
      <Text style={styles.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  intro: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  input: {
    minHeight: 110,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  examples: { gap: 8, marginTop: 8 },
  example: { padding: 12, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  exampleText: { color: colors.text, fontSize: 14 },
  caption: { color: colors.muted, fontSize: 13 },
  card: { gap: 12, padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  total: { color: colors.text, fontSize: 34, fontWeight: '800' },
  macros: { flexDirection: 'row', gap: 8 },
  macro: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: colors.surfaceAlt, alignItems: 'center' },
  macroValue: { color: colors.text, fontSize: 16, fontWeight: '700' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  itemName: { color: colors.text, fontSize: 15 },
  itemKcal: { color: colors.text, fontSize: 15, fontWeight: '700' },
  note: { color: colors.muted, fontSize: 12, fontStyle: 'italic' },
});
