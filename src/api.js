// Cliente da NutriBot API (Projeto Diamante), porta 8080.
// As rotas /chat e /meals/analyze são as que a equipe implementa; as demais já vêm no projeto base.

const TIMEOUT_MS = 15000;
const AI_TIMEOUT_MS = 90000; // o modelo pode demorar, ainda mais com tools e RAG

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const STATUS_MESSAGES = {
  400: 'Dados inválidos.',
  404: 'Não encontrado.',
  405: 'Método não suportado.',
  500: 'Erro interno no servidor.',
};

async function request(url, { method = 'GET', body, timeout = TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    throw new ApiError(
      0,
      error.name === 'AbortError'
        ? 'O servidor demorou demais para responder.'
        : `Não foi possível conectar em ${url}`,
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const serverMessage = data && typeof data === 'object' ? data.error : null;
    const base = STATUS_MESSAGES[response.status] ?? 'Erro no servidor.';
    let message = `${response.status} · ${base}`;
    if (response.status === 404 && !serverMessage) message += '\nA rota existe na sua API?';
    if (serverMessage) message += `\n${serverMessage}`;
    throw new ApiError(response.status, message);
  }
  return data;
}

function query(params) {
  const parts = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value).trim())}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

function contractError(message) {
  return new ApiError(0, `Resposta fora do contrato: ${message}`);
}

export function createApi(host) {
  const base = `http://${host}:8080`;

  return {
    base,

    // ---- projeto base ----
    foods: (name) => request(`${base}/foods${query({ name })}`),
    summary: (date) => request(`${base}/summary${query({ date })}`),
    addMeal: (meal) => request(`${base}/meals`, { method: 'POST', body: meal }),
    deleteMeal: (id) => request(`${base}/meals/${id}`, { method: 'DELETE' }),
    profile: () => request(`${base}/profile`),
    updateProfile: (profile) => request(`${base}/profile`, { method: 'PUT', body: profile }),

    // ---- rotas da equipe ----
    async chat(conversationId, message) {
      const data = await request(`${base}/chat`, {
        method: 'POST',
        body: { conversationId, message },
        timeout: AI_TIMEOUT_MS,
      });
      if (!data || typeof data !== 'object' || typeof data.answer !== 'string') {
        throw contractError('esperava {"answer": "..."}.');
      }
      return data.answer;
    },

    async analyze(description) {
      const data = await request(`${base}/meals/analyze`, {
        method: 'POST',
        body: { description },
        timeout: AI_TIMEOUT_MS,
      });
      if (!data || typeof data !== 'object' || !Array.isArray(data.items)) {
        throw contractError('esperava {"items": [...], "totalCalories", "protein", "carbs", "fat"}.');
      }
      const missing = ['totalCalories', 'protein', 'carbs', 'fat'].filter((key) => typeof data[key] !== 'number');
      if (missing.length) throw contractError(`faltam os campos numéricos ${missing.join(', ')}.`);
      const badItem = data.items.find(
        (item) => typeof item?.food !== 'string' || typeof item?.grams !== 'number' || typeof item?.calories !== 'number',
      );
      if (badItem) throw contractError('cada item deve ter {"food": texto, "grams": número, "calories": número}.');
      return data;
    },
  };
}

// id de conversa gerado no app: cada "Nova conversa" troca o id, e a memória recomeça
export function newConversationId() {
  const random = Math.random().toString(36).slice(2, 8);
  return `app-${Date.now().toString(36)}-${random}`;
}

export const MEAL_TYPES = [
  { value: 'BREAKFAST', label: 'Café da manhã', icon: '☕' },
  { value: 'LUNCH', label: 'Almoço', icon: '🍽️' },
  { value: 'SNACK', label: 'Lanche', icon: '🍎' },
  { value: 'DINNER', label: 'Jantar', icon: '🌙' },
];

export const GOALS = [
  { value: 'LOSE_WEIGHT', label: 'Emagrecer' },
  { value: 'MAINTAIN', label: 'Manter' },
  { value: 'GAIN_MUSCLE', label: 'Ganhar massa' },
];

export const mealTypeInfo = (value) => MEAL_TYPES.find((m) => m.value === value) ?? { label: value, icon: '•' };
export const goalLabel = (value) => GOALS.find((g) => g.value === value)?.label ?? value;

// 1234.5 → "1.235"
export const kcal = (value) => Math.round(value ?? 0).toLocaleString('pt-BR');
export const grams = (value) => `${Math.round((value ?? 0) * 10) / 10} g`.replace('.', ',');

// datas no formato do contrato (yyyy-MM-dd), no fuso local
export function isoDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export function dateLabel(date) {
  const today = isoDate(new Date());
  const yesterday = isoDate(new Date(Date.now() - 86400000));
  const value = isoDate(date);
  if (value === today) return 'Hoje';
  if (value === yesterday) return 'Ontem';
  return `${WEEKDAYS[date.getDay()]}, ${value.slice(8, 10)}/${value.slice(5, 7)}`;
}
