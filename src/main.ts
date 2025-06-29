import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import "reflect-metadata";
import { registerControllers } from "./helpers.js";
import {
  ContextService,
  Controller,
  Get,
  Parameter,
  Query,
  Rep,
  Req,
  Service,
  RequestStore,
} from "./index.js";

import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

const fastify = Fastify({
  logger: true,
});

@Service([])
export class TestService3 {
  constructor() {}

  getHello() {
    return "Hello";
  }
}

@Service([ContextService])
export class TestService2 {
  constructor(private contextService: ContextService) {}

  getWorld() {
    return "World";
  }
}

@Service([TestService2, TestService3])
export class TestService extends RequestStore<{ counter: number }> {
  constructor(
    private testService2: TestService2,
    private testService3: TestService3
  ) {
    super({ counter: 0 });
  }

  getGreeting() {
    console.log(this.requestStore.counter++);
    console.log(this.requestStore.counter++);
    return this.testService2.getWorld() + " " + this.testService3.getHello();
  }
}

@Controller("/events", [TestService])
export class FastifyRouter {
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

(async () => {
  registerControllers(fastify, {
    controllers: [FastifyRouter],
  });

  fastify.get(
    "/ping",
    {
      schema: {
        response: {
          204: {},
        },
      },
    },
    async (request, reply) => {}
  );

  fastify.register(fastifySwagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "FHH VR - Backend API",
        description: "This is the backend api for the FHHVR Project.",
        // version: json.version,
        version: "0",
      },
      servers: [
        {
          url: "http://localhost:5000",
          description: "Development server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [],
    },
  });

  fastify.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
    staticCSP: true,
    transformSpecificationClone: true,
  });

  await fastify.ready();
  fastify.swagger();
  await fastify.listen({
    port: 5000,
  });
})();
