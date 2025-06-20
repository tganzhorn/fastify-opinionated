# 📦 Fastify Modular

Fastify Modular is a lightweight architectural layer for Fastify that introduces a clean, structured way to organize applications using controllers and services — inspired by frameworks like NestJS, but without the overhead.

It enables developers to build scalable and testable applications by separating responsibilities:

Controllers handle routing and HTTP logic.

Services encapsulate business logic and reusable operations.

## Installation

Install via

```bash
npm install @tganzhorn/fastify-modular
```

## Minimal implementation

Main.ts

```ts
import Fastify from "fastify";
import { FastifyRouter } from "./router.js";
import { registerControllers } from "fastify-modular";

const fastify = Fastify({
  logger: true,
});

registerControllers(fastify, { controllers: [ExampleController] });

(async () => {
  await fastify.ready();

  await fastify.listen({
    port: 5000,
  });
})();
```

ExampleController

```ts
import { Controller, Get, Req, Rep, Query, Parameter } from "fastify-modular";

@Controller("/events", [TestService])
export class ExampleController {
  constructor(private testService: TestService) {}

  @Get("/:id")
  async test(
    @Req() request: FastifyRequest,
    @Rep() reply: FastifyReply,
    @Query("info") info: string,
    @Parameter("id") id: string
  ) {
    return reply.send({
      ok: true,
      info,
      id,
      hello: this.testService.getGreeting(),
    });
  }
}
```

Service

```ts
import { Service } from "./lib/service/service.js";

@Service([])
export class TestService3 {
  constructor() {}

  getHello() {
    return "Hello";
  }
}

@Service([])
export class TestService2 {
  constructor() {}

  getWorld() {
    return "World";
  }
}

@Service([TestService2, TestService3])
export class TestService {
  constructor(
    private testService2: TestService2,
    private testService3: TestService3
  ) {}

  getGreeting() {
    return this.testService2.getWorld() + " " + this.testService3.getHello();
  }
}
```

## Code Generator

### Generate components

```
pnpm fastify-modular generate
```

### Settings

Create a .fastify-modular.rc.

```
{
 "$schema": "https://raw.githubusercontent.com/tganzhorn/fastify-opinionated/refs/heads/main/fastify-modular.rc.schema.json",
 "root": "/src"
}
```

In it you can change where your source files will be generated.
