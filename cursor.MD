# Fluxo Bank — Guia do projeto (`cursor.MD`)

Documento único de referência: fundamentos, stack, ambiente, estrutura e operação.

### Índice

1. [Visão geral da arquitetura](#1-visão-geral-da-arquitetura)
2. [Stack tecnológico completo](#2-stack-tecnológico-completo)
3. [Todas as variáveis de ambiente](#3-todas-as-variáveis-de-ambiente)
4. [Estrutura de diretórios](#4-estrutura-de-diretórios)
5. [Lista de serviços, jobs e models](#5-lista-de-serviços-jobs-e-models)
6. [Common hurdles](#6-common-hurdles-armadilhas-comuns-e-soluções)
7. [Design patterns do projeto](#7-design-patterns-do-projeto)
8. [Pipeline semanal com horários](#8-pipeline-semanal-com-horários)
9. [Checklist pós-implementação](#9-checklist-pós-implementação)
10. [Apêndice — texto integral do guia original](#apêndice--texto-integral-preservado-do-guia-original)

---

## 1. Visão geral da arquitetura

### Objetivo do produto

Para o portfólio (**Fluxo Bank**), a stack deve suportar alta concorrência, segurança em transações Pix e padrões de projeto aplicáveis desde o início. Inspiração de negócio e UX: neobanks e fintechs (Pix, extrato, segurança invisível).

### Benchmarks de produto (referência)

Para servir de inspiração para o **Fluxo Bank**, é útil olhar para diferentes modelos de negócio, desde os gigantes consolidados até as fintechs que revolucionaram a experiência do utilizador.

Aqui estão os principais exemplos, divididos por categoria, para que possa analisar as suas funcionalidades e arquitetura:

#### Neobanks e Fintechs Brasileiras (referência em Pix e UX)

Estes são os melhores exemplos para estudar a implementação do Pix e fluxos de ecrã limpos:

- **Nubank:** Referência em interface minimalista e UX. Observar "dinheiro guardado" nas "Caixinhas" (ideal para casos de uso tipo Case 5).
- **Banco Inter:** Exemplo de "Super App" (banking, investimentos, shopping) se quiser expandir o Fluxo Bank no futuro.
- **C6 Bank:** Personalização e pontos; estrutura de segurança e limites de transferência.
- **BTG Pactual (Digital):** Público de investimentos, interface mais sóbria e relatórios de rentabilidade.

#### Neobanks internacionais (tecnologia e escala)

Com o projeto visando suportar muitos utilizadores e padrões de mercado:

- **Revolut:** Rapidez em transferências internacionais e robustez da aplicação.
- **Monzo:** Transparência e documentação de API; blog de engenharia sobre sistemas distribuídos.
- **N26:** Simplicidade; subcontas (Spaces) com regras de arredondamento.

#### Bancos de nicho (negócios e programadores)

- **Cora:** Foco PJ — gestão de caixa e relatórios.
- **Mercury (EUA):** Startups; gestão de equipa e limites.

**O que observar nestes exemplos para o projeto:**

1. **Tratamento de erros:** Como comunicam falhas de rede ou saldo insuficiente.
2. **Performance de carregamento:** Extrato com cache local e paginação eficiente no backend.
3. **Segurança invisível:** Autenticação extra (biometria/PIN) para valores altos — requisito interessante para portfólio.
4. **Feedback visual:** Micro-animações ao mover dinheiro entre conta e áreas de poupança.

Escolher um benchmark principal ajuda a justificar decisões técnicas perante recrutadores.

### Arquitetura em camadas (Clean Architecture)

A Clean Architecture coloca a **lógica de negócio no centro**, protegendo-a de frameworks, banco de dados e UI: [42coffeecups](https://www.42coffeecups.com/blog/software-architecture-best-practices)

```
[ Entities ] ← Regras de negócio puras, sem dependências externas
     ↑
[ Use Cases ] ← Orquestração dos fluxos da aplicação
     ↑
[ Interface Adapters ] ← Controllers, Presenters, Gateways
     ↑
[ Frameworks & Drivers ] ← Express/Nest, React, PostgreSQL, Redis
```

- **Regra de dependência:** Camadas internas **nunca dependem** das externas — a seta aponta para dentro.
- **Entities:** Domínio com regras de negócio independentes de framework.
- **Use Cases:** Coordenam entities para um caso de uso (ex.: `CreateOrderUseCase`).
- **Interface Adapters:** Controllers REST, DTOs, tradução entre aplicação e frameworks.
- **Testabilidade:** Núcleo sem dependência de infraestrutura — testes de regras sem BD/HTTP.
- **Inversão de dependência:** O use case define `IUserRepository`; a infra implementa (PostgreSQL, etc.).

### Front-end e back-end no desenho geral

- **Front-end:** Mobile-first, performance (code splitting, React Query no extrato), segurança no cliente (XSS, CSP, tokens).
- **Back-end:** REST versionada, JWT/OAuth, filas para Pix assíncrono, PostgreSQL ACID, Redis para cache e rate limiting.
- **Mensageria:** Intenção de Pix na fila para não travar a requisição; DLQ para falhas repetidas.

> **Dica prática (Helios AI, Prato Mágico, etc.):** Aplicar Clean Architecture no back-end desde o início, SOLID na estrutura de módulos, e no front code splitting + React Query para performance — escala sem reescritas drásticas.

---

## 2. Stack tecnológico completo

### Visão consolidada (Fluxo Bank)

Para o Fluxo Bank, a combinação indicada é **React + Node.js com TypeScript**, com responsabilidades bem separadas.

#### Backend (motor)

| Camada | Tecnologia | Motivo |
|--------|------------|--------|
| Framework | **NestJS** | TypeScript nativo, módulos e injeção de dependência desde o dia um; adequado a Repository e Unit of Work. *Alternativa:* Fastify puro (arquitetura manual). |
| Banco | **PostgreSQL** | ACID forte para transações financeiras. |
| ORM | **TypeORM** ou **Drizzle ORM** | TypeORM integra bem ao NestJS; Drizzle favorece performance e SQL explícito. |
| Validação | **Zod** (ou **class-validator** com TypeORM) | Validar corpo das requisições (ex.: CPF no Pix) antes da regra de negócio. |

#### Frontend (interface)

| Camada | Tecnologia | Motivo |
|--------|------------|--------|
| Core | **React + Vite** (SPA) | Internet banking é dashboard autenticado; sem necessidade de SEO como prioridade — Vite é rápido e prático. |
| Dados do servidor | **TanStack Query (React Query)** | Cache de saldo, paginação infinita do extrato, loading/error. |
| Estado local | **Zustand** | Dados globais leves (usuário logado, tema dark/light); menos burocrático que Redux. |
| UI | **Tailwind CSS** + **shadcn/ui** | Velocidade de estilo; componentes copiados ao projeto com controle total da identidade Fluxo Bank. |
| Formulários | **React Hook Form** + **Zod** | Pix, guardar dinheiro — menos re-renders, validação instantânea. |

#### Testes e qualidade

| Tipo | Ferramenta | Motivo |
|------|------------|--------|
| Unitário (back/front) | **Vitest** | Alinhado ao Vite; rápido em TypeScript. |
| E2E | **Playwright** | Fluxos críticos (login, transferir, saldo atualizado). |

#### DevOps e assincronia

| Função | Tecnologia | Motivo |
|--------|------------|--------|
| Contêineres | **Docker** | PostgreSQL, Redis e ambiente reproduzível. |
| Filas | **RabbitMQ** ou **Redis (BullMQ)** | Processamento Pix sem bloquear a API sob carga. |

### Fundamentos adicionais já adotados no guia

**Front-end**

- HTML semântico, CSS modular (Modules, SCSS, Tailwind), mobile-first, Flexbox/Grid, unidades relativas, a11y, Core Web Vitals, touch targets ≥ 44×44px.
- Performance: lazy loading, code splitting, minificação/tree-shaking, CSS crítico, `async`/`defer`, WebP, CDN, HTTP/3.
- API no cliente: Axios/Fetch com interceptors, loading/error boundaries, SWR/React Query, `AbortController`, env com `VITE_` / `NEXT_PUBLIC_`.

**Back-end**

- Estruturas de dados conscientes de Big-O (array, hash map, set, heap, árvores, grafos).
- REST: recursos como substantivos, verbos HTTP corretos, versionamento `/api/v1/`, status codes, paginação, field filtering, erros padronizados, JWT/OAuth stateless.
- HTTP: headers, CORS explícito, HTTPS, rate limiting, cache headers, gzip/brotli.
- Performance: evitar N+1, connection pooling, Redis, paginação no BD, streaming, profiling, índices.

**Segurança (resumo da stack de práticas)**

- Front: XSS, CSP, CSRF, cookies `httpOnly`, validação dupla, SRI.
- Back: OAuth2/OIDC, JWT curto + refresh, RBAC, menor privilégio, SQL parametrizado, rate limiting login, sem stack trace ao cliente, secrets em env/Vault.
- Dados: TLS 1.2+, AES-256 em repouso, bcrypt/argon2, HSTS, rotação de chaves.
- Pipeline: SAST, DAST, `npm audit`/Dependabot, SBOM, monitoramento.

---

## 3. Todas as variáveis de ambiente

```env
# ==========================================
# 1. CONFIGURAÇÕES DA APLICAÇÃO (APP)
# ==========================================
NODE_ENV=development               # development, testing, staging, production
PORT=3000                          # Porta exposta da API
API_PREFIX=/api/v1                 # Versionamento da API
TZ=UTC                             # Fuso horário base do servidor (Padrão ouro para bancos: UTC. A conversão para o horário de Fortaleza ou outro local ocorre no frontend)

# ==========================================
# 2. BANCO DE DADOS RELACIONAL (POSTGRESQL / MYSQL)
# ==========================================
# Essencial para garantir a consistência (ACID) do core bancário
DB_HOST=localhost
DB_PORT=5432
DB_USER=fluxo_db_admin
DB_PASSWORD=super_secret_password
DB_NAME=fluxo_bank_db
DB_SSL_MODE=require                # Para tráfego criptografado entre API e BD
DB_POOL_MIN=5                      # Gerenciamento de conexões para alta concorrência
DB_POOL_MAX=50

# ==========================================
# 3. CACHE E RATE LIMITING (REDIS)
# ==========================================
# Usado para bloquear ataques de força bruta no login e guardar sessões rápidas
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_secret
REDIS_DB=0

# ==========================================
# 4. MENSAGERIA / PROCESSAMENTO ASSÍNCRONO (RABBITMQ / KAFKA / SQS)
# ==========================================
# Fila onde a intenção do Pix é colocada para não travar a requisição do usuário
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_PIX_QUEUE=pix_processing_queue
RABBITMQ_DLQ=pix_dead_letter_queue # Fila para Pix que falharam repetidamente

# ==========================================
# 5. SEGURANÇA E AUTENTICAÇÃO (JWT & CRIPTOGRAFIA)
# ==========================================
# Chaves para emissão de tokens e criptografia at-rest de dados sensíveis (LGPD)
JWT_SECRET=sua_chave_secreta_jwt_muito_longa_e_complexa
JWT_EXPIRES_IN=15m                 # Token de vida curta por segurança bancária
JWT_REFRESH_SECRET=sua_chave_secreta_para_refresh_token
JWT_REFRESH_EXPIRES_IN=7d
DATA_ENCRYPTION_KEY=chave_AES_256_para_encriptar_cpfs_e_historicos
BCRYPT_SALT_ROUNDS=12              # Custo do algoritmo de hash de senhas

# ==========================================
# 6. INTEGRAÇÕES EXTERNAS (SIMULANDO O BANCO CENTRAL / BACEN)
# ==========================================
# Mock de integração para liquidar a transferência Pix externamente
BACEN_API_URL=https://api.sandbox.bcb.gov.br/pix/v1
BACEN_API_CLIENT_ID=seu_client_id_do_bacen
BACEN_API_CLIENT_SECRET=seu_client_secret_do_bacen
BACEN_WEBHOOK_SECRET=chave_para_validar_o_payload_que_o_bacen_te_manda

# ==========================================
# 7. OBSERVABILIDADE E LOGS (DATADOG, SENTRY, ELK)
# ==========================================
# Crucial para achar gargalos nos 10.000 usuários
LOG_LEVEL=info                     # debug, info, warn, error
SENTRY_DSN=https://chave@sentry.io/projeto
DATADOG_API_KEY=sua_chave_api_datadog

# ==========================================
# 8. CORS E FRONTEND
# ==========================================
# Quais domínios têm permissão para chamar a sua API
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://app.fluxobank.com
FRONTEND_URL=https://app.fluxobank.com
```

---

## 4. Estrutura de diretórios

Proposta alinhada a **NestJS + Clean Architecture + SPA Vite** (ajuste nomes conforme o monorepo real).

```text
fluerebank/
├── apps/
│   ├── api/                          # Backend NestJS
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── config/               # ConfigModule, validação de env (Zod)
│   │   │   ├── domain/               # Entities, value objects (sem framework)
│   │   │   ├── application/          # Use cases, ports (interfaces)
│   │   │   ├── infrastructure/       # ORM, Redis, RabbitMQ, HTTP clients
│   │   │   └── presentation/         # Controllers, guards, DTOs, filtros HTTP
│   │   ├── test/
│   │   └── Dockerfile
│   └── web/                          # Frontend React + Vite
│       ├── src/
│       │   ├── app/                  # Rotas, providers (QueryClient)
│       │   ├── features/             # Por domínio: auth, account, pix, statement
│       │   ├── components/           # UI compartilhada (shadcn)
│       │   ├── hooks/
│       │   ├── lib/                  # api client, utils
│       │   └── assets/
│       ├── index.html
│       └── vite.config.ts
├── packages/                         # (opcional) shared types, eslint-config
├── docker-compose.yml                # Postgres, Redis, RabbitMQ
├── .env.example
└── README.md
```

*Nota:* Esta árvore é convencional; refine quando os módulos Nest (`auth`, `accounts`, `transactions`, `pix`) estiverem definidos.

---

## 5. Lista de serviços, jobs e models

Derivado do guia (Pix, filas, extrato, limites). Complete com nomes de classes reais quando implementar.

### Serviços de aplicação (exemplos)

| Área | Responsabilidade |
|------|------------------|
| Autenticação / sessão | Login, refresh token, RBAC |
| Conta / saldo | Consulta de saldo, subcontas / “caixinhas” |
| Pix | Criação de intenção, validação de limites e fraude |
| Extrato | Listagem paginada / cursor de movimentações |
| Notificações | E-mail / push após eventos (Observer + fila) |
| Integração Bacen (mock) | Liquidação sandbox, validação de webhook |

### Jobs / filas

| Job / fila | Descrição |
|------------|-----------|
| `pix_processing_queue` | Consumidor que processa Pix após enfileiramento |
| `pix_dead_letter_queue` | Mensagens que falharam repetidamente — análise manual ou retry policy |
| (opcional) `statement_aggregation` | Pré-agregações ou materializações se o volume exigir |

### Models / entidades (conceituais)

| Conceito | Notas |
|----------|--------|
| User | Credenciais, perfil, papéis |
| Account | Saldo, agência/conta, vínculo ao usuário |
| Transaction | Movimentações; estados de ciclo de vida (ver State Pattern) |
| PixInstruction / PixTransfer | Dados específicos Pix (chave, valor, horário) |
| AuditLog | Trilha para compliance e disputas |

---

## 6. Common hurdles (armadilhas comuns) e soluções

Documente aqui problemas recorrentes e a solução validada no projeto.

| Problema | Sintoma ou contexto | Solução documentada |
|----------|---------------------|---------------------|
| **APIs que exigem browser real** | Scraping ou APIs que retornam HTML/JS dinâmico; requests HTTP simples falham ou retornam página de bloqueio. | Ex.: **Yahoo Finance** (e muitos sites financeiros) exige **Chromium** (Playwright/Puppeteer), não apenas **HTTParty** ou `fetch` — renderizar JS e cookies conforme o site. |
| JWT no `localStorage` | XSS pode roubar token | Preferir cookies **httpOnly** + **Secure**; CSP rigorosa |
| N+1 queries | Lentidão em listagens com relações | Eager loading / joins; DataLoader em GraphQL se usar |
| Transações parciais (Pix) | Débito sem crédito ou vice-versa | **Unit of Work** + transação única no BD |
| Estado de Pix com `if/else` espalhado | Bugs ao mudar regra por estado | **State Pattern** (`PENDING` → `PROCESSING` → `COMPLETED` / `FAILED`) |
| Limites dia/noite duplicados em um só método | Função gigante de validação | **Strategy** (`DayTimeLimitStrategy` / `NightTimeLimitStrategy`) |
| CORS `*` em produção | CSRF / vazamento de superfície | Origens explícitas (`CORS_ALLOWED_ORIGINS`) |

*Adicione linhas à tabela conforme encontrar novos “hurdles” no desenvolvimento.*

---

## 7. Design patterns do projeto

### Princípios gerais (Clean Code e SOLID)

**Clean Code** — código legível para humanos: [pullchecklist](https://www.pullchecklist.com/posts/clean-code-principles)

- Nomes que revelam intenção; funções pequenas; comentários só para *por quê*.
- Poucos argumentos (preferir objeto de configuração); DRY; Lei de Demeter; erros tratados explicitamente.

**SOLID:** [42coffeecups](https://www.42coffeecups.com/blog/software-architecture-best-practices)

- **S:** Uma responsabilidade por módulo (`UserRepository` vs `UserValidator`).
- **O:** Extensão por novas classes/estratégias, não edição massiva de código legado.
- **L:** Subtipos substituíveis sem quebrar contratos.
- **I:** Interfaces pequenas (ex.: não forçar `EmailSender` a implementar SMS).
- **D:** Dependência de abstrações, não de implementações concretas.

### Catálogo clássico de padrões

Os padrões são soluções comprovadas para problemas recorrentes: [pullchecklist](https://www.pullchecklist.com/posts/clean-code-principles)

**Criacionais:** Factory Method; Singleton (com cautela); Builder.

**Estruturais:** Adapter (APIs de terceiros); Decorator; **Repository** (acesso a dados desacoplado do domínio).

**Comportamentais:** **Strategy**; **Observer** (eventos/pub-sub); **Command** (fila, undo, logging).

### Padrões aplicados ao Fluxo Bank (onde usar)

Para um projeto onde segurança, concorrência e clareza importam, estes padrões reduzem “código espaguete” e melhoram testes.

#### Estruturais e de criação

- **Repository:** Camada de dados — interface `ITransactionRepository` com `save`, `findByAccountId`; implementação ORM + **MockRepository** em memória para testes rápidos sem BD real.
- **Unit of Work:** Junto ao Repository no caso de uso **Transferência/Pix** — atomicidade: débito, crédito e log do extrato na mesma transação; rollback se qualquer passo falhar.

#### Comportamentais

- **State:** Ciclo de vida de Pix/resgate — `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `REFUNDED`; evita dezenas de `if/else` inconsistentes.
- **Strategy:** Limites/taxas variando (ex.: dia vs noite) — `DayTimeLimitStrategy` / `NightTimeLimitStrategy` em vez de uma função monolítica.
- **Observer / Pub-Sub:** Após “Enviar Pix”, publicar evento: fila RabbitMQ, notificação, auditoria — assíncrono, API responde rápido.

#### Front-end (React)

- **Container / Presentational (ou hooks):** Telas pesadas (extrato, relatórios) — ex.: `useStatement(accountId)` para fetch, paginação e loading; componente visual só renderiza dados.

---

## 8. Pipeline semanal com horários

Modelo sugerido para manutenção contínua (ajuste ao fuso da equipa; servidor em **UTC** conforme variáveis de ambiente).

| Dia / horário (UTC) | Atividade |
|---------------------|-----------|
| **Segunda 09:00** | Revisão de dependências (`npm audit`, Dependabot); planejar correções de CVE |
| **Terça 10:00** | Backup verificado de BD (restore test em staging) |
| **Quarta 11:00** | Revisão de logs/alertas (Sentry/Datadog); limpeza de DLQ antiga |
| **Quinta 09:00** | Testes E2E críticos (Playwright) no branch de release |
| **Sexta 16:00** | Retrospectiva rápida de incidentes da semana; atualizar secção **Common hurdles** deste doc |
| **Domingo 03:00** *(opcional)* | Janela de deploy com menor tráfego (se aplicável ao ambiente de produção) |

*DevSecOps no dia a dia:* SAST em PR, DAST periódico, dependency scanning, SBOM — alinhado às práticas já descritas na secção de segurança.

---

## 9. Checklist pós-implementação

Use antes de considerar uma feature ou release “fechada”.

### Funcional e API

- [ ] Contratos REST alinhados a `/api/v1/`; erros no formato `{ "error": { "code", "message" } }`
- [ ] Paginação em listas; field filtering onde fizer sentido
- [ ] Loading e erro tratados no front (React Query / boundaries)

### Segurança

- [ ] Validação no back-end para todos os inputs sensíveis
- [ ] RBAC verificado **no servidor** em cada rota protegida
- [ ] Sem segredos no repositório; env documentados no `.env.example`
- [ ] HTTPS, headers de segurança (CSP, HSTS onde aplicável)
- [ ] OWASP Top 10 revisado para a feature (acesso, injeção, criptografia, etc.)

### Dados e performance

- [ ] Sem N+1 óbvio; índices considerados para novas queries
- [ ] Transações financeiras com Unit of Work / transação BD quando necessário

### Observabilidade

- [ ] Logs estruturados (`LOG_LEVEL` adequado); erros de produção sem stack trace ao cliente
- [ ] Sentry (ou equivalente) com contexto útil para novos fluxos

### Testes

- [ ] Testes unitários nos use cases críticos (Vitest)
- [ ] Pelo menos um fluxo E2E coberto para o caminho feliz (Playwright), se a feature for user-facing

### Documentação

- [ ] Atualizar **Common hurdles** se apareceu novo problema recorrente
- [ ] Atualizar lista de serviços/models se novos bounded contexts foram adicionados

---

## Apêndice — Texto integral preservado do guia original

*Abaixo segue o conteúdo completo das secções temáticas do ficheiro anterior, sem omissão de listas, tabelas ou links.*

### 🖥️ FRONT-END

#### Desenvolvimento Web

O desenvolvimento front-end moderno exige uma abordagem **mobile-first**, garantindo que interfaces funcionem bem em qualquer dispositivo antes de escalar para telas maiores. Os principais fundamentos são: [solvixtechnologies](https://solvixtechnologies.com/the-ultimate-guide-to-frontend-web-app-development-in-2025/)

- **HTML semântico:** Use tags com significado (`<article>`, `<section>`, `<nav>`, `<header>`) para melhorar acessibilidade e SEO
- **CSS modular:** Divida estilos por funcionalidade ou rota usando CSS Modules, SCSS Partials ou Tailwind — evite um único arquivo CSS gigante [crystallize](https://crystallize.com/blog/frontend-performance-checklist)
- **Mobile-first:** Comece com CSS mínimo e expanda progressivamente para telas maiores com media queries [itpathsolutions](https://www.itpathsolutions.com/frontend-performance-best-practices)
- **Flexbox e CSS Grid:** Use para layouts responsivos e adaptativos sem depender de hacks de posicionamento
- **Unidades relativas:** Prefira `%`, `rem`, `vh/vw` a pixels fixos para layouts fluidos [itpathsolutions](https://www.itpathsolutions.com/frontend-performance-best-practices)
- **Acessibilidade (a11y):** Implemente atributos ARIA, contraste de cores adequado (WCAG 2.1) e navegação por teclado
- **Core Web Vitals:** Monitore LCP (Largest Contentful Paint), FID e CLS como métricas centrais de qualidade [itpathsolutions](https://www.itpathsolutions.com/frontend-performance-best-practices)
- **Touch targets:** Botões e elementos interativos devem ter no mínimo 44×44 pixels para mobile [itpathsolutions](https://www.itpathsolutions.com/frontend-performance-best-practices)

#### Performance e Compilação Front-end

A velocidade de carregamento impacta diretamente retenção de usuários e conversão. As principais técnicas são: [linkedin](https://www.linkedin.com/pulse/frontend-performance-2025-best-practices-websites-adil-amin-gbjaf)

- **Lazy loading:** Carregue imagens, vídeos e componentes abaixo do fold somente quando necessários com `loading="lazy"` [itpathsolutions](https://www.itpathsolutions.com/frontend-performance-best-practices)
- **Code splitting:** Divida bundles por rota para que o usuário baixe apenas o JavaScript necessário (Webpack, Vite, Rollup)
- **Minificação e tree-shaking:** Remova código morto e reduza tamanho de arquivos JS/CSS no build [solvixtechnologies](https://solvixtechnologies.com/the-ultimate-guide-to-frontend-web-app-development-in-2025/)
- **Inlining de CSS crítico:** Coloque o CSS necessário para o above-the-fold diretamente no HTML, eliminando requests bloqueantes [itpathsolutions](https://www.itpathsolutions.com/frontend-performance-best-practices)
- **`async` / `defer` em scripts:** Use `defer` para scripts não críticos e `async` para scripts independentes, liberando o parser HTML [itpathsolutions](https://www.itpathsolutions.com/frontend-performance-best-practices)
- **WebP e compressão de imagens:** Troque PNG/JPEG por WebP para ganhos de 25–35% no tamanho [solvixtechnologies](https://solvixtechnologies.com/the-ultimate-guide-to-frontend-web-app-development-in-2025/)
- **CDN para assets estáticos:** Distribua JS, CSS e imagens por servidores geograficamente próximos ao usuário [solvixtechnologies](https://solvixtechnologies.com/the-ultimate-guide-to-frontend-web-app-development-in-2025/)
- **HTTP/3 e QUIC:** O protocolo mais recente reduz latência e lida melhor com interrupções de rede [itpathsolutions](https://www.itpathsolutions.com/frontend-performance-best-practices)

#### REST API no Front-end

- **Axios / Fetch com interceptors:** Centralize tratamento de erros e headers (ex.: token JWT) em um único lugar
- **Loading states e error boundaries:** Sempre forneça feedback visual de carregamento e tratamento de falha
- **Cache de respostas:** Use SWR ou React Query para cache, revalidação e otimistic updates
- **Cancelamento de requests:** Cancele chamadas pendentes ao desmontar componentes para evitar memory leaks (AbortController)
- **Variáveis de ambiente:** Nunca exponha chaves de API diretamente no código-fonte; use `.env` e prefixo `VITE_` / `NEXT_PUBLIC_`

***

### ⚙️ BACK-END

#### Estruturas de Dados

Escolher a estrutura certa tem impacto direto em performance e uso de memória: [42coffeecups](https://www.42coffeecups.com/blog/software-architecture-best-practices)

| Estrutura | Caso de Uso Ideal | Complexidade de Busca |
|---|---|---|
| **Array / List** | Acesso por índice, iterações sequenciais | O(1) acesso, O(n) busca |
| **Hash Map** | Lookup rápido por chave (cache, dicionários) | O(1) amortizado |
| **Set** | Unicidade de elementos, operações de conjunto | O(1) amortizado |
| **Heap / Priority Queue** | Filas de prioridade, agendamento de tarefas | O(log n) insert/remove |
| **Árvore B / B+** | Índices de banco de dados, buscas em range | O(log n) |
| **Grafo** | Redes, relacionamentos complexos, rotas | Varia (BFS/DFS O(V+E)) |

- **Evite estruturas aninhadas desnecessárias:** Dados profundamente aninhados aumentam custo de serialização/deserialização
- **Prefira imutabilidade:** Estruturas imutáveis facilitam concorrência e evitam side effects inesperados
- **Conheça a complexidade Big-O:** Sempre avalie o impacto em tempo e espaço antes de escolher uma estrutura

#### REST API no Back-end

Uma API bem projetada deve ser **previsível, versionada e autodescritiva**: [strapi](https://strapi.io/blog/restful-api-design-guide-principles-best-practices)

- **Recursos como substantivos:** Use `/users`, `/orders`, `/products` — nunca verbos como `/getUser` ou `/createOrder` [gravitee](https://www.gravitee.io/blog/7-rest-api-design-best-practices)
- **Verbos HTTP corretos:** `GET` (leitura), `POST` (criação), `PUT/PATCH` (atualização), `DELETE` (remoção) [careers.edicomgroup](https://careers.edicomgroup.com/techblog/backend-best-practices-when-developing-a-rest-api/)
- **Versionamento desde o início:** Adote `/api/v1/` desde o dia um para não quebrar clientes ao evoluir a API [strapi](https://strapi.io/blog/restful-api-design-guide-principles-best-practices)
- **HTTP Status Codes significativos:** `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `422 Unprocessable Entity`, `500 Internal Server Error`
- **Paginação obrigatória em listas:** Retorne dados em chunks com `limit`, `offset` ou `cursor-based` para evitar overload [gravitee](https://www.gravitee.io/blog/7-rest-api-design-best-practices)
- **Field filtering:** Permita `?fields=name,email` para reduzir payload — pode reduzir respostas em até 70% [strapi](https://strapi.io/blog/restful-api-design-guide-principles-best-practices)
- **Respostas de erro padronizadas:** Retorne sempre `{ "error": { "code": "RESOURCE_NOT_FOUND", "message": "..." } }`
- **Autenticação stateless:** Use JWT ou OAuth 2.0 — nunca armazene estado de sessão no servidor [strapi](https://strapi.io/blog/restful-api-design-guide-principles-best-practices)

#### HTTP — Fundamentos e Boas Práticas

- **Headers essenciais:** Sempre configure `Content-Type`, `Authorization`, `Cache-Control`, `ETag` e `Last-Modified` [careers.edicomgroup](https://careers.edicomgroup.com/techblog/backend-best-practices-when-developing-a-rest-api/)
- **CORS bem configurado:** Defina origens permitidas explicitamente — evite `Access-Control-Allow-Origin: *` em produção
- **HTTPS obrigatório:** TLS em todas as rotas; redirecione HTTP → HTTPS com `301 Permanent`
- **Rate limiting e throttling:** Proteja endpoints contra abuso definindo limites por IP/usuário com janela de tempo [gravitee](https://www.gravitee.io/blog/7-rest-api-design-best-practices)
- **Cache headers:** `Cache-Control: no-cache` para dados dinâmicos; `max-age=31536000` para assets estáticos imutáveis [careers.edicomgroup](https://careers.edicomgroup.com/techblog/backend-best-practices-when-developing-a-rest-api/)
- **Compressão gzip/brotli:** Reduza o tamanho das respostas no servidor — especialmente para JSON grandes [gravitee](https://www.gravitee.io/blog/7-rest-api-design-best-practices)

#### Performance e Economia de Memória

- **Evite N+1 queries:** Use eager loading / joins para buscar dados relacionados em uma única query ao invés de loops [strapi](https://strapi.io/blog/restful-api-design-guide-principles-best-practices)
- **Connection pooling:** Reutilize conexões com o banco de dados ao invés de abrir/fechar por request (PgBouncer, pool do ORM)
- **Caching em camadas:** Redis para dados frequentes (sessões, contagens, configs); cache de query para resultados pesados [gravitee](https://www.gravitee.io/blog/7-rest-api-design-best-practices)
- **Paginação no banco:** Use `LIMIT`/`OFFSET` ou keyset pagination — nunca traga toda a tabela para filtrar em código
- **Streaming para grandes volumes:** Use streams ao invés de carregar arquivos ou datasets inteiros na memória
- **Profiling regular:** Identifique gargalos com ferramentas como `clinic.js` (Node.js), `py-spy` (Python) ou APM (Datadog, NewRelic)
- **Evite objetos de longa vida:** Em linguagens com GC (JS, Python, Java), objetos que nunca saem do escopo causam memory leaks
- **Índices de banco bem planejados:** Índices nos campos de busca e join mais frequentes reduzem dramaticamente o tempo de query

***

### 🏛️ ARQUITETURA (texto original — Clean Code, SOLID, padrões clássicos, Clean Architecture)

#### Clean Code

Clean Code é sobre escrever código que **humanos consigam ler e manter** com facilidade: [pullchecklist](https://www.pullchecklist.com/posts/clean-code-principles)

- **Nomes que revelam intenção:** `getUserByEmail()` é melhor que `getData()`. Variáveis como `isActive`, `hasPermission` comunicam claramente
- **Funções pequenas e focadas:** Uma função deve fazer uma coisa só. Se precisa de um comentário para explicar "o que faz", renomeie ou quebre em partes
- **Evite comentários óbvios:** Código bem escrito se autodocumenta. Comente *por que* algo é feito, não *o que* está sendo feito
- **Limite de argumentos:** Funções com mais de 3 argumentos devem receber um objeto de configuração
- **DRY (Don't Repeat Yourself):** Abstraia lógica duplicada em funções/classes reutilizáveis
- **Lei de Demeter:** Um objeto não deve "conversar" com objetos que não conhece diretamente (evite `user.address.city.name`)
- **Trate erros explicitamente:** Nunca swallow exceptions silenciosamente — log e propague adequadamente

#### SOLID

Os cinco princípios SOLID são a base para sistemas extensíveis e testáveis: [42coffeecups](https://www.42coffeecups.com/blog/software-architecture-best-practices)

- **S — Single Responsibility:** Cada classe/módulo tem **um único motivo para mudar**. Ex.: `UserRepository` persiste dados; `UserValidator` valida regras
- **O — Open/Closed:** Aberto para extensão, fechado para modificação. Adicione comportamento via novas classes/estratégias, não alterando código existente [pullchecklist](https://www.pullchecklist.com/posts/clean-code-principles)
- **L — Liskov Substitution:** Subclasses devem poder substituir suas classes base sem quebrar o comportamento esperado do sistema [42coffeecups](https://www.42coffeecups.com/blog/software-architecture-best-practices)
- **I — Interface Segregation:** Crie interfaces pequenas e específicas. Um `EmailSender` não deve ser obrigado a implementar `SMSSender` [42coffeecups](https://www.42coffeecups.com/blog/software-architecture-best-practices)
- **D — Dependency Inversion:** Módulos de alto nível não dependem de módulos de baixo nível; ambos dependem de abstrações (interfaces/contratos) [42coffeecups](https://www.42coffeecups.com/blog/software-architecture-best-practices)

#### Design Patterns (catálogo clássico)

Os padrões são soluções comprovadas para problemas recorrentes: [pullchecklist](https://www.pullchecklist.com/posts/clean-code-principles)

**Criacionais**

- **Factory Method:** Delega a criação de objetos para subclasses — útil para instanciar diferentes implementações de uma interface
- **Singleton:** Garante uma única instância global (use com cautela — dificulta testes)
- **Builder:** Constrói objetos complexos passo a passo (ex.: query builders, configurações)

**Estruturais**

- **Adapter:** Converte a interface de uma classe em outra esperada pelo cliente (ex.: integração com APIs de terceiros)
- **Decorator:** Adiciona responsabilidades a objetos dinamicamente sem alterar a classe original
- **Repository:** Abstrai a camada de acesso a dados, desacoplando domínio de infraestrutura

**Comportamentais**

- **Strategy:** Define uma família de algoritmos intercambiáveis (ex.: diferentes métodos de pagamento) [pullchecklist](https://www.pullchecklist.com/posts/clean-code-principles)
- **Observer:** Notifica múltiplos objetos sobre mudanças de estado (base de sistemas de eventos/pub-sub)
- **Command:** Encapsula uma ação como objeto, permitindo fila, undo/redo e logging

#### Clean Architecture (diagrama e bullets originais)

A Clean Architecture coloca a **lógica de negócio no centro**, protegendo-a de frameworks, banco de dados e UI: [42coffeecups](https://www.42coffeecups.com/blog/software-architecture-best-practices)

```
[ Entities ] ← Regras de negócio puras, sem dependências externas
     ↑
[ Use Cases ] ← Orquestração dos fluxos da aplicação
     ↑
[ Interface Adapters ] ← Controllers, Presenters, Gateways
     ↑
[ Frameworks & Drivers ] ← Express, React, PostgreSQL, Redis
```

- **Regra de dependência:** As camadas internas **nunca dependem** das camadas externas — a seta sempre aponta para dentro [42coffeecups](https://www.42coffeecups.com/blog/software-architecture-best-practices)
- **Entities:** Objetos de domínio com regras de negócio que independem de qualquer framework
- **Use Cases (Application Layer):** Coordenam Entities para realizar um caso de uso específico (ex.: `CreateOrderUseCase`)
- **Interface Adapters:** Traduzem dados entre o formato da camada de aplicação e o formato dos frameworks (Controllers REST, DTOs)
- **Testabilidade:** Como o núcleo não depende de infraestrutura, você testa regras de negócio sem banco de dados ou HTTP
- **Inversão de dependência via interfaces:** O Use Case define uma interface `IUserRepository`; a infraestrutura implementa com PostgreSQL, MongoDB, etc. [42coffeecups](https://www.42coffeecups.com/blog/software-architecture-best-practices)

***

### Contexto: Design Patterns no Fluxo Bank (texto introdutório original)

Acredito que você esteja se referindo a **Design Patterns** (Padrões de Projeto de Software) para estruturar o código, correto? (Se você quis dizer *Design Systems* ou bibliotecas de UI para o frontend, como Tailwind ou Material UI, me avise!).

Para um projeto como o Fluxo Bank, onde a segurança, a concorrência e a imutabilidade são críticas, o uso de padrões de projeto não é apenas um preciosismo, é uma necessidade para que o código seja testável e não vire um emaranhado de regras (o famoso "código espaguete").

Como a melhor forma de fixar esses conceitos é colocando a mão na massa, separei os padrões mais indicados mostrando exatamente **onde** aplicá-los na prática dentro do seu banco:

#### 1. Padrões Estruturais e de Criação (O Alicerce)

* **Repository Pattern:**
    * **Onde usar:** Na camada de acesso aos dados (banco de dados).
    * **Na prática:** Você não vai espalhar consultas SQL ou métodos do Prisma/TypeORM direto nas suas regras de negócio. Você cria uma interface `ITransactionRepository` com métodos como `save(transaction)` ou `findByAccountId(id)`. Isso permite que você mude de banco de dados no futuro ou, mais importante, crie um "MockRepository" em memória para rodar milhares de testes unitários em milissegundos sem bater em um banco real.
* **Unit of Work (Unidade de Trabalho):**
    * **Onde usar:** Em conjunto com o Repository, especificamente no Caso de Uso de Transferência/Pix.
    * **Na prática:** Ele garante a **atomicidade**. Ele agrupa várias operações de banco de dados (ex: debitar da conta A, creditar na conta B, salvar o log no extrato) em uma única transação de banco. Se o crédito falhar, o Unit of Work garante o *rollback* automático de tudo.

#### 2. Padrões Comportamentais (As Regras de Negócio)

* **State Pattern (Padrão de Estado):**
    * **Onde usar:** Para gerenciar o ciclo de vida de um Pix ou de um resgate.
    * **Na prática:** Uma transação nunca é apenas "feita". Ela tem estados: `PENDING` (aguardando limite/fraude), `PROCESSING` (na fila do RabbitMQ), `COMPLETED` (sucesso), ou `FAILED`/`REFUNDED`. O State Pattern evita que você tenha dezenas de `if/else` espalhados pelo código para checar se uma transação cancelada pode ser processada (ela não pode).
    
* **Strategy Pattern (Padrão de Estratégia):**
    * **Onde usar:** Para cálculos dinâmicos, como limites de transferência ou taxas (se você decidir cobrar por TEDs no futuro).
    * **Na prática:** O Banco Central tem limites diferentes de Pix para o dia e para a noite. Em vez de criar uma função gigante de validação, você cria estratégias separadas (`DayTimeLimitStrategy` e `NightTimeLimitStrategy`). O sistema injeta a estratégia correta baseada no horário atual da requisição.
* **Observer Pattern (ou Pub/Sub para sistemas distribuídos):**
    * **Onde usar:** Na arquitetura orientada a eventos (quando o usuário clica em "Enviar Pix").
    * **Na prática:** O caso de uso do Pix (o *Subject/Publisher*) avisa que uma transação foi solicitada. Vários *Observers* (assinantes) reagem a isso: um serviço coloca a transação na fila do RabbitMQ, outro serviço envia um e-mail/push notification para o usuário, e outro atualiza o log de auditoria. Eles operam de forma assíncrona, deixando a aplicação rápida.

#### 3. Padrões no Frontend (React / Vue / Angular)

* **Container / Presentational Components (ou Custom Hooks):**
    * **Onde usar:** Na tela complexa do Extrato e de relatórios.
    * **Na prática:** Separe a lógica da interface. Crie um `useStatement(accountId)` (Hook/Container) que se preocupa exclusivamente em fazer o *fetch* da API, lidar com a paginação e o estado de carregamento. O componente visual (Presentational) apenas recebe os dados formatados e os renderiza na tela, sem saber de onde vieram. Isso facilita o reuso dos componentes visuais do Fluxo Bank.

### Stack detalhada (texto original — parágrafos completos)

Para o Fluxo Bank, precisamos de uma stack de tecnologias (um tech stack) que suporte alta concorrência, ofereça extrema segurança para transações Pix e que aplique os padrões de projeto que conversamos anteriormente de forma natural.

Aqui está a combinação ideal de tecnologias em React e Node.js com TypeScript, separadas pelas responsabilidades do sistema:

**1. O Backend (O Motor do Banco)** — A prioridade aqui é arquitetura limpa e resiliência.

- **Framework Node.js: NestJS** — Por que usar: Ele é construído 100% com TypeScript e força você a usar uma arquitetura modularizada e Injeção de Dependência (Dependency Injection) desde o primeiro dia. É o framework perfeito para implementar os padrões Repository e Unit of Work que um banco exige. *Alternativa:* Fastify puro, mas exigiria que você criasse toda a arquitetura na mão.

- **Banco de Dados Relacional: PostgreSQL** — Por que usar: É o padrão ouro do mercado open-source para transações financeiras devido ao seu forte suporte a propriedades ACID (Atomicidade, Consistência, Isolamento, Durabilidade).

- **ORM / Query Builder: TypeORM ou Drizzle ORM** — Por que usar: O TypeORM vem integrado perfeitamente ao NestJS e facilita muito a criação dos Repositories. Se quiser algo mais moderno, leve e com foco extremo em performance (pensando nos 10.000 usuários), o Drizzle ORM está dominando o mercado por gerar queries SQL altamente otimizadas.

- **Validação de Dados: Zod (ou class-validator se usar TypeORM)** — Por que usar: Para validar o corpo das requisições (ex: garantir que um CPF enviado para o Pix tem o formato correto) antes mesmo da requisição chegar à sua regra de negócio.

**2. O Frontend (A Interface do Usuário)** — A prioridade aqui é um carregamento rápido (performance) e a construção de componentes robustos que não quebrem.

- **Core / Bundler: React + Vite (Single Page Application)** — Por que usar: Como um internet banking é um painel de controle (dashboard) fechado por login e não precisa de indexação no Google (SEO), usar Vite com React é extremamente rápido e mais prático do que usar o Next.js para esse cenário específico.

- **Gerenciamento de Estado do Servidor (Data Fetching): TanStack Query (React Query)** — Por que usar: É o coração do seu extrato bancário. Ele faz o cache do saldo, lida com a paginação infinita das movimentações e controla os estados de loading e error de forma automática (a seamless integration perfeita com APIs).

- **Gerenciamento de Estado Local: Zustand** — Por que usar: Para guardar informações globais leves no frontend (como os dados do usuário logado ou se o tema está dark/light). É infinitamente mais simples e menos burocrático que o Redux.

- **Estilização e Componentes (Design System): Tailwind CSS + Shadcn/ui** — Por que usar: O Tailwind permite estilizar muito rápido. O Shadcn/ui não é uma biblioteca de componentes instalável, mas sim componentes em Tailwind prontos e acessíveis que você copia para dentro do seu projeto. Isso te dá 100% de controle sobre o visual do "Fluxo Bank" para customizar com a identidade visual que criamos.

- **Formulários: React Hook Form + Zod** — Por que usar: Para criar as telas de "Fazer um Pix" e "Guardar Dinheiro". Eles evitam renderizações desnecessárias na tela a cada tecla digitada e validam os valores instantaneamente.

**3. Ferramentas de Teste (Testing & QA)** — Crucial para garantir que o dinheiro não desapareça.

- **Backend & Frontend Unitário: Vitest** — Por que usar: É o sucessor espiritual do Jest, mas construído em cima do Vite. É absurdamente mais rápido para rodar seus testes unitários em TypeScript.

- **Frontend End-to-End (E2E): Playwright** — Por que usar: Mantido pela Microsoft, é excelente para criar um robô que abre o navegador, faz login no Fluxo Bank, clica no botão de transferir e verifica se o saldo foi atualizado corretamente.

**4. A Cola da Arquitetura (DevOps & Assincronicidade)**

- **Contêineres: Docker** — Por que usar: Você vai precisar subir o PostgreSQL e talvez um Redis localmente na sua máquina de forma rápida e controlada, garantindo que o ambiente seja o mesmo em produção.

- **Mensageria: RabbitMQ ou Redis (BullMQ)** — Por que usar: Para implementar as filas de processamento do Pix sem travar a interface do usuário, mantendo o servidor rápido sob alta carga.

***

### 🔒 SEGURANÇA (texto integral)

#### Front-end — Segurança no Cliente

Um estudo recente indica que **74% das empresas** admitem práticas de código inseguras que resultaram em ao menos uma violação de segurança. As principais proteções no front-end são: [blog.secureflag](https://blog.secureflag.com/2025/11/17/front-end-security-best-practices/)

- **XSS (Cross-Site Scripting):** Evite `innerHTML`, `document.write` e `eval` — use frameworks como React com JSX que escapam output automaticamente. Para HTML dinâmico, sanitize com a biblioteca **DOMPurify** [dev](https://dev.to/anisubhra_sarkar/javascript-frontend-security-best-practices-4f2e)
- **Content Security Policy (CSP):** Configure o header para restringir de onde scripts e recursos podem ser carregados:
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn-confiavel.com; object-src 'none';
  ```
 [dev](https://dev.to/anisubhra_sarkar/javascript-frontend-security-best-practices-4f2e)
- **CSRF (Cross-Site Request Forgery):** Use cookies com `SameSite=Strict` ou `Lax` e implemente CSRF tokens em requisições que alteram estado [dev](https://dev.to/anisubhra_sarkar/javascript-frontend-security-best-practices-4f2e)
- **Armazenamento de tokens:** Nunca armazene JWTs em `localStorage` — use cookies `httpOnly` + `Secure` para impedir acesso via JavaScript malicioso [group107](https://group107.com/blog/rest-api-security-best-practices/)
- **Validação dupla:** Valide inputs no front-end para UX, mas **nunca confie apenas nessa validação** — o back-end deve revalidar tudo [dev](https://dev.to/anisubhra_sarkar/javascript-frontend-security-best-practices-4f2e)
- **Subresource Integrity (SRI):** Ao carregar scripts externos via CDN, use o atributo `integrity` para verificar que o arquivo não foi adulterado

#### Back-end — Segurança na API e Servidor

- **Autenticação com OAuth 2.0 + OpenID Connect:** Padrão da indústria para acesso delegado; evita compartilhamento de senhas entre serviços [group107](https://group107.com/blog/rest-api-security-best-practices/)
- **JWT com vida curta:** Access tokens devem expirar em **15–60 minutos**; use refresh tokens de longa duração para renovação segura [group107](https://group107.com/blog/rest-api-security-best-practices/)
- **RBAC (Role-Based Access Control):** Defina permissões por papel (`admin`, `editor`, `viewer`) e verifique autorização em **cada endpoint** — nunca confie apenas no front-end [plexicus](https://www.plexicus.ai/blog/cybersecurity/web-application-security-best-practices-testing-and-assessment-2025/)
- **Princípio do menor privilégio:** Cada serviço, usuário e conexão de banco deve ter acesso apenas ao mínimo necessário [plexicus](https://www.plexicus.ai/blog/cybersecurity/web-application-security-best-practices-testing-and-assessment-2025/)
- **Prevenção de SQL Injection:** Use **queries parametrizadas** ou ORMs — nunca concatene inputs do usuário em queries SQL [oligo](https://www.oligo.security/academy/application-security-in-2025-threats-solutions-and-best-practices)
- **Rate limiting com bloqueio progressivo:** Implemente delays crescentes em tentativas falhas de login para dificultar brute-force [group107](https://group107.com/blog/rest-api-security-best-practices/)
- **Nunca exponha stack traces:** Em produção, retorne mensagens de erro genéricas ao cliente; logue o detalhe completo internamente [plexicus](https://www.plexicus.ai/blog/cybersecurity/web-application-security-best-practices-testing-and-assessment-2025/)
- **Secrets management:** Nunca commit credenciais no repositório. Use variáveis de ambiente, **AWS Secrets Manager**, **HashiCorp Vault** ou equivalentes [stackhawk](https://www.stackhawk.com/blog/rest-api-security-best-practices/)

#### Criptografia e Proteção de Dados

- **TLS 1.2+ obrigatório:** Toda comunicação em trânsito deve ser criptografada. Priorize cipher suites com **Forward Secrecy** (ECDHE) para proteger sessões passadas mesmo se a chave privada for comprometida [group107](https://group107.com/blog/rest-api-security-best-practices/)
- **AES-256 para dados em repouso:** Criptografe campos sensíveis no banco de dados (senhas, CPFs, dados de pagamento) [stackhawk](https://www.stackhawk.com/blog/rest-api-security-best-practices/)
- **Hashing de senhas:** Use **bcrypt**, **argon2** ou **scrypt** — nunca MD5 ou SHA-1 para senhas [plexicus](https://www.plexicus.ai/blog/cybersecurity/web-application-security-best-practices-testing-and-assessment-2025/)
- **HTTPS Strict Transport Security (HSTS):** Configure o header `Strict-Transport-Security` para que navegadores e clientes nunca se comuniquem via HTTP puro [group107](https://group107.com/blog/rest-api-security-best-practices/)
- **Rotação de chaves:** Implemente política de rotação periódica de chaves de criptografia e tokens de API [stackhawk](https://www.stackhawk.com/blog/rest-api-security-best-practices/)

#### OWASP Top 10 — Riscos Prioritários (2025)

O OWASP é a referência global para riscos críticos em aplicações web. Os principais que todo sistema deve mitigar: [raxis](https://raxis.com/blog/owasp-top-10-for-2025-whats-new-in-web-application-security/)

| Risco | Mitigação Principal |
|---|---|
| **Broken Access Control** | RBAC, verificação server-side em cada rota |
| **Cryptographic Failures** | TLS, AES-256, bcrypt/argon2 |
| **Injection (SQL, NoSQL, LDAP)** | Queries parametrizadas, sanitização de input |
| **Insecure Design** | Threat modeling na fase de design |
| **Security Misconfiguration** | Hardening de ambiente, desativar defaults inseguros |
| **Vulnerable Components** | SBOM, atualizações regulares de dependências |
| **Authentication Failures** | MFA, JWT com expiração curta, bloqueio de brute-force |
| **Software Integrity Failures** | CI/CD com SAST/DAST, SRI em assets externos |

 [raxis](https://raxis.com/blog/owasp-top-10-for-2025-whats-new-in-web-application-security/)

#### DevSecOps — Segurança no Pipeline

Segurança deve ser integrada ao processo de desenvolvimento, não adicionada ao final: [sigma](https://sigma.software/insights/key-application-security-practices-to-follow-in-2025)

- **SAST (Static Analysis):** Analise o código-fonte automaticamente a cada PR — ferramentas como SonarQube, Semgrep, CodeQL [plexicus](https://www.plexicus.ai/blog/cybersecurity/web-application-security-best-practices-testing-and-assessment-2025/)
- **DAST (Dynamic Analysis):** Teste a aplicação em execução simulando ataques — OWASP ZAP, Burp Suite [plexicus](https://www.plexicus.ai/blog/cybersecurity/web-application-security-best-practices-testing-and-assessment-2025/)
- **Dependency scanning:** Verifique vulnerabilidades em pacotes npm/pip/maven com `npm audit`, Dependabot ou Snyk [oligo](https://www.oligo.security/academy/application-security-in-2025-threats-solutions-and-best-practices)
- **SBOM (Software Bill of Materials):** Mantenha inventário de todos os componentes open-source para rastrear CVEs rapidamente [oligo](https://www.oligo.security/academy/application-security-in-2025-threats-solutions-and-best-practices)
- **Monitoramento contínuo:** Use SIEM para correlacionar logs e detectar comportamentos anômalos em tempo real (ex.: múltiplas falhas de login, acesso a rotas sensíveis) [oligo](https://www.oligo.security/academy/application-security-in-2025-threats-solutions-and-best-practices)

---

*Documento organizado por secções 1–9 no topo; apêndice com texto integral do guia anterior para auditoria e cópia local.*
