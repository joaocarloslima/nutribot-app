import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { createApi } from './src/api';
import AddMealModal from './src/screens/AddMealModal';
import AnalyzeScreen from './src/screens/AnalyzeScreen';
import ChatScreen from './src/screens/ChatScreen';
import DiaryScreen from './src/screens/DiaryScreen';
import FoodsScreen from './src/screens/FoodsScreen';
import ProfileModal from './src/screens/ProfileModal';
import SettingsModal from './src/screens/SettingsModal';
import { colors } from './src/theme';

// No emulador Android, o computador é 10.0.2.2. No celular, troque pelo IP da rede.
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

const TABS = [
  { key: 'chat', label: 'Chat', title: 'NutriBot', icon: '💬' },
  { key: 'diary', label: 'Diário', title: 'Diário', icon: '📒' },
  { key: 'foods', label: 'Alimentos', title: 'Alimentos', icon: '🥦' },
  { key: 'analyze', label: 'Analisar', title: 'Analisar refeição', icon: '🔍' },
];

export default function App() {
  const [host, setHost] = useState(DEFAULT_HOST);
  const [tab, setTab] = useState('chat');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [food, setFood] = useState(null); // alimento aberto para registrar
  const [profile, setProfile] = useState(null); // perfil em edição
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);

  const refresh = () => setRefreshKey((k) => k + 1);
  const api = useMemo(() => createApi(host), [host]);
  const current = TABS.find((t) => t.key === tab);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.title}>{current.title}</Text>
          <Pressable
            onPress={() => setSettingsOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Configurar servidor"
            style={({ pressed }) => [styles.serverChip, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.serverText} numberOfLines={1}>
              ⚙︎ {host}
            </Text>
          </Pressable>
        </View>

        {/* as telas ficam montadas para o chat não perder a conversa ao trocar de aba */}
        <View style={styles.content}>
          <View style={[styles.screen, tab !== 'chat' && styles.hidden]}>
            <ChatScreen key={host} api={api} onMealsChanged={refresh} />
          </View>
          <View style={[styles.screen, tab !== 'diary' && styles.hidden]}>
            <DiaryScreen
              api={api}
              refreshKey={`${refreshKey}-${tab === 'diary'}`}
              onEditProfile={setProfile}
              onChanged={refresh}
            />
          </View>
          <View style={[styles.screen, tab !== 'foods' && styles.hidden]}>
            <FoodsScreen api={api} onSelect={setFood} />
          </View>
          <View style={[styles.screen, tab !== 'analyze' && styles.hidden]}>
            <AnalyzeScreen api={api} />
          </View>
        </View>

        {toast && (
          <View style={styles.toast} pointerEvents="none">
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.tabBarArea}>
        <View style={styles.tabBar}>
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={styles.tab}
              >
                <Text style={[styles.tabIcon, !active && { opacity: 0.5 }]}>{t.icon}</Text>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>

      <AddMealModal
        api={api}
        food={food}
        onClose={() => setFood(null)}
        onSaved={() => {
          showToast(`${food.name} adicionado ao diário`);
          setFood(null);
          refresh();
        }}
      />

      <ProfileModal
        api={api}
        profile={profile}
        onClose={() => setProfile(null)}
        onSaved={() => {
          setProfile(null);
          refresh();
        }}
      />

      <SettingsModal
        visible={settingsOpen}
        host={host}
        onClose={() => setSettingsOpen(false)}
        onSave={(newHost) => {
          setHost(newHost);
          setSettingsOpen(false);
        }}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', flexShrink: 1 },
  serverChip: {
    maxWidth: 150,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serverText: { color: colors.muted, fontSize: 13 },
  content: { flex: 1 },
  screen: { ...StyleSheet.absoluteFillObject },
  hidden: { display: 'none' },
  toast: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toastText: { color: colors.text, fontSize: 14 },
  tabBarArea: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  tabBar: { flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, minHeight: 56 },
  tabIcon: { fontSize: 22 },
  tabLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  tabLabelActive: { color: colors.accent, fontWeight: '700' },
});
