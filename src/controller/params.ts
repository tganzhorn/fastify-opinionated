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
  | JobParam;

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

export function Body(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `body:${String(propertyKey)}:${parameterIndex}`,
      null,
      target
    );
  };
}

export function Query(name: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `query:${String(propertyKey)}:${parameterIndex}`,
      name,
      target
    );
  };
}

export function Parameter(name: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `param:${String(propertyKey)}:${parameterIndex}`,
      name,
      target
    );
  };
}

export function Req(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `req:${String(propertyKey)}:${parameterIndex}`,
      null,
      target
    );
  };
}

export function Rep(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `rep:${String(propertyKey)}:${parameterIndex}`,
      null,
      target
    );
  };
}

export function Raw(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `raw:${String(propertyKey)}:${parameterIndex}`,
      null,
      target
    );
  };
}

export function Headers(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `headers:${String(propertyKey)}:${parameterIndex}`,
      null,
      target
    );
  };
}

export function InjectQueue(name: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `queue:${String(propertyKey)}:${parameterIndex}`,
      name,
      target
    );
  };
}

export function Job(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `job:${String(propertyKey)}:${parameterIndex}`,
      null,
      target
    );
  };
}
