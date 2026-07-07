import { Injectable } from '@angular/core';
import sdk from '@stackblitz/sdk';
import type { Project } from '@stackblitz/sdk';

const FETCH_MOCK = `const origFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const url = typeof input === 'string' ? input : 'url' in input ? input.url : input.toString();
  if (url.endsWith('/graphql'))
    return Promise.resolve(new Response(JSON.stringify({
      data: { getNotes: [
        { id: '1', title: 'Hello DumbQL', content: 'Your first GraphQL query works!', __typename: 'Note' },
        { id: '2', title: 'Tip', content: 'Try changing this mock data', __typename: 'Note' },
      ]},
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  return origFetch(input, init);
};`;

const ANGULAR_DEPS = {
  '@angular/core': '^22.0.0',
  '@angular/common': '^22.0.0',
  '@angular/compiler': '^22.0.0',
  '@angular/platform-browser': '^22.0.0',
  '@angular/platform-browser-dynamic': '^22.0.0',
  '@angular/router': '^22.0.0',
  '@dumbql/client': '^1.0.2',
  '@dumbql/core': '1.0.5-beta.2',
  '@dumbql/cache': '^1.0.3',
  graphql: '^17.0.0',
  'reflect-metadata': '^0.2.0',
  rxjs: '^7.8.0',
};

const REACT_DEPS = {
  '@dumbql/client': '^1.0.2',
  '@dumbql/react': '^1.0.0',
  '@dumbql/cache': '^1.0.3',
  graphql: '^17.0.0',
  react: '^18.2.0',
  'react-dom': '^18.2.0',
};

const VUE_DEPS = {
  '@dumbql/client': '^1.0.2',
  '@dumbql/vue': '^1.0.0',
  graphql: '^17.0.0',
  vue: '^3.4.0',
};

const ANGULAR_DEV_DEPS = {
  '@angular/build': '^22.0.0',
  '@angular/cli': '^22.0.0',
  '@angular/compiler-cli': '^22.0.0',
  typescript: '~6.0.0',
};

const VITE_DEV_DEPS = {
  typescript: '~5.8.0',
  vite: '^5.4.0',
};

const STYLES_CSS = 'body { font-family: system-ui, sans-serif; padding: 1rem; }';

const ANGULAR_GENERIC = `import { Component } from '@angular/core';
import { gql } from '@dumbql/client';
import { DumbqlQueryDirective } from '@dumbql/core';

const GET_NOTES = gql\`
  query {
    getNotes {
      id
      title
      content
    }
  }
\`;

interface Note {
  id: string;
  title: string;
  content: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DumbqlQueryDirective],
  template: \`
    <h1>DumbQL + Angular</h1>

    <ng-template dumbqlQuery [query]="GET_NOTES" let-data let-loading="loading" let-error="error">
      @if (loading) { <p>Loading...</p> }
      @if (error)  { <p>Error: {{ error }}</p> }
      @if (data) {
        <ul>
          @for (note of data.data.getNotes; track note.id) {
            <li><strong>{{ note.title }}</strong>: {{ note.content }}</li>
          }
        </ul>
      }
    </ng-template>
  \`,
})
export class AppComponent {
  readonly GET_NOTES = GET_NOTES;
}`;

const REACT_GENERIC = `import { useQuery, gql } from '@dumbql/react';

const GET_NOTES = gql\`
  query {
    getNotes {
      id
      title
      content
    }
  }
\`;

interface Note {
  id: string;
  title: string;
  content: string;
}

export default function App() {
  const { data, loading, error } = useQuery<{ getNotes: Note[] }>(GET_NOTES);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>DumbQL + React</h1>
      <ul>
        {data?.getNotes.map(note => (
          <li key={note.id}>
            <strong>{note.title}</strong>: {note.content}
          </li>
        ))}
      </ul>
    </div>
  );
}`;

const VUE_GENERIC = `<script setup lang="ts">
import { useQuery, gql } from '@dumbql/vue';

interface Note {
  id: string;
  title: string;
  content: string;
}

const GET_NOTES = gql\`
  query {
    getNotes {
      id
      title
      content
    }
  }
\`;

const { data, loading, error } = useQuery<{ getNotes: Note[] }>(GET_NOTES);
</script>

<template>
  <h1>DumbQL + Vue</h1>
  <p v-if="loading">Loading...</p>
  <p v-else-if="error">{{ error }}</p>
  <ul v-else>
    <li v-for="note in data?.getNotes" :key="note.id">
      <strong>{{ note.title }}</strong>: {{ note.content }}
    </li>
  </ul>
</template>

<style>
body { font-family: sans-serif; padding: 2rem; }
</style>`;

