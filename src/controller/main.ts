import Fastify from "fastify";
import { FastifyReply, FastifyRequest } from "fastify";
import {
  Controller,
  Get,
  Rep,
  Query,
  Parameter,
  Req,
  registerControllers,
} from "fastify-modular";
import { TestService } from "./service";

const fastify = Fastify({
  logger: true,
});

@Controller("/events")
export class FastifyRouter {
  constructor(private testService: TestService) {}

  @Get("/:id")
  async test(
    @Req() request: FastifyRequest,
    @Rep() reply: FastifyReply,
    @Query("info") info: string,
    @Parameter("id") id: string
  ) {
    console.log(this.testService);
    return reply.send({
      ok: true,
      info,
      id,
    //   hello: this.testService.getGreeting(),
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
