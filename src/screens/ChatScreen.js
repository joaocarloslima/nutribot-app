import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { newConversationId } from '../api';
import { colors } from '../theme';

// Sugestões que exercitam cada requisito: RAG, memória e tool calling
const SUGGESTIONS = [
  'Quantos copos de água devo tomar por dia?',
  'Qual o horário de atendimento da clínica?',
  'Quantas calorias ainda posso comer hoje?',
  'Comi uma banana prata de 120 g no lanche, registra pra mim.',
  'Quantas calorias tem 100 g de tapioca?',
  'Qual é o meu nome?',
];

export default function ChatScreen({ api, onMealsChanged }) {
  const [conversationId, setConversationId] = useState(newConversationId);
  const [messages, setMessages] = useState([]); // { role: 'user' | 'bot' | 'error', text }
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, sending]);

  async function send(message) {
    const content = message.trim();
    if (!content || sending) return;
    setText('');
    setMessages((list) => [...list, { role: 'user', text: content }]);
    setSending(true);
    try {
      const answer = await api.chat(conversationId, content);
      setMessages((list) => [...list, { role: 'bot', text: answer }]);
      onMealsChanged?.(); // uma tool pode ter registrado refeição
    } catch (e) {
      setMessages((list) => [...list, { role: 'error', text: e.message }]);
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setConversationId(newConversationId());
    setMessages([]);
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.bar}>
        <Text style={styles.conversation} numberOfLines={1}>
          conversationId: {conversationId}
        </Text>
        <Pressable
          onPress={reset}
          accessibilityRole="button"
          style={({ pressed }) => [styles.newButton, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.newText}>↺ Nova conversa</Text>
        </Pressable>
      </View>

      <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.list}>
        {messages.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🥗</Text>
            <Text style={styles.emptyTitle}>Oi! Eu sou a NutriBot.</Text>
            <Text style={styles.emptyText}>
              Pergunte sobre alimentação, peça para registrar uma refeição ou consultar o seu dia.
            </Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {messages.map((m, i) => (
          <View
            key={i}
            style={[styles.bubble, m.role === 'user' ? styles.user : m.role === 'bot' ? styles.bot : styles.error]}
          >
            <Text style={[styles.bubbleText, m.role === 'error' && { color: colors.danger }]}>{m.text}</Text>
          </View>
        ))}

        {sending && (
          <View style={[styles.bubble, styles.bot, styles.typing]}>
            <ActivityIndicator color={colors.muted} size="small" />
            <Text style={styles.typingText}>pensando…</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Escreva sua mensagem"
          placeholderTextColor={colors.muted}
          multiline
          onSubmitEditing={() => send(text)}
          blurOnSubmit={false}
          onKeyPress={(e) => {
            // no navegador, Enter envia e Shift+Enter quebra a linha
            if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
              e.preventDefault();
              send(text);
            }
          }}
        />
        <Pressable
          onPress={() => send(text)}
          disabled={!text.trim() || sending}
          accessibilityRole="button"
          accessibilityLabel="Enviar"
          style={({ pressed }) => [
            styles.send,
            (!text.trim() || sending) && { opacity: 0.4 },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={styles.sendText}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  conversation: { flex: 1, color: colors.muted, fontSize: 12, fontFamily: 'monospace' },
  newButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  newText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 24 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  emptyText: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  suggestions: { gap: 8, marginTop: 12, alignSelf: 'stretch' },
  suggestion: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionText: { color: colors.text, fontSize: 14 },
  bubble: { maxWidth: '85%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  user: { alignSelf: 'flex-end', backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  bot: { alignSelf: 'flex-start', backgroundColor: colors.surfaceAlt, borderBottomLeftRadius: 4 },
  error: { alignSelf: 'stretch', maxWidth: '100%', backgroundColor: '#2A1416', borderWidth: 1, borderColor: '#5B2128' },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 21 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { color: colors.muted, fontSize: 14 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
  },
  send: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  sendText: { color: colors.accentText, fontSize: 18 },
});
