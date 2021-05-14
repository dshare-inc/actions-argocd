import {deleteEnv, getEnv, putEnv, read, write} from "../src/util";
import {IEnvironment, IManifest} from "../src/data";

describe('getEnv', () => {
  test('Get single item', () => {
    const env = 'dev';
    const key = 'my_key1';

    const result = getEnv(env, key, {
      environments: [
        {
          env: 'dev',
          key: 'my_key1'
        }
      ]
    } as IManifest);

    expect(result)
    .toEqual({env: 'dev', key: 'my_key1'});
  });

  test('Get single item in collection', () => {
    const env = 'dev';
    const key = 'u_key_1';

    const result = getEnv(env, key, {
      environments: [
        {
          env: 'dev',
          key: 'unknown_key',
        },
        {
          env: 'stage',
          key: 'randomn',
        },
        {
          env: 'stage',
          key: 'u_key_1',
        },
        {
          env: 'dev',
          key: 'u_key_1'
        },
        {
          env: 'prod',
          key: 'u_key_1'
        }
      ]
    } as IManifest);

    expect(result)
    .toEqual({env: 'dev', key: 'u_key_1'});
  });

  test('No match found', () => {
    expect(() => {
      getEnv('dev', 'unknown', {
        environments: [
          {
            env: 'dev',
            key: 'a'
          },
          {
            env: 'dev',
            key: 'b',
          },
          {
            env: 'prod',
            key: 'unknown'
          },
        ],
      } as IManifest)
    }).toThrow();
  })
});

describe('putEnv', () => {
  it('Create item', async () => {
    const result = putEnv({
      env: 'dev',
      action_type: 'push',
      key: '1',
    } as any, {environments: []} as unknown as IManifest, {
      enable_update: false,
      enable_permanent_protection: false
    });

    expect(result)
    .toEqual({
      environments: [{
        env: 'dev',
        action_type: 'push',
        key: '1',
      }]
    });
  });

  it('Append item', async () => {
    const result = putEnv({
      env: 'dev',
      action_type: 'push',
      key: '1',
    } as IEnvironment, {
      environments: [
        {
          env: 'prod',
          action_type: 'pull_request',
          key: '1',
        },
        {
          env: 'dev',
          action_type: 'push',
          key: '0',
        }
      ]
    } as unknown as IManifest, {
      enable_update: false,
      enable_permanent_protection: false
    });

    expect(result)
    .toEqual({
      environments: [
        {
          env: 'prod',
          action_type: 'pull_request',
          key: '1',
        },
        {
          env: 'dev',
          action_type: 'push',
          key: '0',
        },
        {
          env: 'dev',
          action_type: 'push',
          key: '1',
        }]
    });
  });

  it('Update Item', async () => {
    const result = putEnv({
      env: 'dev',
      action_type: 'push',
      image: {
        tag: 'UPDATE_TO'
      },
      key: '1',
    } as any, {
      environments: [
        {
          env: 'prod',
          action_type: 'pull_request',
          key: '1',
        },
        {
          env: 'dev',
          action_type: 'push',
          image: {
            tag: 'BEFORE'
          },
          key: '1',
        },
        {
          env: 'dev',
          action_type: 'push',
          key: '2',
        },
        {
          env: 'stage',
          action_type: 'pull_request',
          key: '1',
        }
      ]
    } as unknown as IManifest, {
      enable_update: true,
      enable_permanent_protection: false
    });

    expect(result)
    .toEqual({
      environments: [
        {
          env: 'prod',
          action_type: 'pull_request',
          key: '1',
        },
        {
          env: 'dev',
          action_type: 'push',
          image: {
            tag: 'UPDATE_TO'
          },
          key: '1',
        },
        {
          env: 'dev',
          action_type: 'push',
          key: '2',
        },
        {
          env: 'stage',
          action_type: 'pull_request',
          key: '1',
        }
      ]
    })
  });

  it('Throw exception when call put cause alreay exists', async () => {
    expect(() => {
      const result = putEnv({
        env: 'prod',
        action_type: 'push',
        key: '1',
      } as IEnvironment, {
        environments: [
          {
            env: 'prod',
            action_type: 'pull_request',
            key: '1',
          },
        ]
      } as unknown as IManifest, {
        enable_update: false,
        enable_permanent_protection: false
      });
    }).toThrow();
  });
});

