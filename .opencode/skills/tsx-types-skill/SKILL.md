---
name: tsx-types
description: >
  Use this skill when writing or reviewing any TypeScript or TSX code. Trigger automatically
  before writing any type annotation, interface, prop type, event handler, generic, or
  utility type. Also triggers on "/types", "как типизировать", "как правильно типизировать",
  "type this", "что за тип", "как сделать тип для". CRITICAL: never use `any`, never use
  `as SomeType` without a type guard alternative, never use `object`, never use `Function`.
  This skill enforces human-grade TypeScript — the kind that actually catches bugs instead
  of just satisfying the compiler by lying to it.
---

# TSX Types

Human-grade TypeScript typing. No lies to the compiler. No `any`. No fake `as T`.

**The rule**: a type annotation should make incorrect code fail to compile.
If your types allow invalid states — they're not doing their job.

---

## The Forbidden List

Never use these. Ever.

```typescript
// ❌ any — disables type checking entirely
const data: any = fetch();

// ❌ as SomeType — lies to compiler, runtime crash waiting to happen
const user = response as User;

// ❌ as unknown as SomeType — double lie, even worse
const el = thing as unknown as HTMLInputElement;

// ❌ object — tells you nothing
function process(data: object) {}

// ❌ Function — no parameter or return type info
const cb: Function = () => {};

// ❌ {} — accepts literally everything except null/undefined
function handle(val: {}) {}

// ❌ Non-null assertion without actual guarantee
const el = document.getElementById('app')!;
```

---

## Props Typing

### Basic props

```typescript
// ❌ interface with any
interface Props {
  data: any;
  onClose: Function;
}

// ✅ explicit types
type Props = {
  label: string;
  count: number;
  onClose: () => void;
  onChange: (value: string) => void;
};
```

### Optional vs required — be explicit

```typescript
type Props = {
  // Required — must be passed
  id: number;
  label: string;

  // Optional — may be omitted
  description?: string;
  className?: string;

  // Optional with default — document the default
  variant?: 'primary' | 'secondary'; // default: 'primary'
};
```

### Event handlers with payload types

```typescript
// ❌ generic Function or () => void when payload exists
type Props = {
  onChange: Function;
  onSelect: (e: any) => void;
};

// ✅ typed payload
type Props = {
  onChange: (value: string) => void;
  onSelect: (item: { id: number; label: string }) => void;
  onSubmit: (data: FormData) => Promise<void>;
};
```

### Template literal event types (for dynamic event maps)

```typescript
// Generate typed event handler props from an event map
type EventHandlers<T extends Record<string, unknown>> = {
  [K in keyof T as `on${Capitalize<string & K>}`]: (payload: T[K]) => void;
};

type MyEvents = EventHandlers<{
  close: void;
  submit: { id: number; name: string };
  change: string;
  error: Error;
}>;
// Results in:
// { onClose: (payload: void) => void; onSubmit: (payload: {...}) => void; ... }
```

### Children

```typescript
import type { JSX } from 'solid-js'; // or React, etc.

type Props = {
  children: JSX.Element;           // single element
  children: JSX.Element[];         // array of elements
  children?: JSX.Element | JSX.Element[]; // optional, single or array
  children: (item: User) => JSX.Element; // render prop
};
```

---

## Narrowing — Never `as`, Always Guard

### instanceof narrowing

```typescript
// ❌
const input = event.target as HTMLInputElement;

// ✅
function handleChange(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) return;
  const value = event.target.value; // typed correctly
}
```

### Type guards

```typescript
// ❌
const user = apiResponse as User;

// ✅ — write a guard, use it everywhere
function isUser(val: unknown): val is User {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    typeof (val as Record<string, unknown>).id === 'number'
  );
}

const user = isUser(apiResponse) ? apiResponse : null;
```

### Discriminated unions (instead of `as`)

```typescript
// ❌ one type with optional fields — forces as or !
type Result = {
  data?: User;
  error?: string;
  loading?: boolean;
};

// ✅ discriminated union — impossible states unrepresentable
type Result =
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: string };

// Now exhaustive matching works
function render(result: Result) {
  switch (result.status) {
    case 'loading': return <Spinner />;
    case 'success': return <UserCard user={result.data} />; // data is User here
    case 'error': return <Error message={result.error} />;  // error is string here
  }
}
```

### in narrowing for union types

```typescript
type Dog = { bark: () => void };
type Cat = { meow: () => void };
type Animal = Dog | Cat;

function speak(animal: Animal) {
  if ('bark' in animal) {
    animal.bark(); // Dog
  } else {
    animal.meow(); // Cat
  }
}
```

---

## Generics — Use Them Right

### Basic constrained generic

```typescript
// ❌ any defeats the purpose
function first(arr: any[]): any {
  return arr[0];
}

// ✅
function first<T>(arr: readonly T[]): T | undefined {
  return arr[0];
}
```

### Constrain when you need specific shape

```typescript
// ❌ too loose — T could be anything
function getField<T>(obj: T, key: string): unknown {
  return (obj as any)[key];
}

// ✅ key must actually exist on obj
function getField<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

### Generic components (Solid/React)

```typescript
type ListProps<T> = {
  items: T[];
  renderItem: (item: T) => JSX.Element;
  keyExtractor: (item: T) => string;
};

