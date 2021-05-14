import * as core from '@actions/core'

import {IOption} from "./data";
import {deleteEnv, getActionInput, inputs, putEnv, read, write} from "./util";

async function run(): Promise<void> {
  try {
    const action = getActionInput<'put' | 'delete'>('action', true, ['put', 'delete']);
    const manifestPath = getActionInput('manifest_path', true, []);
    const options: IOption = {
      enable_update: getActionInput('enable_update', true, ['true', 'false'], 'true') === 'true',
      enable_permanent_protection: getActionInput('enable_permanent_protection', true, ['true', 'false'], 'true') === 'true',
    };
    const input = inputs();

    core.debug(`🔍 Input: ${JSON.stringify(input)}`);

    const originalManifest = read(manifestPath);
    write('.manifest.bak.yaml', originalManifest);
    core.debug(`🔍 File content: ${JSON.stringify(originalManifest)}`);
    core.setOutput('backup', '.manifest.bak.yaml');

    if (action === 'put') {
      const result = putEnv(input, originalManifest, options);

      write(manifestPath, result);
      core.debug(`✅ Updated ArgoCD Manifest Environments.`);
      core.debug(`📝 After: ${JSON.stringify(result)}`);
    }

    if (action === 'delete') {
      const result = deleteEnv(input, originalManifest, options);
      write(manifestPath, result);
      core.debug(`🔥 Deleted ArgoCD Manifest Environments.`);
      core.debug(`📝 After: ${JSON.stringify(result)}`);
    }

    core.setOutput('path', manifestPath);
  } catch (e) {
    core.error(`🚨 Exception: ${e.message}`);
  }
}

run()
