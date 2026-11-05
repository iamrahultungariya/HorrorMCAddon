import { v4 as uuidv4 } from 'uuid';

export interface BedrockManifestOptions {
  name: string;
  description?: string;
  version?: [number, number, number];
  minEngineVersion?: [number, number, number];
  author?: string;
}

export interface BedrockPackManifests {
  resourcePack: {
    format_version: number;
    header: {
      name: string;
      description: string;
      uuid: string;
      version: [number, number, number];
      min_engine_version: [number, number, number];
    };
    modules: Array<{
      type: string;
      uuid: string;
      version: [number, number, number];
    }>;
  };
  behaviorPack: {
    format_version: number;
    header: {
      name: string;
      description: string;
      uuid: string;
      version: [number, number, number];
      min_engine_version: [number, number, number];
    };
    modules: Array<{
      type: string;
      uuid: string;
      version: [number, number, number];
    }>;
    dependencies: Array<{
      uuid: string;
      version: [number, number, number];
    }>;
  };
}

export class BedrockManifestBuilder {
  /**
   * Generates paired, interconnected Resource Pack and Behavior Pack manifests.
   */
  static buildPairedManifests(options: BedrockManifestOptions): BedrockPackManifests {
    const version: [number, number, number] = options.version ?? [1, 0, 0];
    const minEngineVersion: [number, number, number] = options.minEngineVersion ?? [1, 20, 0];
    const desc = options.description ?? `Custom Bedrock Add-on for ${options.name}`;

    const rpHeaderUuid = uuidv4();
    const rpModuleUuid = uuidv4();

    const bpHeaderUuid = uuidv4();
    const bpModuleUuid = uuidv4();

    const resourcePack = {
      format_version: 2,
      header: {
        name: `${options.name} Resource Pack`,
        description: desc,
        uuid: rpHeaderUuid,
        version,
        min_engine_version: minEngineVersion,
      },
      modules: [
        {
          type: 'resources',
          uuid: rpModuleUuid,
          version,
        },
      ],
    };

    const behaviorPack = {
      format_version: 2,
      header: {
        name: `${options.name} Behavior Pack`,
        description: desc,
        uuid: bpHeaderUuid,
        version,
        min_engine_version: minEngineVersion,
      },
      modules: [
        {
          type: 'data',
          uuid: bpModuleUuid,
          version,
        },
      ],
      dependencies: [
        {
          uuid: rpHeaderUuid, // Explicit link to resource pack
          version,
        },
      ],
    };

    return { resourcePack, behaviorPack };
  }
}