@Injectable({ providedIn: 'root' })
export class StackblitzStarterService {
  openAngular(): void {
    this.openStarter(ANGULAR_GENERIC, 'angular', 'Getting Started');
  }

  openReact(): void {
    this.openStarter(REACT_GENERIC, 'react', 'Getting Started');
  }

  openVue(): void {
    this.openStarter(VUE_GENERIC, 'vue', 'Getting Started');
  }

  openStarter(code: string, framework: string, title: string): void {
    const project = this.buildProject(code, framework, title);
    const entry = this.entryFile(framework);
    sdk.openProject(project, { newWindow: true, openFile: entry });
  }

  private entryFile(framework: string): string {
    switch (framework) {
      case 'angular':
        return 'src/app/app.component.ts';
      case 'react':
        return 'src/App.tsx';
      case 'vue':
        return 'src/App.vue';
      default:
        return 'index.html';
    }
  }

  private buildProject(code: string, framework: string, title: string): Project {
    switch (framework) {
      case 'angular':
        return this.angularProject(code, title);
      case 'react':
        return this.reactProject(code, title);
      case 'vue':
        return this.vueProject(code, title);
      default:
        return this.vanillaProject(code, title);
    }
  }

  private angularProject(code: string, title: string): Project {
    const name = title.toLowerCase().replace(/\s+/g, '-');
    return {
      title: `Angular: ${title}`,
      description: `DumbQL Angular starter — ${title}`,
      template: 'node',
      files: {
        'package.json': JSON.stringify(
          {
            name: `dumbql-angular-${name}`,
            private: true,
            scripts: { start: 'ng serve --host 0.0.0.0 --port 4200', build: 'ng build' },
            dependencies: ANGULAR_DEPS,
            devDependencies: ANGULAR_DEV_DEPS,
          },
          null,
          2,
        ),
        'angular.json': JSON.stringify(
          {
            $schema: './node_modules/@angular/cli/lib/config/schema.json',
            version: 1,
            newProjectRoot: 'projects',
            projects: {
              starter: {
                projectType: 'application',
                root: '',
                sourceRoot: 'src',
                prefix: 'app',
                architect: {
                  build: {
                    builder: '@angular/build:application',
                    options: {
                      browser: 'src/main.ts',
                      tsConfig: 'tsconfig.app.json',
                      outputPath: 'dist',
                      assets: [],
                      styles: ['src/styles.css'],
                    },
                    configurations: { production: { optimization: true } },
                  },
                  serve: {
                    builder: '@angular/build:dev-server',
                    options: { buildTarget: 'starter:build' },
                    configurations: { production: { buildTarget: 'starter:build:production' } },
                  },
                },
              },
            },
          },
          null,
          2,
        ),
        'tsconfig.json': JSON.stringify(
          {
            compileOnSave: false,
            compilerOptions: {
              outDir: './dist',
              strict: true,
              noImplicitOverride: true,
              noPropertyAccessFromIndexSignature: true,
              noImplicitReturns: true,
              noFallthroughCasesInSwitch: true,
              skipLibCheck: true,
              esModuleInterop: true,
              sourceMap: true,
              declaration: false,
              experimentalDecorators: true,
              moduleResolution: 'bundler',
              importHelpers: true,
              target: 'ES2022',
              module: 'ESNext',
              useDefineForClassFields: false,
              lib: ['ES2022', 'dom'],
            },
            angularCompilerOptions: {
              enableI18nLegacyMessageIdFormat: false,
              strictInjectionParameters: true,
              strictInputAccessModifiers: true,
              strictTemplates: true,
            },
          },
          null,
          2,
        ),
        'tsconfig.app.json': JSON.stringify(
          {
            extends: './tsconfig.json',
            compilerOptions: { outDir: './out-tsc/app', types: [] },
            files: ['src/main.ts'],
          },
          null,
          2,
        ),
        'src/index.html':
          '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>DumbQL + Angular</title>\n  <base href="/">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n</head>\n<body>\n  <app-root></app-root>\n</body>\n</html>',
        'src/styles.css': STYLES_CSS,
        'src/mock.ts': FETCH_MOCK,
        'src/main.ts': `import '@angular/compiler';
import './mock';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig);`,
        'src/app/app.config.ts': `import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideDumbql } from '@dumbql/core';
import { provideCacheService } from '@dumbql/cache/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideZonelessChangeDetection(),
    provideDumbql({
      endpoint: '/graphql',
    }),
    provideCacheService(),
  ],
};`,
        'src/app/app.component.ts': code,
      },
    };
  }

