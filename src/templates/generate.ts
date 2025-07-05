import Handlebars from "handlebars";
import { Argument, Command } from "commander";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join, resolve, sep } from "path";
import { cwd } from "process";

const ControllerTemplate = Handlebars.compile(/** hbs */ `
import { Controller } from '@tganzhorn/fastify-modular';

@Controller('/{{lname}}', [])
export class {{cname}}Controller {
    constructor() {}
}
`);

const ServiceTemplate = Handlebars.compile(/** hbs */ `
import { Service } from '@tganzhorn/fastify-modular';

@Service([])
export class {{cname}}Service {
    constructor() {}
}
`);

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function uncapitalize(word: string) {
  return word.charAt(0).toLowerCase() + word.slice(1);
}

const program = new Command();

program
  .name("fastify-modular")
  .description("CLI to create services and controllers easily.")
  .version("0.1.0");

program
  .command("create")
  .description("create a component")
  .addArgument(
    new Argument("<component>", "component to create").choices([
      "service",
      "controller",
    ])
  )
  .addArgument(new Argument("<name>", "component name"))
  .action(async (component, name) => {
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

    const cname = capitalize(name);
    const lname = uncapitalize(name);

    const path =
      config.createSubFolders ?? true
        ? [config.root ?? "/src", lname]
        : [config.root ?? "/src"];

    let template = "";

    switch (component) {
      case "controller":
        template = ControllerTemplate({ cname, lname });
        break;
      case "service":
        template = ServiceTemplate({ cname, lname });
        break;
    }

    await mkdir(resolve(join(cwd(), ...path)), {
      recursive: true,
    });

    console.log(resolve(join(cwd(), ...path)));

    await writeFile(
      join(resolve(join(cwd(), ...path, `${lname}.${component}.ts`)))
        .split(sep)
        .filter((s) => s.length !== 0)
        .join(sep),
      template
    );
  });

program.parse();
