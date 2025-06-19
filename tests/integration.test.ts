import { describe, it } from "node:test";
import Fastify, { HTTPMethods, InjectOptions } from "fastify";
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
  Service,
  registerControllers,
} from "../dist/index.js";
import assert from "node:assert";
import { promisify } from "node:util";

describe("Test fastify integration", async () => {
  const fastify = Fastify();

  @Service([])
  class TestService {
    constructor() {}

    getGreeting() {
      return "Hello, world!";
    }
  }

  @Controller("/test", [TestService])
  class TestController {
    constructor(private testService: TestService) {}

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
    async body(@Body() body: { test: "abc"}) {
        return body;
    }

    @Post("/headers")
    async headers(@Headers() headers: { authorization: string}) {
        return headers.authorization;
    }
  }

  registerControllers(fastify, { controllers: [TestController] });

  const promisifiedInject = async (opts: InjectOptions) => {
    return new Promise((resolve, reject) => {
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
      body: { test: "abc" }
    });

    assert.deepStrictEqual(JSON.parse(response?.body), { test: "abc" });
  });

  await it("should return headers", async () => {
    const response = await promisifiedInject({
      method: "POST",
      url: "/test/headers",
      headers: {
        authorization: "abc"
      }
    });

    assert.deepStrictEqual(response?.body, "abc");
  });

  for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"] as const) {
    await it(`should have ${method} router`, async () => {
      const response = await promisifiedInject({
        method: method,
        url: `/test/${method.toLowerCase()}`,
      });

      assert.strictEqual(response.body, method.toLowerCase());
    });
  }
});
