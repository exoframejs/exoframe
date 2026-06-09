import chalk from 'chalk';
import { readFile, stat } from 'fs/promises';
import inquirer from 'inquirer';
import path from 'path';
import type { ProjectConfigDraft } from '../../types.ts';
import { configPrompts, defaultConfigBase, generateConfigPrompt, writeConfig } from './util.ts';

type ConfigArgs = Partial<ProjectConfigDraft>;

export const configHandler = async (args: ConfigArgs) => {
  const { domain, port, project, name, restart, hostname } = args;

  const workdir = process.cwd();
  const folderName = path.basename(workdir);
  const nonInteractive = Object.keys(args).some((key) => String(args[key]).length > 0);
  const configPath = path.join(workdir, 'exoframe.json');
  let defaultConfig: ProjectConfigDraft = {
    ...defaultConfigBase,
    name: folderName,
  };
  try {
    await stat(configPath);
    console.log(chalk.green('Config already exists! Editing..'));
    defaultConfig = JSON.parse(await readFile(configPath, 'utf-8')) as ProjectConfigDraft;
  } catch (e) {
    // check if config didn't exist
    if (e instanceof Error && e.message.includes('ENOENT')) {
      console.log('Creating new config..');
    } else {
      // if parsing fails - show message and die
      console.log(chalk.red('Error parsing existing config! Please make sure it is valid and try again.'));
      return;
    }
  }

  const newConfig = { ...defaultConfig };
  if (nonInteractive) {
    console.log(chalk.yellow('Mode changed to'), 'non-interactive');
  }

  const overrideFromArgument = (key: keyof ProjectConfigDraft, value: string | boolean | undefined) => {
    if (!value) return;
    console.log('Setting', chalk.red(key), 'to', chalk.yellow(value));
    Object.assign(newConfig, { [key]: value } as Partial<ProjectConfigDraft>);
  };

  // override from args if needed
  overrideFromArgument('domain', domain);
  overrideFromArgument('port', port);
  overrideFromArgument('name', name);
  overrideFromArgument('project', project);
  overrideFromArgument('restart', restart);
  overrideFromArgument('hostname', hostname);

  if (!nonInteractive) {
    const cfgPrompts = generateConfigPrompt(newConfig);
    const { prop } = await inquirer.prompt<{ prop: keyof typeof configPrompts | 'abort' }>(cfgPrompts);
    if (prop === 'abort') {
      console.log(chalk.red('Aborted on user request'));
      return;
    }
    // create new prompt for specific prop chosen by user
    const propPrompts = configPrompts[prop](newConfig);
    const res = await inquirer.prompt<Record<string, string | number | boolean | undefined>>(propPrompts);
    // write values to new config
    Object.assign(newConfig, res as Partial<ProjectConfigDraft>);
  }

  // save config to file
  await writeConfig(configPath, { ...defaultConfig, ...newConfig });
};