function List<T>(props: ListProps<T>) {
  return <ul>{props.items.map(item => (
    <li key={props.keyExtractor(item)}>{props.renderItem(item)}</li>
  ))}</ul>;
}

// Usage — T inferred from items
<List
  items={users}
  renderItem={user => <span>{user.name}</span>}
  keyExtractor={user => String(user.id)}
/>
```

---

## Utility Types — When to Use Each

```typescript
// Partial<T> — all fields optional (for update payloads)
type UpdateUser = Partial<User>;

// Required<T> — all fields required (opposite of Partial)
type FullConfig = Required<Config>;

// Pick<T, K> — take only specific fields
type UserPreview = Pick<User, 'id' | 'name' | 'avatar'>;

// Omit<T, K> — remove specific fields
type CreateUser = Omit<User, 'id' | 'createdAt'>; // server sets these

// Readonly<T> — prevent mutation
type ImmutableConfig = Readonly<Config>;

// Record<K, V> — typed object/map
type SkillLevels = Record<string, number>;
type StatusMap = Record<'active' | 'inactive' | 'pending', boolean>;

// Extract / Exclude — filter union members
type StringOrNumber = string | number | boolean;
type OnlyStrings = Extract<StringOrNumber, string>;      // string
type NoStrings = Exclude<StringOrNumber, string>;        // number | boolean

// NonNullable — remove null and undefined
type MaybeString = string | null | undefined;
type DefinitelyString = NonNullable<MaybeString>;        // string

// ReturnType / Parameters — extract from function types
type Handler = (id: number, name: string) => Promise<User>;
type HandlerReturn = ReturnType<Handler>;                // Promise<User>
type HandlerParams = Parameters<Handler>;                // [number, string]

// Awaited — unwrap Promise
type UserData = Awaited<Promise<User>>;                  // User
```

---

## Unknown Over Any

For external data (API responses, localStorage, user input, third-party callbacks):

```typescript
// ❌
async function fetchUser(id: number): Promise<any> {
  return fetch(`/api/users/${id}`).then(r => r.json());
}

// ✅ — start with unknown, validate before use
async function fetchUser(id: number): Promise<User> {
  const raw: unknown = await fetch(`/api/users/${id}`).then(r => r.json());
  if (!isUser(raw)) throw new Error(`Invalid user response: ${JSON.stringify(raw)}`);
  return raw;
}
```

---

## Const Assertions & Enums

```typescript
// ❌ string literals lose their type
const ROLES = ['admin', 'user', 'guest'];
// type: string[]

// ✅ const assertion — preserves literal types
const ROLES = ['admin', 'user', 'guest'] as const;
// type: readonly ["admin", "user", "guest"]

type Role = typeof ROLES[number]; // "admin" | "user" | "guest"

// ✅ const object instead of enum (tree-shakeable, better DX)
const Status = {
  Active: 'active',
  Inactive: 'inactive',
  Pending: 'pending',
} as const;

type Status = typeof Status[keyof typeof Status]; // "active" | "inactive" | "pending"
```

---

## Function Overloads

When a function behaves differently based on input type:

```typescript
// ❌ any to handle multiple types
function parse(input: any): any {
  if (typeof input === 'string') return JSON.parse(input);
  return JSON.stringify(input);
}

// ✅ overloads
function parse(input: string): unknown;
function parse(input: object): string;
function parse(input: string | object): unknown | string {
  if (typeof input === 'string') return JSON.parse(input);
  return JSON.stringify(input);
}
```

---

## Async Types

```typescript
// ❌
async function loadData(): Promise<any> {}

// ✅ explicit return type
async function loadUser(id: number): Promise<User> {}
async function loadUsers(): Promise<User[]> {}
async function updateUser(id: number, data: Partial<User>): Promise<void> {}

// For error-typed results (no exceptions for control flow)
type AsyncResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function fetchUser(id: number): Promise<AsyncResult<User>> {
  try {
    const raw: unknown = await api.get(`/users/${id}`);
    if (!isUser(raw)) return { ok: false, error: 'Invalid response' };
    return { ok: true, data: raw };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
```

---

## Index Signatures — Use Carefully

```typescript
// ❌ too loose — any string key returns any value
type Config = {
  [key: string]: any;
};

// ✅ typed value
type Config = {
  [key: string]: string | number | boolean;
};

// ✅ better — use Record
type Config = Record<string, string | number | boolean>;

// ✅ best — if keys are known, list them
type Config = {
  host: string;
  port: number;
  debug: boolean;
};
```

---

## Rules

- **Never** `any` — use `unknown` + type guard for external data
- **Never** `as T` — use type guards, `instanceof`, `in`, discriminated unions
- **Never** `object` or `Function` — always be specific
- **Always** type function return values explicitly
- **Always** use discriminated unions for state that has variants
- **Always** prefer `unknown` over `any` for untyped external data
- **Always** use `as const` for literal arrays/objects used as types
- **Prefer** `type` over `interface` for unions, mapped types, computed types
- **Prefer** `interface` for object shapes that might be extended
