export interface IManifest {
  name: string
  repository: {
    name: string
  }
  image: {
    repository: string
    imagePullPolicy: string
  }
  destination: {
    namespace: string
    clusters: {
      [key: string]: {
        name: string
        cluster: string
      }
    }
    [key: string]: any
  }
  deployment: {
    environments: {
      [key: string]: any
    }
    blue_green: {
      [key: string]: any
    }
    canary: {
      [key: string]: any
    }
  }
  application: {
    health: {
      type: string
      port: string
      path: string
    }
    [key: string]: any
  }
  ingress: {
    enabled: 'true' | 'false',
    environments: {
      [key: string]: {
        domain: {
          type: 'primary' | 'subdomain'
          enable_www: 'true' | 'false',
          primary: string
        }
        acm: string[]
        security_groups: string[]
      }
    }
  }
  environments: IEnvironment[]
}

export interface IEnvironment {
  env: string
  lifecycle: 'temporary' | 'permanent'
  key: string
  action_type: 'push' | 'pull_request'
  action_labels: {
    worker_number: string
    commit_message: string
    commit_sha: string
  }
  image: {
    tag: string
  }
  deployment: {
    strategy: 'blue_green' | 'canary' | 'none'
  }
}

export interface IOption {
  enable_update: boolean
  enable_permanent_protection: boolean
}
