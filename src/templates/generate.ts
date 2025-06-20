import nodePlop from "node-plop";

function uncapitalize(word: string) {
  return word.charAt(0).toLowerCase() + word.slice(1);
}

const ControllerTemplate = /** hbs */ `
import { Controller } from '@tganzhorn/fastify-modular';

@Controller('/{{lname}}', [])
class {{name}}Controller {
    constructor() {}
}
`;

const ServiceTemplate = /** hbs */ `
import { Service } from '@tganzhorn/fastify-modular';

@Service([])
class {{name}}Service {
    constructor() {}
}
`;

(async () => {
  const plop = await nodePlop();

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

      if (answers.type === "controller") {
        return [
          {
            type: "add",
            path: "src/{{lname}}/{{lname}}.controller.ts",
            data: {
              name: answers.name,
              lname: uncapitalize(answers.name),
            },
            template: ControllerTemplate,
          },
        ];
      }

      return [
        {
          type: "add",
          path: "src/{{lname}}/{{lname}}.service.ts",
          data: {
            name: answers.name,
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