describe('deleteEnv', () => {
  it('Delete single item, to empty collection', async () => {
    const result = deleteEnv({
      env: 'dev',
      key: '2'
    } as any, {
      environments: [
        {
          env: 'dev',
          lifecycle: 'temporary',
          key: '2'
        },
      ],
    } as any, {
      enable_update: false,
      enable_permanent_protection: true
    });

    expect(result)
    .toEqual({
      environments: []
    });
  });

  it('Delete single item from collection', async () => {
    const target = {
      env: 'dev',
      key: '2',
    } as IEnvironment;

    const environments = {
      environments: [
        {
          env: 'prod',
          lifecycle: 'temporary',
          key: '2'
        },
        {
          env: 'dev',
          lifecycle: 'temporary',
          key: '1',
        },
        {
          env: 'dev',
          lifecycle: 'temporary',
          key: '2',
        },
        {
          env: 'dev',
          lifecycle: 'temporary',
          key: '1',
        },
      ]
    } as IManifest;

    const result = deleteEnv(target, environments, {
      enable_permanent_protection: true,
      enable_update: true
    });

    expect(result)
    .toEqual({
      environments: [
        {
          env: 'prod',
          lifecycle: 'temporary',
          key: '2'
        },
        {
          env: 'dev',
          lifecycle: 'temporary',
          key: '1',
        },
        {
          env: 'dev',
          lifecycle: 'temporary',
          key: '1',
        },
      ]
    })
  });

  it('Exception cause protection rule', async () => {
    expect(() => {
      const target = {
        env: 'dev',
        key: '2',
      } as IEnvironment;

      const environments = {
        environments: [
          {
            env: 'prod',
            lifecycle: 'temporary',
            key: '2'
          },
          {
            env: 'dev',
            lifecycle: 'temporary',
            key: '1',
          },
          {
            env: 'dev',
            lifecycle: 'permanent',
            key: '2',
          },
          {
            env: 'dev',
            lifecycle: 'temporary',
            key: '1',
          },
        ]
      } as IManifest;

      const result = deleteEnv(target, environments, {
        enable_permanent_protection: true,
        enable_update: true
      });
    }).toThrow();
  });
});

describe('yaml', () => {
  it('read', () => {
    const result = read(`${__dirname}/test-yaml.yaml`);

    expect(result)
    .toEqual({
      "application": {"health": {"path": "/actuator/health", "port": "5000", "type": "HTTP"}},
      "deployment": {
        "blue_green": {
          "activeService": null,
          "autoPromotionEnabled": "true",
          "previewService": null
        },
        "canary": {
          "maxSurge": "25%",
          "maxUnavailable": "0",
          "steps": [{"setWeight": "10"}, {"pause": {"duration": "1h"}}, {"setWeight": "20"}, {"pause": {}}]
        },
        "environments": {
          "dev": {
            "blue_green": {
              "activeService": null,
              "autoPromotionEnabled": "true",
              "previewService": null
            }
          }
        }
      },
      "description": "Hey, yo, i-am-description!",
      "destination": {
        "clusters": {
          "dev": {"cluster": "eks-name-dev", "name": "Some (Development)"},
          "prod": {"cluster": "eks-name-prod", "name": "Some (Production)"},
          "stage": {"cluster": "eks-name-stage", "name": "Some (Stage)"}
        }, "namespace": "api"
      },
      "environments": [{
        "action_labels": {
          "commit_message": "",
          "commit_sha": "",
          "worker_number": ""
        },
        "action_type": "pull_request",
        "deployment": {"strategy": "blue_green"},
        "env": "dev",
        "image": {"tag": "IMAGE_TAG"},
        "key": "183",
        "lifecycle": "temporary"
      }],
      "image": {"imagePullPolicy": "", "repository": ""},
      "ingress": {
        "enabled": "true",
        "environments": {
          "dev": {
            "acm": ["1", "2"],
            "domain": {"enable_www": "true", "primary": "my_primary.domain.io", "type": "primary"},
            "security_groups": ["1", "2"]
          }
        }
      },
      "name": "api",
      "repository": {"name": "naemo-app-modules", "url": "git://GIT_ADDRESS"}
    });
  });

  it('write', () => {
    const content = {
      "application": {"health": {"path": "/actuator/health", "port": "5000", "type": "HTTP"}},
      "deployment": {
        "blue_green": {
          "activeService": null,
          "autoPromotionEnabled": "true",
          "previewService": null
        },
        "canary": {
          "maxSurge": "25%",
          "maxUnavailable": "0",
          "steps": [{"setWeight": "10"}, {"pause": {"duration": "1h"}}, {"setWeight": "20"}, {"pause": {}}]
        },
        "environments": {
          "dev": {
            "blue_green": {
              "activeService": null,
              "autoPromotionEnabled": "true",
              "previewService": null
            }
          }
        }
      },
      "description": "Hey, yo, i-am-description!",
      "destination": {
        "clusters": {
          "dev": {"cluster": "eks-name-dev", "name": "Some (Development)"},
          "prod": {"cluster": "eks-name-prod", "name": "Some (Production)"},
          "stage": {"cluster": "eks-name-stage", "name": "Some (Stage)"}
        }, "namespace": "api"
      },
      "environments": [{
        "action_labels": {
          "commit_message": "",
          "commit_sha": "",
          "worker_number": ""
        },
        "action_type": "pull_request",
        "deployment": {"strategy": "blue_green"},
        "env": "dev",
        "image": {"tag": "IMAGE_TAG"},
        "key": "183",
        "lifecycle": "temporary"
      }],
      "image": {"imagePullPolicy": "", "repository": ""},
      "ingress": {
        "enabled": "true",
        "environments": {
          "dev": {
            "acm": ["1", "2"],
            "domain": {"enable_www": "true", "primary": "my_primary.domain.io", "type": "primary"},
            "security_groups": ["1", "2"]
          }
        }
      },
      "name": "api",
      "repository": {"name": "naemo-app-modules", "url": "git://GIT_ADDRESS"}
    };

    write(`${__dirname}/test-yaml-result.yaml`, content as IManifest);
  })
})
