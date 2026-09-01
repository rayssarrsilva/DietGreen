# DietGreen — cardápio personalizado por perfil alimentar

App web responsivo que gera cardápios personalizados combinando **perfil
alimentar** (vegano, vegetariano, lactovegetariano, pescetariano, e mais —
10 opções, incluindo personalizado) e **objetivo físico** (ganhar massa,
ganhar músculo, emagrecer, bulking, cutting), com substituições nutricionais
ranqueadas por eficácia, filtro de viabilidade econômica/local, e exportação
em PDF/Excel. Login opcional via Google/GitHub, tudo salvo por usuário.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS 4
- **Prisma ORM** com **driver adapter do Neon** (`@prisma/adapter-neon`) —
  sem depender de binário nativo em runtime, ótimo para o free tier
- **PostgreSQL via Neon** (gratuito, permanente — diferente do Postgres
  free do Render, que expira em 90 dias)
- **NextAuth.js (Auth.js) v5** — login Google/GitHub, ambos gratuitos
- **lucide-react** (ícones), fontes **Fraunces + Work Sans** via `next/font`
- **@react-pdf/renderer** (export PDF) e **xlsx/SheetJS** (export Excel)
- **Zod** para validação de entrada nas rotas de API

## Arquitetura (camadas / SOLID)

```
src/
  domain/            <- regras de negócio puras, sem dependência de infra
    entities/         (tipos)
    repositories/      (interfaces — Dependency Inversion)
    services/          (cálculo de macros, geração do cardápio)
  application/
    use-cases/         (orquestra domínio + repositórios)
  infrastructure/     <- só aqui o projeto "sabe" que usa Prisma/NextAuth
    db/
    repositories/       (implementação Prisma das interfaces do domínio)
    auth/
  lib/
    container.ts       (composition root — troca de implementação = 1 arquivo)
    exportPlan.ts       (PDF/Excel)
    icons.ts
  components/
  app/                 <- rotas Next.js (finas, delegam para use-cases)
```

Trocar de Postgres/Neon para outro banco, ou de NextAuth para outra lib de
auth, exige mudanças isoladas em `infrastructure/` e `lib/container.ts` —
o domínio e as regras de negócio não mudam.

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL, DIRECT_URL, AUTH_SECRET etc.
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed      # popula perfis, objetivos, alimentos e rankings
npm run dev
```

> Nota: `prisma generate`/`migrate` baixam um binário do schema-engine na
> primeira execução — precisa de acesso normal à internet (funciona em
> qualquer máquina/servidor comum; só falha em ambientes com whitelist de
> rede muito restritiva, como o sandbox onde este projeto foi montado).

## Deploy gratuito (Neon + Render)

### 1. Banco de dados — Neon (gratuito, sem expirar)

1. Crie uma conta em https://neon.tech (tem free tier permanente).
2. Crie um projeto novo (ex.: `diet-app`).
3. Na aba **Connection Details**, copie duas strings:
   - **Pooled connection** (com `-pooler` no host) -> vai em `DATABASE_URL`
   - **Direct connection** (sem `-pooler`) -> vai em `DIRECT_URL`
4. Ambas devem terminar com `?sslmode=require`.

### 2. Login Google (opcional, gratuito)

1. Acesse https://console.cloud.google.com/apis/credentials
2. Crie um projeto -> **Create Credentials -> OAuth client ID** -> tipo
   "Web application".
3. Em **Authorized redirect URIs**, adicione:
   `https://SEU-APP.onrender.com/api/auth/callback/google`
4. Copie o Client ID e Client Secret -> `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.

### 3. Login GitHub (opcional, gratuito)

1. Acesse https://github.com/settings/developers -> **New OAuth App**.
2. Homepage URL: `https://SEU-APP.onrender.com`
3. Authorization callback URL:
   `https://SEU-APP.onrender.com/api/auth/callback/github`
4. Copie o Client ID e gere um Client Secret ->
   `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`.

Se você não quiser configurar login agora, tudo bem: o app funciona sem
login, só que sem salvar/exportar cardápios entre visitas.

### 4. Deploy no Render (gratuito)

**Opção A — usando o `render.yaml` incluso (Blueprint, mais rápido):**

1. Suba este projeto para um repositório no GitHub.
2. No Render, clique em **New -> Blueprint**, aponte para o repositório.
   O Render vai ler o `render.yaml` e criar o serviço automaticamente.
3. Preencha as variáveis marcadas como `sync: false` (DATABASE_URL,
   DIRECT_URL, AUTH_URL, credenciais Google/GitHub) na tela de configuração.
4. Clique em **Apply** — o Render builda e sobe sozinho, aplicando as
   migrations do Prisma automaticamente (`prisma migrate deploy` já está
   no build command).

**Opção B — manual:**

1. No Render, **New -> Web Service** -> conecte o repositório.
2. Runtime: **Node**. Plan: **Free**.
3. Build Command:
   `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
4. Start Command: `npm run start`
5. Em **Environment**, adicione as mesmas variáveis do `.env.example`.
6. Deploy.

### 5. Popular o banco em produção (uma vez só)

Depois do primeiro deploy, rode o seed apontando para o Neon. Do seu
computador, com o `.env` local configurado com a `DATABASE_URL`/`DIRECT_URL`
do Neon (as mesmas que você colocou no Render):

```bash
npx prisma db seed
```

### Sobre o plano free do Render

O free tier do Render "dorme" o serviço depois de ~15 minutos sem tráfego,
e demora alguns segundos para acordar na próxima requisição — normal e
esperado para não pagar nada. Se isso incomodar, dá pra usar um serviço de
"ping" gratuito (ex. cron-job.org) para manter o app acordado, mas não é
necessário.

## Dados nutricionais

Os valores por alimento (kcal, macros, micros por 100g) são estimativas de
referência (USDA FoodData Central / Tabela TACO), pensadas como ponto de
partida sólido — vale revisão de um nutricionista antes de qualquer uso
clínico real. As fórmulas de TMB/TDEE e as faixas de proteína por objetivo
seguem literatura de nutrição esportiva estabelecida (Mifflin-St Jeor;
ISSN Position Stand on Protein and Exercise, Jäger et al. 2017; ISSN
Position Stand on Diets and Body Composition, Aragon et al. 2017) — as
referências completas estão comentadas no código
(`src/domain/services/macroCalculator.ts`).

## Próximos passos sugeridos

- Expandir o catálogo de alimentos (hoje ~45, cobrindo as 6 categorias)
- Adicionar mais perfis "personalizados" com granularidade por alimento
- Testes automatizados para `planGenerator.ts` e `macroCalculator.ts`
- Cache de catálogo (perfis/objetivos/alimentos mudam pouco) para reduzir
  consultas ao banco
