import { describe, it, expect } from 'vitest';
import { BedrockManifestBuilder } from '../../src/core/bedrock/bedrock-manifest.js';

describe('BedrockManifestBuilder', () => {
  it('generates paired Resource Pack & Behavior Pack manifests with linked UUIDs', () => {
    const { resourcePack, behaviorPack } = BedrockManifestBuilder.buildPairedManifests({
      name: 'ruby_golem',
      description: 'Ruby Golem custom MCPE mob',
    });

    expect(resourcePack.format_version).toBe(2);
    expect(behaviorPack.format_version).toBe(2);

    expect(resourcePack.header.name).toBe('ruby_golem Resource Pack');
    expect(behaviorPack.header.name).toBe('ruby_golem Behavior Pack');

    // Both must have valid UUIDs
    expect(resourcePack.header.uuid).toMatch(/^[0-9a-f-]{36}$/);
    expect(behaviorPack.header.uuid).toMatch(/^[0-9a-f-]{36}$/);

    // Behavior pack must link directly to Resource pack header UUID
    expect(behaviorPack.dependencies.length).toBe(1);
    expect(behaviorPack.dependencies[0].uuid).toBe(resourcePack.header.uuid);
  });
});