  private reactProject(code: string, title: string): Project {
    const name = title.toLowerCase().replace(/\s+/g, '-');
    return {
      title: `React: ${title}`,
      description: `DumbQL React starter — ${title}`,
      template: 'node',
      files: {
        'package.json': JSON.stringify(
          {
            name: `dumbql-react-${name}`,
            private: true,
            scripts: { start: 'vite --port 5173', build: 'vite build' },
            dependencies: REACT_DEPS,
            devDependencies: {
              ...VITE_DEV_DEPS,
              '@vitejs/plugin-react': '^4.2.0',
              '@types/react': '^18.2.0',
              '@types/react-dom': '^18.2.0',
            },
          },
          null,
          2,
        ),
        'index.html':
          '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>DumbQL + React</title>\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>',
        'tsconfig.json': JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2020',
              module: 'ESNext',
              moduleResolution: 'bundler',
              jsx: 'react-jsx',
              strict: true,
              skipLibCheck: true,
              esModuleInterop: true,
            },
          },
          null,
          2,
        ),
        'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});`,
        'src/mock.ts': FETCH_MOCK,
        'src/main.tsx': `import './mock';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { DumbqlProvider } from '@dumbql/react';
import { createClient } from '@dumbql/client';
import { createCache } from '@dumbql/cache';
import App from './App';

const client = createClient({ endpoint: '/graphql' });
const cache = createCache();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DumbqlProvider client={client} cache={cache}>
      <App />
    </DumbqlProvider>
  </React.StrictMode>,
);`,
        'src/styles.css': STYLES_CSS,
        'src/App.tsx': code,
      },
    };
  }

  private vueProject(code: string, title: string): Project {
    const name = title.toLowerCase().replace(/\s+/g, '-');
    return {
      title: `Vue: ${title}`,
      description: `DumbQL Vue starter — ${title}`,
      template: 'node',
      files: {
        'package.json': JSON.stringify(
          {
            name: `dumbql-vue-${name}`,
            private: true,
            scripts: { start: 'vite --port 5173', build: 'vite build' },
            dependencies: VUE_DEPS,
            devDependencies: { ...VITE_DEV_DEPS, '@vitejs/plugin-vue': '^5.0.0', 'vue-tsc': '^2.0.0' },
          },
          null,
          2,
        ),
        'index.html':
          '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>DumbQL + Vue</title>\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n</head>\n<body>\n  <div id="app"></div>\n  <script type="module" src="/src/main.ts"></script>\n</body>\n</html>',
        'tsconfig.json': JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2020',
              module: 'ESNext',
              moduleResolution: 'bundler',
              strict: true,
              skipLibCheck: true,
              esModuleInterop: true,
            },
          },
          null,
          2,
        ),
        'vite.config.ts': `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: { port: 5173 },
});`,
        'src/mock.ts': FETCH_MOCK,
        'src/main.ts': `import './mock';
import { createApp } from 'vue';
import { createDumbqlPlugin } from '@dumbql/vue';
import { createClient } from '@dumbql/client';
import App from './App.vue';

const client = createClient({ endpoint: '/graphql' });

const app = createApp(App);
app.use(createDumbqlPlugin(client));
app.mount('#app');`,
        'src/env.d.ts': '/// <reference types="vite/client" />',
        'src/styles.css': STYLES_CSS,
        'src/App.vue': code,
      },
    };
  }

  private vanillaProject(code: string, title: string): Project {
    return {
      title: `Vanilla: ${title}`,
      description: `DumbQL vanilla starter — ${title}`,
      template: 'node',
      files: {
        'package.json': JSON.stringify(
          {
            name: 'dumbql-vanilla-starter',
            private: true,
            scripts: { start: 'npx serve .', build: 'echo no-build' },
            dependencies: {
              '@dumbql/client': '^1.0.2',
              graphql: '^17.0.0',
            },
          },
          null,
          2,
        ),
        'index.html': code,
      },
    };
  }
}
