import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import "reflect-metadata";
import { registerControllers } from "./helpers.js";
import {
  Controller,
  Get,
  Parameter,
  Query,
  Rep,
  Req,
  Service,
  RequestStore,
  OnServiceInit,
} from "./index.js";
import { JobScheduler, Worker, Cache } from "./controller/controller.js";
import { InjectQueue, Job } from "./controller/params.js";
import { Queue } from "bullmq";
import { createCache } from "cache-manager";
import { Keyv } from "keyv";
import KeyvRedis from "@keyv/redis";

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
export class TestService2 implements OnServiceInit {
  constructor() {}

  async onServiceInit() {
    console.log("INITIALIZED");
  }

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

  globalCounter = 0;

  getGreeting() {
    return this.testService2.getWorld() + " " + this.testService3.getHello();
  }
}

@Controller("/events", [TestService])
export class FastifyRouter {
  constructor(private testService: TestService) {}

  @Cache({ ttl: 1000 })
  @Get("/cached")
  async cached() {
    return this.testService.globalCounter++;
  }

  @Get("/uncached")
  async uncached() {
    return this.testService.globalCounter++;
  }

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
    cache: createCache({
      stores: [new Keyv({ store: new KeyvRedis("redis://localhost:6379") })],
    }),
  });

  await fastify.listen({
    port: 5000,
  });
})();
