# NutriBot App

App em Expo para testar a **NutriBot API** do Projeto Diamante (Java Advanced, segundo semestre).

O app só funciona se a API seguir o contrato do enunciado. Se a resposta vier fora do formato, o app mostra o que esperava.

## Telas

| Aba | Rotas usadas |
|---|---|
| 💬 Chat | `POST /chat` — o app gera o `conversationId`; **Nova conversa** troca o id e a memória recomeça |
| 📒 Diário | `GET /summary`, `GET /profile`, `PUT /profile`, `DELETE /meals/{id}` |
| 🥦 Alimentos | `GET /foods?name=`, `POST /meals` |
| 🔍 Analisar | `POST /meals/analyze` |

Depois de cada resposta do chat o diário é recarregado, então dá para ver na hora uma refeição registrada por tool calling.

## Como rodar

```bash
npm install
npx expo start
```

- **Navegador**: tecle `w`.
- **Celular**: abra o Expo Go e leia o QR code. O celular e o computador precisam estar na mesma rede.
- **Emulador Android**: tecle `a`.

A API precisa estar rodando na porta 8080. Toque no botão ⚙︎ do topo para trocar o endereço do servidor: no celular, use o IP do computador na rede (ex.: `192.168.0.10`); no emulador Android, `10.0.2.2`.

As chamadas ao chat e à análise esperam até 90 segundos, porque o modelo pode demorar.
