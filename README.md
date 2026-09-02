# DietGreen

[🇺🇸 English](#english) · [🇧🇷 Português](#português)

**Live Demo:** https://diet-app-3iyl.onrender.com/

---

# English

## Description

DietGreen is a responsive web application for generating personalized meal plans based on dietary profiles, physical goals, and nutritional requirements.

The application supports **10 dietary profile options**, including vegan, vegetarian, lacto-vegetarian, pescetarian, and custom profiles. Users can combine their dietary preferences with goals such as muscle gain, weight loss, bulking, and cutting.

Generated meal plans include nutritional information, macronutrient calculations, and ranked food substitutions based on nutritional suitability. The system also considers economic and local food availability when selecting alternatives.

Users can export their meal plans as **PDF or Excel (.xlsx)** files.

Authentication is optional and is integrated with **Google OAuth and GitHub OAuth** through Auth.js. Authenticated users can save and access their meal plans across sessions.

## Demo

**Live application:** https://diet-app-3iyl.onrender.com/

## Features

* Personalized meal plan generation
* 10 dietary profile options
* Multiple physical and nutritional goals
* Calorie and macronutrient calculations
* Ranked nutritional food substitutions
* Economic and local food considerations
* PDF meal plan export
* Excel (.xlsx) meal plan export
* Google OAuth authentication
* GitHub OAuth authentication
* User-specific meal plan persistence
* Responsive interface
* Input validation with Zod

## How to Use

1. Open the [live application](https://diet-app-3iyl.onrender.com/).
2. Select your dietary profile.
3. Select your physical goal.
4. Enter the requested information.
5. Generate your personalized meal plan.
6. Review the meals and nutritional information.
7. Use the suggested substitutions when needed.
8. Export your plan to PDF or Excel.
9. Sign in with Google or GitHub if you want to save your meal plans.

Authentication is optional. The application can generate meal plans without an account, but persistent user-specific storage requires authentication.

## Tech Stack

* **Next.js 16** — App Router and application framework
* **TypeScript** — type-safe development
* **Tailwind CSS 4** — responsive styling
* **Prisma ORM 7** — database access and migrations
* **Neon PostgreSQL** — cloud PostgreSQL database
* **@prisma/adapter-neon** — Prisma driver adapter for Neon
* **Auth.js / NextAuth.js v5** — authentication
* **Google OAuth** — Google sign-in integration
* **GitHub OAuth** — GitHub sign-in integration
* **Zod** — input and API validation
* **@react-pdf/renderer** — PDF generation
* **SheetJS (xlsx)** — Excel export
* **Lucide React** — interface icons
* **Fraunces + Work Sans** — application typography

## Architecture

DietGreen follows a layered architecture inspired by **Clean Architecture and SOLID principles**.

```text
src/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── services/
│
├── application/
│   └── use-cases/
│
├── infrastructure/
│   ├── db/
│   ├── repositories/
│   └── auth/
│
├── lib/
│   ├── container.ts
│   ├── exportPlan.ts
│   └── icons.ts
│
├── components/
│
└── app/
```

The **domain layer** contains the core business rules without depending on external infrastructure.

The **application layer** coordinates the business use cases.

The **infrastructure layer** contains implementations for the database, repositories, authentication, and other external services.

Repositories are defined as interfaces within the domain and implemented in the infrastructure layer, following the **Dependency Inversion Principle**.

This separation keeps the business logic independent from specific technologies and makes infrastructure components easier to replace or maintain.

## Authentication

DietGreen currently supports two OAuth providers:

### Google OAuth

Users can authenticate using their Google account.

### GitHub OAuth

Users can authenticate using their GitHub account.

Both integrations are implemented through **Auth.js / NextAuth.js v5**.

No other authentication providers are currently integrated.

## Meal Plan Export

Generated meal plans can be exported directly from the application.

### PDF

PDF files are generated using `@react-pdf/renderer`, producing a structured document suitable for saving or printing.

### Excel

Meal plans can also be exported as `.xlsx` files using **SheetJS (`xlsx`)**, allowing users to edit and analyze the generated data.

## How to Run Locally

Clone the repository and install the dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Configure the required environment variables:

```env
DATABASE_URL=
DIRECT_URL=

AUTH_SECRET=
AUTH_URL=

AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
```

Generate the Prisma client:

```bash
npx prisma generate
```

Run the database migrations:

```bash
npx prisma migrate dev --name init
```

Seed the database:

```bash
npx prisma db seed
```

Start the development server:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

## Database

DietGreen uses **PostgreSQL through Neon**.

Two database connections are configured:

* `DATABASE_URL` — pooled connection used by the application at runtime.
* `DIRECT_URL` — direct connection used by Prisma migrations.

Both connections should use SSL.

## Deployment

The production application is deployed using **Render**, with **Neon PostgreSQL** as the database provider.

The production build can be executed with:

```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

The application is started with:

```bash
npm run start
```

After the initial deployment, the production database can be populated using:

```bash
npx prisma db seed
```

## Nutritional Data

The nutritional values used by DietGreen are reference estimates based on sources such as **USDA FoodData Central** and the **TACO food composition table**.

Energy and macronutrient calculations use established nutritional methodologies, including the **Mifflin-St Jeor equation** and references from sports nutrition literature.

DietGreen is intended as a meal-planning and educational tool and should not replace professional nutritional guidance.

Relevant calculation references are documented in:

```text
src/domain/services/macroCalculator.ts
```

## Author

**Rayssa Roberta Rodrigues Silva**

Frontend Developer focused on building modern, responsive, and maintainable web applications.

**GitHub:** https://github.com/rayssarrsilva

## License

This project is licensed under the **MIT License**.

---

# Português

## Descrição

DietGreen é uma aplicação web responsiva desenvolvida para gerar **cardápios personalizados** com base no perfil alimentar, objetivo físico e necessidades nutricionais do usuário.

O sistema possui **10 opções de perfil alimentar**, incluindo vegano, vegetariano, lactovegetariano, pescetariano e perfil personalizado. Essas opções podem ser combinadas com objetivos como ganho de massa muscular, emagrecimento, bulking e cutting.

Os cardápios gerados apresentam informações nutricionais, cálculo de macronutrientes e substituições de alimentos ranqueadas de acordo com sua adequação nutricional. O sistema também considera a viabilidade econômica e a disponibilidade local dos alimentos ao sugerir alternativas.

Os cardápios podem ser exportados em **PDF ou Excel (.xlsx)**.

A autenticação é opcional e possui integração com **Google OAuth e GitHub OAuth**, utilizando Auth.js. Usuários autenticados podem salvar e acessar seus cardápios posteriormente.

## Demo

**Aplicação online:** https://diet-app-3iyl.onrender.com/

## Funcionalidades

* Geração de cardápios personalizados
* 10 opções de perfil alimentar
* Diferentes objetivos físicos e nutricionais
* Cálculo de calorias e macronutrientes
* Substituições alimentares ranqueadas
* Consideração de viabilidade econômica e local
* Exportação de cardápios para PDF
* Exportação de cardápios para Excel (.xlsx)
* Login com Google
* Login com GitHub
* Persistência de cardápios por usuário
* Interface responsiva
* Validação de dados com Zod

## Como Usar

1. Acesse a [aplicação online](https://diet-app-3iyl.onrender.com/).
2. Selecione seu perfil alimentar.
3. Selecione seu objetivo físico.
4. Informe os dados solicitados.
5. Gere seu cardápio personalizado.
6. Consulte as refeições e informações nutricionais.
7. Utilize as substituições sugeridas quando necessário.
8. Exporte o cardápio para PDF ou Excel.
9. Faça login com Google ou GitHub caso queira salvar seus cardápios.

O login é opcional. A aplicação funciona sem autenticação, mas o armazenamento persistente por usuário depende de uma conta.

## Tecnologias

* **Next.js 16** — App Router e framework da aplicação
* **TypeScript** — desenvolvimento com tipagem estática
* **Tailwind CSS 4** — estilização responsiva
* **Prisma ORM 7** — acesso ao banco e migrations
* **Neon PostgreSQL** — banco PostgreSQL em nuvem
* **@prisma/adapter-neon** — driver adapter do Prisma para Neon
* **Auth.js / NextAuth.js v5** — autenticação
* **Google OAuth** — integração de login com Google
* **GitHub OAuth** — integração de login com GitHub
* **Zod** — validação de entradas e APIs
* **@react-pdf/renderer** — geração de PDF
* **SheetJS (xlsx)** — exportação para Excel
* **Lucide React** — ícones da interface
* **Fraunces + Work Sans** — tipografia da aplicação

## Arquitetura

O DietGreen utiliza uma arquitetura em camadas inspirada em **Clean Architecture e princípios SOLID**.

```text
src/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── services/
│
├── application/
│   └── use-cases/
│
├── infrastructure/
│   ├── db/
│   ├── repositories/
│   └── auth/
│
├── lib/
│   ├── container.ts
│   ├── exportPlan.ts
│   └── icons.ts
│
├── components/
│
└── app/
```

A **camada de domínio** concentra as principais regras de negócio sem depender diretamente de infraestrutura externa.

A **camada de aplicação** coordena os casos de uso.

A **camada de infraestrutura** contém as implementações relacionadas ao banco de dados, repositórios, autenticação e demais serviços externos.

Os repositórios são definidos como interfaces no domínio e implementados na infraestrutura, seguindo o **Princípio da Inversão de Dependência**.

Essa separação mantém as regras de negócio independentes das tecnologias utilizadas e facilita a manutenção e substituição de componentes de infraestrutura.

## Autenticação

Atualmente, o DietGreen possui duas integrações OAuth:

### Google OAuth

Permite que usuários façam login utilizando sua conta Google.

### GitHub OAuth

Permite que usuários façam login utilizando sua conta GitHub.

As duas integrações são implementadas através do **Auth.js / NextAuth.js v5**.

Nenhum outro provedor de autenticação está integrado atualmente.

## Exportação dos Cardápios

Os cardápios podem ser exportados diretamente pela aplicação.

### PDF

Os arquivos PDF são gerados utilizando `@react-pdf/renderer`, produzindo documentos estruturados para salvar ou imprimir.

### Excel

Os cardápios também podem ser exportados como arquivos `.xlsx` utilizando **SheetJS (`xlsx`)**, permitindo editar e analisar os dados gerados.

## Como Executar Localmente

Instale as dependências:

```bash
npm install
```

Crie o arquivo de ambiente:

```bash
cp .env.example .env
```

Configure as variáveis necessárias:

```env
DATABASE_URL=
DIRECT_URL=

AUTH_SECRET=
AUTH_URL=

AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
```

Gere o cliente Prisma:

```bash
npx prisma generate
```

Execute as migrations:

```bash
npx prisma migrate dev --name init
```

Popule o banco de dados:

```bash
npx prisma db seed
```

Inicie o servidor:

```bash
npm run dev
```

A aplicação estará disponível em:

```text
http://localhost:3000
```

## Banco de Dados

O DietGreen utiliza **PostgreSQL através do Neon**.

São utilizadas duas conexões:

* `DATABASE_URL` — conexão pooled utilizada pela aplicação em runtime.
* `DIRECT_URL` — conexão direta utilizada pelas migrations do Prisma.

Ambas devem utilizar SSL.

## Deploy

A aplicação está publicada no **Render**, utilizando **Neon PostgreSQL** como banco de dados.

O build de produção pode ser executado com:

```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

O servidor é iniciado com:

```bash
npm run start
```

Após o primeiro deploy, o banco de produção pode ser populado utilizando:

```bash
npx prisma db seed
```

## Dados Nutricionais

Os valores nutricionais utilizados pelo DietGreen são estimativas de referência baseadas em fontes como **USDA FoodData Central** e a **Tabela TACO**.

Os cálculos de energia e macronutrientes utilizam metodologias nutricionais estabelecidas, incluindo a **equação de Mifflin-St Jeor** e referências da literatura de nutrição esportiva.

O DietGreen foi desenvolvido como uma ferramenta de planejamento alimentar e apoio educacional, não substituindo acompanhamento profissional.

As referências utilizadas nos cálculos estão documentadas em:

```text
src/domain/services/macroCalculator.ts
```

## Autora

**Rayssa Roberta Rodrigues Silva**

Frontend Developer focada no desenvolvimento de aplicações web modernas, responsivas e sustentáveis.

**GitHub:** https://github.com/rayssarrsilva

## Licença

Este projeto está licenciado sob a **MIT License**.
