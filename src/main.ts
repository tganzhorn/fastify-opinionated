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
  Ctx,
} from "./index.js";
import crypto from "crypto";
import { JobScheduler, Worker } from "./controller/controller.js";
import { InjectQueue, Job } from "./controller/params.js";
import { Queue } from "bullmq";

const a = new Uint8Array(32);

const secret = crypto.createHash("sha1").update(a).digest("hex");

console.log(
  `otpauth://totp/MUBEA:tganzhorn@gmail.com?secret=${secret.toUpperCase()}&issuer=MUBEA&algorithm=SHA1&digits=6&period=30`
);

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
    return this.testService2.getWorld() + " " + this.testService3.getHello();
  }
}

@Controller("/events", [TestService, ContextService])
export class FastifyRouter {
  constructor(
    private testService: TestService,
    private contextService: ContextService
  ) {}

  @Get("/:id")
  async test(
    @Req() request: FastifyRequest,
    @Rep() reply: FastifyReply,
    @Query("info") info: string,
    @Parameter("id") id: string,
    @InjectQueue("test") queue: Queue
  ) {
    queue.add("was geht", { abc: true });

    return reply.send({
      ok: true,
      info,
      id,
      hello: this.testService.getGreeting(),
    });
  }

  @JobScheduler("scheduler", { every: 5000 })
  @Worker("test")
  async allesKlar(@InjectQueue("test") queue: Queue, @Job() job: any) {
    console.log("YESSA", job.data);
  }
}

(async () => {
  registerControllers(fastify, {
    controllers: [FastifyRouter],
    bullMqConnection: {
      host: "localhost",
      port: 6379,
    },
  });

  await fastify.listen({
    port: 5000,
  });
})();
