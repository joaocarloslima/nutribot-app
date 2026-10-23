import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { kcal } from '../api';
import { ErrorBox } from '../components/ui';
import { colors } from '../theme';

export default function FoodsScreen({ api, onSelect }) {
  const [name, setName] = useState('');
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);

  // busca enquanto digita, com uma pequena espera
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.foods(name);
        if (!Array.isArray(data)) throw new Error('Resposta fora do contrato: esperava uma lista de alimentos.');
        if (active) setFoods(data);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [api, name, retry]);

  return (
    <View style={styles.flex}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.search}
          value={name}
          onChangeText={setName}
          placeholder="Buscar alimento (ex.: frango)"
          placeholderTextColor={colors.muted}
          autoCorrect={false}
        />
      </View>
      {error ? (
        <View style={{ padding: 16 }}>
          <ErrorBox message={error} onRetry={() => setRetry((r) => r + 1)} />
        </View>
      ) : (
        <FlatList
          data={foods}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.count}>
              {loading ? ' ' : `${foods.length} ${foods.length === 1 ? 'alimento' : 'alimentos'} · valores por 100 g`}
            </Text>
          }
          ListEmptyComponent={
            loading ? <ActivityIndicator color={colors.accent} /> : <Text style={styles.empty}>Nada encontrado.</Text>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => onSelect(item)} style={({ pressed }) => [styles.item, pressed && { opacity: 0.8 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.category} · P {item.protein} · C {item.carbs} · G {item.fat}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.kcal}>{kcal(item.calories)}</Text>
                <Text style={styles.meta}>kcal</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchBox: { padding: 16, paddingBottom: 8 },
  search: {
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
  },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  count: { color: colors.muted, fontSize: 13, marginBottom: 4 },
  empty: { color: colors.muted, fontSize: 14, textAlign: 'center', paddingVertical: 24 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { color: colors.text, fontSize: 15, fontWeight: '600' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  kcal: { color: colors.text, fontSize: 18, fontWeight: '800' },
});
