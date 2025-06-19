import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import { registerControllers } from "./helpers.js";
import {
  Controller,
  Get,
  Service,
  Req,
  Rep,
  Query,
  Parameter,
} from "./index.js";

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

registerControllers(fastify, { controllers: [FastifyRouter] });

(async () => {
  await fastify.ready();

  await fastify.listen({
    port: 5000,
  });
})();
