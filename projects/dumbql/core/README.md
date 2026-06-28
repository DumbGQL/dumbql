# DumbQL: Lightweight, Ergonomic GraphQL Suite for Angular

**Languages:** [English](#english) | [Русский](#русский)

---

## English

DumbQL is a modular, high-performance, and zero-boilerplate GraphQL client suite built specifically for modern Angular applications (supporting Standalone, Signals, and SSR). It provides powerful cache normalization, a robust middleware execution pipeline, and interactive developer tools debugger support, without monolithic bundle bloat.

<p align="center">
  <img src="https://raw.githubusercontent.com/dumb-keystore/frontend/master/projects/dumbql/core/assets/dumbql_logo.png" alt="DumbQL Logo" width="220"/>
</p>

### Table of Contents
1. [Features](#features)
2. [Package Architecture Overview](#package-architecture-overview)
3. [Quick Start & Interactive Setup](#quick-start--interactive-setup)
4. [Configuration (`dumbql.config.ts`)](#configuration-dumbqlconfigts)
5. [Registering Provider](#registering-provider)
6. [Complete API Guide](#complete-api-guide)
    - [@dumbql/core (Core)](#1-dumbqlcore-core)
    - [@dumbql/cache (Caching)](#2-dumbqlcache-caching)
    - [@dumbql/middlewares (Middlewares)](#3-dumbqlmiddlewares-middlewares)
    - [@dumbql/subscriptions (Subscriptions)](#4-dumbqlsubscriptions-subscriptions)
    - [@dumbql/file-upload (File Uploads)](#5-dumbqlfile-upload-file-uploads)
    - [@dumbql/downloader (Introspection)](#6-dumbqldownloader-introspection)
    - [@dumbql/testing (Testing Mock Backend)](#7-dumbqltesting-testing-mock-backend)
7. [Plugins System](#plugins-system)
8. [DevTools Debugger Panel](#devtools-debugger-panel)
9. [Type Codegen](#type-codegen)

---

### Features

*   **Interactive Import (ng add):** Dynamically choose auxiliary modules during installation and auto-generate project configurations.
*   **Automatic Normalization Caching:** Intercepts queries, parses response trees, and normalizes entities in memory using `__typename` and `id`/`_id` fields automatically.
*   **Declarative List Merging (Type Policies):** Configure `'append'` and `'prepend'` merge strategies for query results without writing manual cache updating logic.
*   **Middleware request pipeline:** Chain functional handlers (similar to `HttpInterceptor`) to inject headers, handle errors, trace operations, or manage state.
*   **Integrated Visual DevTools:** Connected debugger console showing logs, performance data, and an interactive SVG Schema Connection graph for visual navigation.

---

### Package Architecture Overview

DumbQL is split into independent micro-packages to minimize the final bundle size:

*   **`@dumbql/core`** — Core `GraphqlService`, pipeline primitives, basic operations (`query`, `mutate`, `refetch`, `poll`), and template pipes.
*   **`@dumbql/cache`** — Normalized cache store, Garbage Collector, and LocalStorage persistence.
*   **`@dumbql/middlewares`** — Prebuilt pipeline extensions: token refresh, retry-exchange, offline queue, and tab-focus refetching.
*   **`@dumbql/subscriptions`** — WebSocket and Server-Sent Events (SSE) subscriptions client.
*   **`@dumbql/file-upload`** — Multipart-form file uploads handler.
*   **`@dumbql/downloader`** — Introspection schema parser and downloader.
*   **`@dumbql/testing`** — Mock utility classes for Angular component testing.

---

### Quick Start & Interactive Setup

To add DumbQL to your Angular project, run:

```bash
ng add @dumbql/core
```

You will be prompted with choices:
1.  *Install normalized caching support (`@dumbql/cache`)?* (Default: `Yes`)
2.  *Install WebSocket subscriptions support (`@dumbql/subscriptions`)?* (Default: `No`)
3.  *Install GraphQL file upload support (`@dumbql/file-upload`)?* (Default: `No`)
4.  *Install auxiliary middlewares (`@dumbql/middlewares`)?* (Default: `Yes`)
5.  *Configure DumbQL GraphQL Debugger DevTools?* (Default: `Yes`)

---

### Configuration (`dumbql.config.ts`)

```typescript
import type { DumbqlConfig } from '@dumbql/core';

const config: DumbqlConfig = {
  endpoint: 'http://localhost:8080/graphql',
  errorPolicy: 'none',
  retryCount: 0,
  retryDelay: 1000,
  dedup: true,
  cache: {
    enabled: true,
    maxAge: 300000,
    serialize: true,
    typePolicies: {
      Query: {
        fields: {
          allProducts: {
            merge: 'prepend', // Prepends new elements into the cached array
          },
        },
      },
    },
  },
  devtools: {
    enabled: true,
    autoConnect: true,
  },
  codegen: {
    schema: {
      endpoint: 'http://localhost:8080/graphql',
      dir: './graphql',
      filename: 'schema.json',
      autoDownloadSchema: true,
    },
  },
};

export default config;
```

---

### Registering Provider

Register the services inside `app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideDumbql, loggingMiddleware } from '@dumbql/core';
import dumbqlConfig from '../dumbql.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideDumbql({
      ...dumbqlConfig,
      middleware: [
        loggingMiddleware('DumbQL-App'),
      ],
    }),
  ],
};
```

---

### Complete API Guide

#### 1. `@dumbql/core` (Core)

##### Query
```typescript
import { Component, signal } from '@angular/core';
import { query, gql } from '@dumbql/core';

const GET_PRODUCTS = gql`
  query GetProducts {
    allProducts {
      id
      title
      price
    }
  }
`;

@Component({
  selector: 'app-products',
  template: `
    <ul>
      @for (p of products(); track p.id) {
        <li>{{ p.title }} - {{ p.price }} USD</li>
      }
    </ul>
  `
})
export class ProductsComponent {
  products = signal<any[]>([]);

  constructor() {
    query<any>(GET_PRODUCTS).subscribe((result) => {
      if (result.status === 'success') {
        this.products.set(result.data.allProducts);
      }
    });
  }
}
```

##### Mutation
```typescript
import { mutate, gql } from '@dumbql/core';

const CREATE_PRODUCT = gql`
  mutation CreateProduct($title: String!, $price: Float!) {
    createProduct(title: $title, price: $price) {
      id
      title
      price
    }
  }
`;

mutate(CREATE_PRODUCT, { title: 'New Product', price: 99.9 })
  .subscribe((res) => {
    if (res.status === 'success') {
      console.log('Product created:', res.data.createProduct);
    }
  });
```

---

#### 2. `@dumbql/cache` (Caching)

```typescript
import { inject } from '@angular/core';
import { CacheService } from '@dumbql/cache';

const cache = inject(CacheService);

// Write entity
cache.write({ __typename: 'User', id: '123', name: 'John' });

// Merge fields
cache.merge({ __typename: 'User', id: '123', email: 'john@example.com' });

// Evict entity
cache.evict('User', '123');

// Clear query cache
cache.clearLocalState();
```

---

#### 3. `@dumbql/middlewares` (Middlewares)

##### focusRefetchMiddleware
Automatically refetches active queries when the browser tab focus shifts back.
```typescript
import { focusRefetchMiddleware } from '@dumbql/middlewares';
// Add focusRefetchMiddleware() to the middleware config array
```

##### retryExchange
Retries failing requests with exponential backoff and jitter.
```typescript
import { retryExchange } from '@dumbql/middlewares';
// Add retryExchange({ maxRetries: 3 }) to the middleware config array
```

##### authRefreshMiddleware
Pauses failing requests, executes token refresh, and replays pending operations.
```typescript
import { authRefreshMiddleware } from '@dumbql/middlewares';
// Add authRefreshMiddleware({ refreshToken: () => authService.refresh() }) to middlewares config
```

##### offlineQueueMiddleware
Buffers mutations locally when offline and replays them when back online.
```typescript
import { offlineQueueMiddleware, provideOfflineQueue } from '@dumbql/middlewares';
// Provide provideOfflineQueue() and add offlineQueueMiddleware() to middleware configuration
```

---

#### 4. `@dumbql/subscriptions` (Subscriptions)

```typescript
import { subscribe, gql } from '@dumbql/subscriptions';

subscribe(gql`subscription { newMessage { id text } }`)
  .subscribe(res => console.log('New message:', res));
```

---

#### 5. `@dumbql/file-upload` (File Uploads)

```typescript
import { mutate, gql } from '@dumbql/core';

mutate(gql`mutation($file: Upload!) { upload(file: $file) { id } }`, { file: myFileBlob });
```

---

#### 6. `@dumbql/downloader` (Introspection)

```typescript
import { downloadAndStoreSchema } from '@dumbql/downloader';

downloadAndStoreSchema({ endpoint: '/graphql', outputDir: './graphql' });
```

---

#### 7. `@dumbql/testing` (Testing Mock Backend)

```typescript
import { TestBed } from '@angular/core/testing';
import { GraphqlService, gql } from '@dumbql/core';
import { provideDumbqlTesting, MockGraphqlService } from '@dumbql/testing';

describe('Test', () => {
  it('mocks queries', () => {
    TestBed.configureTestingModule({ providers: [provideDumbqlTesting()] });
    const svc = TestBed.inject(GraphqlService);
    const mock = TestBed.inject(MockGraphqlService);

    svc.query(gql`{ status }`).subscribe(res => expect(res.data.status).toBe('mock_ok'));
    mock.expect(gql`{ status }`).flush({ data: { status: 'mock_ok' } });
  });
});
```

---

### Plugins System

Plugins allow you to execute `onInit` setups and return custom middlewares:

```typescript
import { type DumbqlPlugin } from '@dumbql/core';

export const customPlugin: DumbqlPlugin = {
  name: 'Custom',
  onInit(client) { console.log('Client init:', client.endpoint); }
};
```

---

### DevTools Debugger Panel

Integrate with browser debugging extensions to trace operation performance and visualize schemas.
1.  **SVG Schema Connection Graph:** The **Schema** tab renders a three-column interactive connection graph representing incoming/outgoing type relationships. Clicking nodes navigates deeper.
2.  **Telemetry Data:** Full telemetry logs are registered under `data_collection_permissions: {"required": ["none"]}` ensuring data compliance.

---

### Type Codegen

Generate Typescript interfaces from `.graphql` files:
```bash
npm run codegen
```

---
---

## Русский

DumbQL — это модульный, высокопроизводительный GraphQL-клиент, созданный специально для Angular (Standalone, Signals и SSR). Он предоставляет возможности автоматической нормализации кэша, гибкий конвейер перехватчиков (middlewares) и интеграцию с визуальным отладчиком DevTools.

### Содержание
1. [Особенности](#особенности)
2. [Архитектура пакетов](#архитектура-пакетов)
3. [Быстрый старт](#быстрый-старт)
4. [Конфигурация (`dumbql.config.ts`)](#конфигурация-dumbqlconfigts-1)
5. [Регистрация провайдера](#регистрация-провайдера)
6. [API Руководство](#api-руководство)
7. [Система плагинов](#система-плагинов)
8. [Интеграция с DevTools](#интеграция-с-devtools-1)
9. [Генерация типов](#генерация-типов)

---

### Особенности

*   **Интерактивный импорт (ng add):** Выборочная установка модулей с автоматической генерацией файлов настроек.
*   **Автоматическая нормализация кэша:** Парсит деревья ответов и обновляет локальные сущности по полям `__typename` и `id`/`_id`.
*   **Правила слияния списков (Type Policies):** Настройка правил `'append'` и `'prepend'` для авто-обновления списков при мутациях без написания ручных обработчиков.
*   **Конвейер Middleware:** Простая цепочка перехватчиков для динамического внедрения заголовков, обработки ошибок или логирования.

---

### Архитектура пакетов

*   **`@dumbql/core`** — Главный сервис `GraphqlService`, операции `query`, `mutate`, `refetch`, `poll` и пайпы.
*   **`@dumbql/cache`** — Нормализованный кэш, сборщик мусора и LocalStorage персистентность.
*   **`@dumbql/middlewares`** — Перехватчики: обновление токенов, повтор запросов, оффлайн очередь, авторефетч при фокусе.
*   **`@dumbql/subscriptions`** — WebSocket и SSE клиент подписок.
*   **`@dumbql/file-upload`** — Загрузчик файлов.
*   **`@dumbql/downloader`** — Интроспекция схем.
*   **`@dumbql/testing`** — Утилиты для тестирования.

---

### Быстрый старт

Установите библиотеку через Angular CLI:

```bash
ng add @dumbql/core
```

---

### Конфигурация (`dumbql.config.ts`)

```typescript
import type { DumbqlConfig } from '@dumbql/core';

const config: DumbqlConfig = {
  endpoint: 'http://localhost:8080/graphql',
  errorPolicy: 'none',
  cache: {
    enabled: true,
    maxAge: 300000,
    typePolicies: {
      Query: {
        fields: {
          allProducts: {
            merge: 'prepend', // Добавление новых элементов в начало списка
          },
        },
      },
    },
  },
  devtools: {
    enabled: true,
  },
};

export default config;
```

---

### Регистрация провайдера

Зарегистрируйте DumbQL в `app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideDumbql } from '@dumbql/core';
import dumbqlConfig from '../dumbql.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideDumbql(dumbqlConfig),
  ],
};
```

---

### API Руководство

#### 1. Выполнение запроса (Query)
```typescript
import { query, gql } from '@dumbql/core';

query<any>(gql`query { allProducts { id title } }`).subscribe((result) => {
  if (result.status === 'success') {
    console.log(result.data.allProducts);
  }
});
```

#### 2. Работа с кэшем
```typescript
import { inject } from '@angular/core';
import { CacheService } from '@dumbql/cache';

const cache = inject(CacheService);
cache.write({ __typename: 'User', id: '123', name: 'John' });
cache.merge({ __typename: 'User', id: '123', email: 'john@example.com' });
cache.evict('User', '123');
```

#### 3. Использование Middlewares
```typescript
import { retryExchange } from '@dumbql/middlewares';
// Добавьте retryExchange() в массив конфигурации middleware
```

#### 4. WebSocket подписки
```typescript
import { subscribe, gql } from '@dumbql/subscriptions';

subscribe(gql`subscription { newMessage { id text } }`)
  .subscribe(res => console.log('Новое сообщение:', res));
```

#### 5. Тестирование
```typescript
import { provideDumbqlTesting, MockGraphqlService } from '@dumbql/testing';
// Добавьте в providers: [provideDumbqlTesting()]
```

---

### Система плагинов

```typescript
import { type DumbqlPlugin } from '@dumbql/core';

export const logPlugin: DumbqlPlugin = {
  name: 'Logger',
  onInit(client) { console.log('Эндпоинт:', client.endpoint); }
};
```

---

### Интеграция с DevTools

Интегрированный клиент отслеживает состояние и отправляет данные в расширение DevTools.
*   **SVG Schema Connection Graph:** Строит интерактивный граф взаимных связей типов. Клик по узлу позволяет перемещаться по структурам входящих и исходящих данных.
*   **data_collection_permissions:** Соответствует строгим требованиям Mozilla и Chrome (`{"required": ["none"]}`).

---

### Генерация типов

Автоматический запуск кодогенерации TypeScript интерфейсов:
```bash
npm run codegen
```
