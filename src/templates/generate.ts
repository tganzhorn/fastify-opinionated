import { readFile } from "fs/promises";
import nodePlop from "node-plop";
import { join, sep } from "path";

function capitalize(word: string) {
  return word.charAt(0).toLowerCase() + word.slice(1);
}

function uncapitalize(word: string) {
  return word.charAt(0).toLowerCase() + word.slice(1);
}

const ControllerTemplate = /** hbs */ `
import { Controller } from '@tganzhorn/fastify-modular';

@Controller('/{{lname}}', [])
export class {{name}}Controller {
    constructor() {}
}
`;

const ServiceTemplate = /** hbs */ `
import { Service } from '@tganzhorn/fastify-modular';

@Service([])
export class {{name}}Service {
    constructor() {}
}
`;

(async () => {
  const plop = await nodePlop();

  let config: { root?: string; createSubFolders?: boolean } = {
    root: "/src",
    createSubFolders: true,
  };

  try {
    const conf = JSON.parse(
      (await readFile(".fastify-modular.rc.json")).toString()
    );

    config = conf;
  } catch (e) {}

  const generator = plop.setGenerator("component", {
    description: "Generate component.",
    prompts: [
      {
        name: "type",
        type: "list",
        choices: ["controller", "service"],
        message: "Select component type:",
      },
      {
        name: "name",
        type: "input",
        message: "Please enter a name:",
      },
    ],
    actions: function (answers) {
      if (!answers) throw new Error("Something went wrong!");

      const path =
        config.createSubFolders ?? true
          ? [config.root ?? "/src", "{{lname}}"]
          : [config.root ?? "/src"];

      if (answers.type === "controller") {
        return [
          {
            type: "add",
            path: join(...path, "{{lname}}.controller.ts")
              .split(sep)
              .filter((s) => s.length !== 0)
              .join("/"),
            data: {
              name: capitalize(answers.name),
              lname: uncapitalize(answers.name),
            },
            template: ControllerTemplate,
          },
        ];
      }

      return [
        {
          type: "add",
          path: join(...path, "{{lname}}.service.ts")
            .split(sep)
            .filter((s) => s.length !== 0)
            .join("/"),
          data: {
            name: capitalize(answers.name),
            lname: uncapitalize(answers.name),
          },
          template: ServiceTemplate,
        },
      ];
    },
  });

  const answers = await generator.runPrompts();

  await generator.runActions(answers);
})()
  .catch(() => process.exit(1))
  .finally(() => process.exit(0));
