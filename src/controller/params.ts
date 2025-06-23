export type Param =
  | BodyParam
  | RequestParam
  | ReplyParam
  | QueryParam
  | ParamParam
  | HeadersParam
  | RawParam
  | ContextParam;

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
      "rep",
      target
    );
  };
}

export function Raw(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `raw:${String(propertyKey)}:${parameterIndex}`,
      "raw",
      target
    );
  };
}

export function Headers(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `headers:${String(propertyKey)}:${parameterIndex}`,
      "headers",
      target
    );
  };
}

export function Context(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    Reflect.defineMetadata(
      `context:${String(propertyKey)}:${parameterIndex}`,
      "context",
      target
    );
  };
}
