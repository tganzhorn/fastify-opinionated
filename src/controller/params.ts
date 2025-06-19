export type Param = RequestParam | ReplyParam | QueryParam | ParamParam;

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
