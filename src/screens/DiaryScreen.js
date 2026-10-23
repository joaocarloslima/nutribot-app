import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { dateLabel, goalLabel, grams, isoDate, kcal, MEAL_TYPES, mealTypeInfo } from '../api';
import { ErrorBox } from '../components/ui';
import { colors } from '../theme';

const DAY = 86400000;

export default function DiaryScreen({ api, refreshKey, onEditProfile, onChanged }) {
  const [date, setDate] = useState(() => new Date());
  const [summary, setSummary] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removing, setRemoving] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, p] = await Promise.all([api.summary(isoDate(date)), api.profile()]);
      setSummary(s);
      setProfile(p);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [api, date]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function remove(id) {
    setRemoving(id);
    try {
      await api.deleteMeal(id);
      onChanged?.();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setRemoving(null);
    }
  }

  const isToday = isoDate(date) === isoDate(new Date());
  const progress = summary ? Math.min(summary.consumedCalories / Math.max(summary.dailyCalories, 1), 1) : 0;
  const over = summary && summary.remainingCalories < 0;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.muted} />}
    >
      <View style={styles.dateBar}>
        <Pressable onPress={() => setDate(new Date(date.getTime() - DAY))} style={styles.arrow} accessibilityLabel="Dia anterior">
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <Text style={styles.dateText}>{dateLabel(date)}</Text>
        <Pressable
          onPress={() => setDate(new Date(date.getTime() + DAY))}
          disabled={isToday}
          style={[styles.arrow, isToday && { opacity: 0.3 }]}
          accessibilityLabel="Próximo dia"
        >
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>

      {profile && (
        <Pressable onPress={() => onEditProfile(profile)} style={({ pressed }) => [styles.profile, pressed && { opacity: 0.8 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileMeta}>
              {goalLabel(profile.goal)} · meta de {kcal(profile.dailyCalories)} kcal
            </Text>
          </View>
          <Text style={styles.edit}>Editar</Text>
        </Pressable>
      )}

      {error && <ErrorBox message={error} onRetry={load} />}
      {loading && !summary && <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} />}

      {summary && (
        <>
          <View style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.big}>{kcal(summary.consumedCalories)}</Text>
                <Text style={styles.caption}>de {kcal(summary.dailyCalories)} kcal</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.remaining, over && { color: colors.danger }]}>
                  {over ? `+${kcal(-summary.remainingCalories)}` : kcal(summary.remainingCalories)}
                </Text>
                <Text style={styles.caption}>{over ? 'kcal acima da meta' : 'kcal restantes'}</Text>
              </View>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${progress * 100}%` }, over && { backgroundColor: colors.danger }]} />
            </View>
            <View style={styles.macros}>
              <Macro label="Proteínas" value={summary.protein} />
              <Macro label="Carboidratos" value={summary.carbs} />
              <Macro label="Gorduras" value={summary.fat} />
            </View>
          </View>

          {summary.meals.length === 0 && <Text style={styles.empty}>Nenhuma refeição registrada neste dia.</Text>}

          {MEAL_TYPES.map((type) => {
            const meals = summary.meals.filter((m) => m.mealType === type.value);
            if (meals.length === 0) return null;
            const total = meals.reduce((sum, m) => sum + m.calories, 0);
            return (
              <View key={type.value} style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.mealTitle}>
                    {type.icon} {type.label}
                  </Text>
                  <Text style={styles.caption}>{kcal(total)} kcal</Text>
                </View>
                {meals.map((m) => (
                  <View key={m.id} style={styles.item}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{m.foodName}</Text>
                      <Text style={styles.caption}>
                        {grams(m.grams)} · {kcal(m.calories)} kcal
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => remove(m.id)}
                      disabled={removing === m.id}
                      accessibilityLabel={`Remover ${m.foodName}`}
                      style={({ pressed }) => [styles.remove, pressed && { opacity: 0.6 }]}
                    >
                      {removing === m.id ? (
                        <ActivityIndicator size="small" color={colors.muted} />
                      ) : (
                        <Text style={styles.removeText}>✕</Text>
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            );
          })}
          {/* refeições com tipo desconhecido não somem da tela */}
          {summary.meals.some((m) => !MEAL_TYPES.find((t) => t.value === m.mealType)) && (
            <Text style={styles.empty}>
              Há refeições com mealType fora do contrato:{' '}
              {summary.meals
                .filter((m) => !MEAL_TYPES.find((t) => t.value === m.mealType))
                .map((m) => mealTypeInfo(m.mealType).label)
                .join(', ')}
            </Text>
          )}
        </>
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
  dateBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  arrowText: { color: colors.text, fontSize: 30, lineHeight: 32 },
  dateText: { color: colors.text, fontSize: 17, fontWeight: '700' },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  profileMeta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  edit: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  big: { color: colors.text, fontSize: 34, fontWeight: '800' },
  remaining: { color: colors.success, fontSize: 24, fontWeight: '800' },
  caption: { color: colors.muted, fontSize: 13 },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5, backgroundColor: colors.accent },
  macros: { flexDirection: 'row', gap: 8 },
  macro: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: colors.surfaceAlt, alignItems: 'center' },
  macroValue: { color: colors.text, fontSize: 16, fontWeight: '700' },
  empty: { color: colors.muted, fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  mealTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  itemName: { color: colors.text, fontSize: 15 },
  remove: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: colors.muted, fontSize: 16 },
});
