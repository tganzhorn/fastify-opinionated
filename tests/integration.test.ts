import { describe, it } from "node:test";
import Fastify, { InjectOptions, LightMyRequestResponse } from "fastify";
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Headers,
  Parameter,
  Query,
  Raw,
  Rep,
  Req,
  Schema,
  Service,
  All,
  RequestStore,
  registerControllers,
} from "../dist/index.js";
// } from "../src/index"
import assert from "node:assert";
import { Type } from "@sinclair/typebox";

describe("Integration tests", async () => {
  const fastify = Fastify();

  @Service([])
  class TestService {
    constructor() {}

    getGreeting() {
      return "Hello, world!";
    }

    private counter = 0;
    increment() {
      return ++this.counter;
    }
  }

  @Service([])
  class TestService2 extends RequestStore {
    constructor() {
      super({ counter: 0 });
    }

    increment() {
      return ++this.requestStore.counter;
    }

    initialized = false;

    async onServiceInit() {
      await new Promise((resolve) => {
        setTimeout(resolve, 400);
      });

      this.initialized = true;
    }
  }

  @Controller("/test", [TestService, TestService2])
  class TestController {
    constructor(
      private testService: TestService,
      private testService2: TestService2
    ) {}

    @Get("/increment")
    async increment() {
      return this.testService.increment();
    }

    @Get("/increment_per_request")
    async incrementPerRequest() {
      return this.testService2.increment();
    }

    @Get("/:id")
    async testId(@Parameter("id") id: string) {
      return id;
    }

    @Get("/query")
    async query(@Query("test") test: string) {
      return test;
    }

    @Get("/get")
    async _get() {
      return "get";
    }

    @Post("/post")
    async _post() {
      return "post";
    }

    @Put("/put")
    async _put() {
      return "put";
    }

    @Patch("/patch")
    async _patch() {
      return "patch";
    }

    @Delete("/delete")
    async _delete() {
      return "delete";
    }

    @Get("/service")
    async _service() {
      return "service";
    }

    @Post("/body")
    async body(@Body() body: { test: "abc" }) {
      return body;
    }

    @Post("/headers")
    async headers(@Headers() headers: { authorization: string }) {
      return headers.authorization;
    }

    @Post("/schema")
    @Schema({ body: Type.Object({ test: Type.String() }) })
    async schema(@Body() body: { test: "abc" }) {
      return body;
    }

    @All("/all")
    async all() {
      return "all";
    }

    @All("/async_init")
    async asyncInit() {
      return this.testService2.initialized;
    }
  }

  await registerControllers(fastify, { controllers: [TestController] });

  const promisifiedInject = async (opts: InjectOptions) => {
    return new Promise<LightMyRequestResponse>((resolve, reject) => {
      fastify.inject(opts, (error, response) => {
        resolve(response);
        reject(error);
      });
    });
  };

  await it("should return parameter", async () => {
    const response = await promisifiedInject({
      method: "GET",
      url: "/test/abc",
    });

    assert.strictEqual(response?.body, "abc");
  });

  await it("should return query parameter", async () => {
    const response = await promisifiedInject({
      method: "GET",
      url: "/test/query?test=abc",
    });

    assert.strictEqual(response?.body, "abc");
  });

  await it("should return service value", async () => {
    const response = await promisifiedInject({
      method: "GET",
      url: "/test/service",
    });

    assert.strictEqual(response?.body, "service");
  });

  await it("should return body", async () => {
    const response = await promisifiedInject({
      method: "POST",
      url: "/test/body",
      body: { test: "abc" },
    });

    assert.deepStrictEqual(JSON.parse(response?.body), { test: "abc" });
  });

  await it("should return headers", async () => {
    const response = await promisifiedInject({
      method: "POST",
      url: "/test/headers",
      headers: {
        authorization: "abc",
      },
    });

    assert.deepStrictEqual(response?.body, "abc");
  });

  await it("should throw an error because of wrong schema", async () => {
    const response = await promisifiedInject({
      method: "POST",
      url: "/test/schema",
      body: { noTest: 0 },
    });

    assert.strictEqual(response.statusCode, 400);
  });

  await it("service should be a singleton", async () => {
    const response = await promisifiedInject({
      method: "GET",
      url: "/test/increment",
    });

    assert.strictEqual(response.body, "1");

    const response2 = await promisifiedInject({
      method: "GET",
      url: "/test/increment",
    });

    assert.strictEqual(response2.body, "2");
  });

  await it("service should be per request", async () => {
    const response = await promisifiedInject({
      method: "GET",
      url: "/test/increment_per_request",
    });

    assert.strictEqual(response.body, "1");

    const response2 = await promisifiedInject({
      method: "GET",
      url: "/test/increment_per_request",
    });

    assert.strictEqual(response2.body, "1");
  });

  for (const method of [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "ALL",
  ] as const) {
    await it(`should have ${method} router`, async () => {
      if (method === "ALL") {
        for (const method of [
          "GET",
          "POST",
          "PUT",
          "PATCH",
          "DELETE",
        ] as const) {
          const response = await promisifiedInject({
            method,
            url: "/test/all",
          });

          assert.strictEqual(response.body, "all");
        }
      } else {
        const response = await promisifiedInject({
          method: method,
          url: `/test/${method.toLowerCase()}`,
        });

        assert.strictEqual(response.body, method.toLowerCase());
      }
    });
  }
});
