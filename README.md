# 📦 Fastify Modular

Fastify Modular is a lightweight architectural layer for Fastify that introduces a clean, structured way to organize applications using controllers and services — inspired by frameworks like NestJS, but without the overhead.

It enables developers to build scalable and testable applications by separating responsibilities:

Controllers handle routing and HTTP logic.

Services encapsulate business logic and reusable operations.

---

## ✨ Features

- ✅ HTTP method decorators: `@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`, `@All`
- 🧠 Dependency Injection via `@Service`
- 🧵 Per-request scoped services via `RequestStore<T>`
- 🧹 Parameter decorators: `@Body`, `@Query`, `@Parameter`, `@Headers`, etc.
- 📜 Schema validation with `@Schema`
- 🔄 Lifecycle hooks with `OnServiceInit`
- ⏱️ Background workers via `@JobScheduler` + `@Worker`
- 📱 (Planned) SSE support via `@Sse`
- ⚡ Easy controller registration

---

## 🚀 Getting Started

### 1. Install

```bash
npm install fastify your-controller-lib
```

---

### 2. Define a Service

```ts
import { Service } from "your-controller-lib";

@Service([])
class CounterService {
  private counter = 0;
  increment() {
    return ++this.counter;
  }
}
```

#### Per-request scoped service:

```ts
import { Service, RequestStore } from "your-controller-lib";

@Service([])
class RequestScopedService extends RequestStore<{ counter: number }> {
  constructor() {
    super({ counter: 0 });
  }

  increment() {
    return ++this.requestStore.counter;
  }
}
```

---

### 3. Define a Controller

```ts
import { Controller, Get, Post, Body, Parameter } from "your-controller-lib";

@Controller("/counter", [CounterService])
class CounterController {
  constructor(private counterService: CounterService) {}

  @Get("/increment")
  increment() {
    return this.counterService.increment();
  }

  @Post("/echo")
  echo(@Body() body: any) {
    return body;
  }

  @Get("/params/:id")
  getById(@Parameter("id") id: string) {
    return id;
  }
}
```

---

### 4. Register Controllers

```ts
import Fastify from "fastify";
import { registerControllers } from "your-controller-lib";

const app = Fastify();

await registerControllers(app, {
  controllers: [CounterController],
  bullMqConnection: { host: "localhost", port: 6379 },
});

await app.listen({ port: 3000 });
```

---

## 📌 Decorators

### 🔧 Route Handlers

| Decorator       | Description            |
| --------------- | ---------------------- |
| `@Get(path)`    | Handles HTTP GET       |
| `@Post(path)`   | Handles HTTP POST      |
| `@Put(path)`    | Handles HTTP PUT       |
| `@Patch(path)`  | Handles HTTP PATCH     |
| `@Delete(path)` | Handles HTTP DELETE    |
| `@All(path)`    | Handles any method     |
| `@Sse(path)`    | Handles HTTP GET (SSE) |

---

### 📅 Parameter Injection

| Decorator        | Injects From        |
| ---------------- | ------------------- |
| `@Body()`        | Request body        |
| `@Headers()`     | Request headers     |
| `@Parameter()`   | URL path parameters |
| `@Query()`       | Query string        |
| `@Req()`         | Raw FastifyRequest  |
| `@Rep()`         | Raw FastifyReply    |
| `@Raw()`         | `{ req, res }` pair |
| `@Ctx()`         | ContextService data |
| `@Job()`         | BullMq job          |
| `@InjectQueue()` | BullMq queue        |

---

### 📜 Schema Validation

```ts
@Schema({
  body: {
    type: "object",
    properties: {
      test: { type: "string" },
    },
    required: ["test"],
  },
})
@Post("/validate")
validate(@Body() body: { test: string }) {
  return body;
}
```

---

## ⚙️ Service Lifecycle

Implement `OnServiceInit` for async setup logic:

```ts
import { OnServiceInit } from "your-controller-lib";

class InitService implements OnServiceInit {
  initialized = false;

  async onServiceInit() {
    await someAsyncSetup();
    this.initialized = true;
  }
}
```

> [!CAUTION]
> onServiceInit is never awaited so don't except it to be initialized immediately!

---

## ⏱️ Background Jobs

```ts
class WorkerController {
  @JobScheduler("test-scheduler", { every: 1000 }) // every 1s
  @Worker("test")
  async runJob() {
    // background task logic
  }
}
```

Requires BullMQ and a Redis connection configured via `registerControllers`.

---

## 📦 API

### `registerControllers(fastify, options)`

Registers all provided controllers and their workers.

#### Options:

- `controllers: Class[]` – list of controllers to register
- `bullMqConnection: { host: string; port: number }` – Redis config for BullMQ

---

## 📄 License

MIT – feel free to use, contribute, or fork!

---
