import "reflect-metadata";

export {
  All,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Parameter,
  Patch,
  Post,
  Put,
  Query,
  Raw,
  Rep,
  Req,
  Sse,
  Schema,
  OnEvent,
  InjectContext,
  JobScheduler,
  Job,
  Cache,
  InjectCache,
  InjectQueue,
  Worker,
} from "./controller/index.js";
export { Service, type OnServiceInit } from "./service/service.js";
export { registerControllers } from "./helpers.js";
export { type Ctx, ContextService } from "./ctx.js";
export { RequestStore } from "./requestStore.js";
export {
  FastifyModularError,
  isFastifyModularError,
  handleFastifyError,
} from "./errors.js";
