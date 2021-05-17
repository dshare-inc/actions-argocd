import * as yaml from 'js-yaml';
import * as fs from 'fs';
import clone from 'clone';
import * as core from '@actions/core'

import {IEnvironment, IManifest, IOption} from "./data";
import {FAILSAFE_SCHEMA} from "js-yaml";

export function getActionInput<T>(key: string, required: boolean, restricted: T[] = [], defaults?: T): T {
  const input = core.getInput(key, {required}).toString();
  if (input === '' && defaults !== undefined) {
    return defaults;
  }

  if (restricted.length > 0 && !restricted.includes(input as any)) {
    throw new Error(`Invalid Input ${key}. Value is <${input}>`);
  }

  return input as unknown as T;
}

export const inputs = (): IEnvironment => {
  return {
    env: getActionInput<string>('env', true, []).toString(),
    key: getActionInput<string>('key', true, []).toString(),
    lifecycle: getActionInput<'temporary' | 'permanent'>('lifecycle', false, ['temporary', 'permanent'], 'temporary'),
    action_type: getActionInput<'push' | 'pull_request'>('action_type', true, ['push', 'pull_request']),
    action_labels: {
      worker_number: getActionInput<string>('action_worker_number', true),
      commit_message: getActionInput<string>('action_commit_message', false, [], ''),
      commit_sha: getActionInput<string>('action_commit_sha', false, [], ''),
    },
    image: {
      tag: getActionInput<string>('image_tag', true),
    },
    deployment: {
      strategy: getActionInput('deployment_strategy', false, ['blue_green', 'canary', 'none'], 'none'),
    }
  };
}

export const read = (path: string): IManifest => {
  const result = yaml.load(fs.readFileSync(path).toString(), {schema: FAILSAFE_SCHEMA}) as IManifest;

  if (result === undefined) {
    throw new Error(`Read error! ${path}.`);
  }

  return result;
};

export const write = (path: string, content: IManifest) => {
  fs.writeFileSync(path, yaml.dump(content, {sortKeys: false}), { flag: 'w' });
}

export const environments = (manifest: IManifest) => manifest.environments;

export const putEnv = (put: IEnvironment, manifest: IManifest, options: IOption): IManifest => {
  if (!options.enable_update && existsEnv(put.env, put.key, manifest)) {
    core.debug(manifest.toString());
    throw new Error(`Environment ${put.env} - ${put.key} already exists!`);
  }

  const result = clone<IManifest>(manifest);
  if (existsEnv(put.env, put.key, manifest)) {
    result.environments[getEnvIndexOf(put.env, put.key, result)] = {
      ...put,
      key: put.key.toString(),
    };
    return result;
  }

  result.environments.push({
    ...put,
    key: put.key.toString(),
  });
  return result;
}

export const deleteEnv = (put: IEnvironment, manifest: IManifest, options: IOption): IManifest => {
  if (!existsEnv(put.env, put.key, manifest)) {
    core.debug(manifest.toString());
    throw new Error(`Environment ${put.env} - ${put.key} not exists.`);
  }

  if (options.enable_permanent_protection && existsEnv(put.env, put.key, manifest) && getEnv(put.env, put.key, manifest).lifecycle === 'permanent') {
    core.debug(manifest.toString());
    throw new Error(`Protected exception [${put.env} - ${put.key}].`);
  }

  const result = clone<IManifest>(manifest);
  result.environments.splice(getEnvIndexOf(put.env, put.key, result), 1);

  return result;
}

export const existsEnv = (env: string, key: string, manifest: IManifest): boolean => manifest.environments
    .filter(environment => environment.env === env && environment.key === key)
    .length > 0;

export const getEnv = (env: string, key: string, manifest: IManifest): IEnvironment => {
  const result = manifest.environments
  .find(m => m.env === env && m.key === key);

  if (result === undefined) {
    core.debug(JSON.stringify(manifest));
    throw new Error(`Environment ${env} - ${key} not exists (find)`);
  }

  return result;
}

export const getEnvIndexOf = (env: string, key: string, manifest: IManifest): number => manifest.environments
  .findIndex(environment => environment.env === env && environment.key === key);

