export type Param =
  | BodyParam
  | RequestParam
  | ReplyParam
  | QueryParam
  | ParamParam
  | HeadersParam
  | RawParam
  | ContextParam
  | QueueParam
  | JobParam
  | CacheParam;

type RequestParam = {
  type: "req";
  methodName: string;
};

type ReplyParam = {
  type: "rep";
  methodName: string;
};

type QueryParam = {
  type: "query";
  name: string;
  methodName: string;
};

type ParamParam = {
  type: "param";
  name: string;
  methodName: string;
};

type BodyParam = {
  type: "body";
  methodName: string;
};

type HeadersParam = {
  type: "headers";
  methodName: string;
};

type RawParam = {
  type: "raw";
  methodName: string;
};

type ContextParam = {
  type: "context";
  methodName: string;
};

type QueueParam = {
  type: "queue";
  methodName: string;
  name: string;
};

type JobParam = {
  type: "job";
  methodName: string;
};

type CacheParam = {
  type: "cache";
  methodName: string;
};

type OnEventParam = {
  type: "onEvent";
  methodName: string;
  event: string;
};

/**
 * @function Body
 * @description Decorator that injects the parsed HTTP request body into the controller method parameter.
 * @returns ParameterDecorator
 * @example
 * @Post("/example")
 * example(@Body() body: any) {}
 */
export function Body(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `body:${String(propertyKey)}:${parameterIndex}`,
      null,
      target
    );
  };
}

/**
 * @function Query
 * @description Decorator that injects a value from the request's query string by name.
 * @param name - The name of the query parameter to inject.
 * @returns ParameterDecorator
 * @example
 * @Get("/search")
 * search(@Query("term") term: string) {}
 */
export function Query(name: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `query:${String(propertyKey)}:${parameterIndex}`,
      name,
      target
    );
  };
}

/**
 * @function Parameter
 * @description Decorator that injects a path parameter from the request URL (e.g. /user/:id).
 * @param name - The name of the route parameter to inject.
 * @returns ParameterDecorator
 * @example
 * @Get("/user/:id")
 * getUser(@Parameter("id") id: string) {}
 */
export function Parameter(name: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `param:${String(propertyKey)}:${parameterIndex}`,
      name,
      target
    );
  };
}

/**
 * @function Req
 * @description Decorator that injects the raw FastifyRequest object into the controller method.
 * @returns ParameterDecorator
 * @example
 * handler(@Req() req: FastifyRequest) {}
 */
export function Req(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `req:${String(propertyKey)}:${parameterIndex}`,
      null,
      target
    );
  };
}

/**
 * @function Rep
 * @description Decorator that injects the FastifyReply object into the controller method.
 * @returns ParameterDecorator
 * @example
 * handler(@Rep() reply: FastifyReply) {}
 */
export function Rep(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `rep:${String(propertyKey)}:${parameterIndex}`,
      null,
      target
    );
  };
}

/**
 * @function Raw
 * @description Decorator that injects the raw NodeJs req/res pair (useful for low-level access).
 * @returns ParameterDecorator
 * @example
 * handler(@Raw() raw: { req: IncomingMessage, res: ServerResponse }) {}
 */
export function Raw(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `raw:${String(propertyKey)}:${parameterIndex}`,
      null,
      target
    );
  };
}

/**
 * @function Headers
 * @description Decorator that injects the request headers object into the controller method.
 * @returns ParameterDecorator
 * @example
 * handler(@Headers() headers: Record<string, string>) {}
 */
export function Headers(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `headers:${String(propertyKey)}:${parameterIndex}`,
      null,
      target
    );
  };
}

/**
 * @function InjectQueue
 * @description Decorator that injects a BullMQ queue instance by name into the controller method.
 * @param name - The name of the BullMQ queue to inject.
 * @returns ParameterDecorator
 * @example
 * handler(@InjectQueue("emailQueue") queue: Queue) {}
 */
export function InjectQueue(name: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `queue:${String(propertyKey)}:${parameterIndex}`,
      name,
      target
    );
  };
}

/**
 * @function Job
 * @description Decorator that injects the BullMQ Job instance currently being processed.
 * @returns ParameterDecorator
 * @example
 * @Worker("email")
 * process(@Job() job: Job) {}
 */
export function Job(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `job:${String(propertyKey)}:${parameterIndex}`,
      null,
      target
    );
  };
}

/**
 * @function InjectCache
 * @description Decorator that injects the cache instance.
 * @returns ParameterDecorator
 * @example
 * handler(@InjectCache() cache: Cache) {}
 */
export function InjectCache(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `cache:${String(propertyKey)}:${parameterIndex}`,
      null,
      target
    );
  };
}

/**
 * @function InjectContext
 * @description Decorator that injects a context object for the current request / job (e.g., for DI or shared state).
 * @returns ParameterDecorator
 * @example
 * handler(@InjectContext() ctx: Ctx) {}
 */
export function InjectContext(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `context:${String(propertyKey)}:${parameterIndex}`,
      null,
      target
    );
  };
}
