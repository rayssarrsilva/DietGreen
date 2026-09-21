# DietGreen

[🇺🇸 English](#english) · [🇧🇷 Português](#português)

**Live:** https://diet-app-3iyl.onrender.com/

---

# English

Web app that suggests which foods to include in your meals, based on your dietary profile (vegetarian or omnivore, with 10 more specific variants available) and physical goal. Built with Next.js, Prisma, and PostgreSQL.

## Status

MVP in active development. Everything in **Features** below is already live.

## Features
- Vegetarian / omnivore quick pick, with 10 more specific profiles underneath
- Goal-based plan: maintenance, muscle gain, weight loss, bulking, cutting
- Food suggestions by category (protein, carbs, fats, fiber) — no calorie or gram totals shown yet, to avoid displaying unverified numbers
- Adjustable variety per category (5–20 options rotating through the plan)
- PDF and Excel export
- Google / GitHub sign-in, with saved plan history
- Light/dark theme, Portuguese/English interface
- Responsive (mobile, tablet, desktop)

## Tech Stack
- **App:** Next.js 16, TypeScript, Tailwind CSS 4
- **Data:** Prisma ORM 7, Neon PostgreSQL
- **Auth:** Auth.js (Google, GitHub OAuth)
- **Validation:** Zod
- **Export:** @react-pdf/renderer, SheetJS
- **Testing:** Vitest
- **CI/CD:** GitHub Actions

## Engineering Practices
- Layered architecture (Clean Architecture / SOLID), domain layer with no framework dependency
- Automated testing (unit tests on business logic)
- CI/CD pipeline: lint, typecheck, test, and build gated on every PR
- Git flow with branch protection: PRs required, merge blocked until CI passes
- OAuth2 authentication (Google, GitHub)
- Relational database with ORM and versioned migrations
- Environment-based configuration (`.env`), no secrets in code
- i18n (PT/EN) and responsive, accessible UI (light/dark theme)
- RESTful API routes with server-side schema validation

## Architecture
Layered, inspired by Clean Architecture:
```
src/domain/         business logic, framework-free (macroCalculator, planGenerator)
src/application/    use-cases orchestrating domain services
src/infrastructure/ Prisma repositories, Auth.js config
src/components/     UI
src/app/            Next.js routes
```
Domain services don't import from infrastructure — they're unit-testable with no database.

## Testing & CI/CD
- **Vitest** covers the domain logic (`src/domain/services/*.test.ts`)
- **GitHub Actions** (`.github/workflows/ci.yml`) runs lint → typecheck → tests → build on every push and pull request to `main`
- Branch protection on `main` requires that check to pass before merging

## Getting Started
```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET, AUTH_URL, OAuth keys
npx prisma generate
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev
```

## Deployment
Render, auto-deploy from `main`. Build command runs migrations automatically:
```
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```
Seed the production database once manually after the first deploy (`npx tsx prisma/seed.ts`, pointed at the production `DATABASE_URL`/`DIRECT_URL`).

## Disclaimer
Educational meal-planning tool. Not a substitute for a registered dietitian or physician.

## Author
**Rayssa Roberta Rodrigues Silva** — github.com/rayssarrsilva

## License
MIT

---

# Português

App web que sugere quais alimentos incluir nas suas refeições, com base no seu perfil alimentar (vegetariano ou onívoro, com 10 variações mais específicas disponíveis) e objetivo físico. Feito com Next.js, Prisma e PostgreSQL.

## Status

MVP em desenvolvimento ativo. **Funcionalidades** abaixo já estão no ar. **Roteiro** ainda não foi construído.

## Funcionalidades
- Escolha rápida vegetariano / onívoro, com 10 perfis mais específicos por baixo
- Plano por objetivo: manutenção, ganho de massa, emagrecimento, bulking, cutting
- Sugestão de alimentos por categoria (proteína, carboidrato, gordura, fibra) — sem mostrar total de calorias/gramas ainda, pra não exibir número não verificado
- Variedade ajustável por categoria (5–20 opções no rodízio do cardápio)
- Exportação em PDF e Excel
- Login com Google / GitHub, com histórico de cardápios salvos
- Tema claro/escuro, interface em português/inglês
- Responsivo (celular, tablet, desktop)

## Tecnologias
- **App:** Next.js 16, TypeScript, Tailwind CSS 4
- **Dados:** Prisma ORM 7, Neon PostgreSQL
- **Login:** Auth.js (OAuth2 Google, GitHub)
- **Validação:** Zod
- **Exportação:** @react-pdf/renderer, SheetJS
- **Testes:** Vitest
- **CI/CD:** GitHub Actions

## Práticas de Engenharia
- Arquitetura em camadas (Clean Architecture / SOLID), domínio sem dependência de framework
- Testes automatizados (testes unitários na regra de negócio)
- Pipeline de CI/CD: lint, typecheck, teste e build obrigatórios em todo PR
- Git flow com proteção de branch: PR obrigatório, merge bloqueado até o CI passar
- Autenticação OAuth2 (Google, GitHub)
- Banco relacional com ORM e migrations versionadas
- Configuração via variáveis de ambiente (`.env`), sem segredo no código
- i18n (PT/EN) e UI responsiva e acessível (tema claro/escuro)
- Rotas de API RESTful com validação de schema no servidor

## Arquitetura
Em camadas, inspirada em Clean Architecture:
```
src/domain/         regra de negócio, sem framework (macroCalculator, planGenerator)
src/application/    use-cases que orquestram os serviços de domínio
src/infrastructure/ repositórios Prisma, config do Auth.js
src/components/     UI
src/app/            rotas do Next.js
```
Os serviços de domínio não importam de infraestrutura — testáveis isoladamente, sem banco.

## Testes & CI/CD
- **Vitest** cobre a lógica de domínio (`src/domain/services/*.test.ts`)
- **GitHub Actions** (`.github/workflows/ci.yml`) roda lint → typecheck → testes → build a cada push e pull request pra `main`
- Proteção de branch na `main` exige esse check passando antes de mergear

## Como Rodar
```bash
npm install
cp .env.example .env   # preenche DATABASE_URL, DIRECT_URL, AUTH_SECRET, AUTH_URL, chaves OAuth
npx prisma generate
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev
```

## Deploy
Render, auto-deploy a partir da `main`. O comando de build já roda a migration sozinho:
```
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```
O seed de produção precisa rodar manualmente uma vez após o primeiro deploy (`npx tsx prisma/seed.ts`, apontando pro `DATABASE_URL`/`DIRECT_URL` de produção).

## Aviso
Ferramenta educacional de planejamento alimentar. Não substitui acompanhamento de nutricionista ou médico.

## Autora
**Rayssa Roberta Rodrigues Silva** — github.com/rayssarrsilva

## Licença
MIT
