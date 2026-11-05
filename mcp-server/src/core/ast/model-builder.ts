import { v4 as uuidv4 } from 'uuid';
import {
  BBModel,
  BBModelSchema,
  Element,
  Group,
  OutlinerNode,
  Vector3,
  Meta,
  Resolution,
} from '../types/bbmodel.types.js';
import { BedrockGeometryFile, BedrockBone, BedrockCube } from '../types/bedrock.types.js';
import { CubeManager, CreateCubeOptions } from './cube-manager.js';
import { GroupManager, CreateGroupOptions } from './group-manager.js';
import { Math3D } from '../utils/math3d.js';
import { FaceCuller, CullingResult } from '../optimizer/face-culler.js';
import { BedrockValidator, ValidationReport } from '../validation/bedrock-rules.js';

export interface CreateModelOptions {
  name: string;
  format?: 'bedrock' | 'modded_entity' | 'java_block' | 'generic_model';
  resolution?: { width: number; height: number };
  box_uv?: boolean;
}

export interface TransformElementOptions {
  translation?: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
  origin?: Vector3;
}

export class ModelBuilder {
  private model: BBModel;

  constructor(model?: BBModel) {
    if (model) {
      this.model = BBModelSchema.parse(model);
    } else {
      this.model = {
        meta: {
          format_version: '4.10',
          creation_time: Math.floor(Date.now() / 1000),
          model_format: 'bedrock',
          box_uv: false,
        },
        name: 'new_model',
        resolution: { width: 64, height: 64 },
        elements: [],
        outliner: [],
        textures: [],
        animations: [],
      };
    }
  }

  /**
   * Initializes a brand new ModelBuilder instance.
   */
  static create(options: CreateModelOptions): ModelBuilder {
    const builder = new ModelBuilder();
    builder.model.name = options.name;
    builder.model.meta.model_format = options.format ?? 'bedrock';
    builder.model.meta.box_uv = options.box_uv ?? false;
    if (options.resolution) {
      builder.model.resolution = options.resolution;
    }
    return builder;
  }

  /**
   * Parses an existing .bbmodel JSON string into a ModelBuilder.
   */
  static fromJSON(jsonStr: string): ModelBuilder {
    const parsed = JSON.parse(jsonStr);
    const validated = BBModelSchema.parse(parsed);
    return new ModelBuilder(validated);
  }

  /**
   * Returns the underlying BBModel object.
   */
  getModel(): BBModel {
    return this.model;
  }

  /**
   * Serializes the model into a standard .bbmodel JSON string.
   */
  toJSON(pretty = true): string {
    return pretty ? JSON.stringify(this.model, null, 2) : JSON.stringify(this.model);
  }

  /**
   * Adds a new bone (group) to the model.
   * If parentGroup is specified (by UUID or name), nests it inside; otherwise adds to root outliner.
   */
  addBone(options: CreateGroupOptions, parentGroupIdentifier?: string): Group {
    const group = GroupManager.createGroup(options);

    if (parentGroupIdentifier) {
      const parent =
        GroupManager.findGroupByUUID(this.model.outliner, parentGroupIdentifier) ||
        GroupManager.findGroupByName(this.model.outliner, parentGroupIdentifier);

      if (parent) {
        parent.children.push(group);
        return group;
      }
    }

    this.model.outliner.push(group);
    return group;
  }

  /**
   * Adds a new cube element to the model and automatically attaches it to a bone or root outliner.
   */
  addCube(options: CreateCubeOptions, parentGroupIdentifier?: string): Element {
    const cube = CubeManager.createCube(options);
    this.model.elements.push(cube);

    if (parentGroupIdentifier) {
      const parent =
        GroupManager.findGroupByUUID(this.model.outliner, parentGroupIdentifier) ||
        GroupManager.findGroupByName(this.model.outliner, parentGroupIdentifier);

      if (parent) {
        parent.children.push(cube.uuid);
        return cube;
      }
    }

    // Default to root outliner
    this.model.outliner.push(cube.uuid);
    return cube;
  }

  /**
   * Finds an element by UUID or Name.
   */
  findCube(identifier: string): Element | null {
    return (
      this.model.elements.find(
        (el) => el.uuid === identifier || el.name.toLowerCase() === identifier.toLowerCase()
      ) || null
    );
  }

  /**
   * Finds a bone (group) by UUID or Name.
   */
  findBone(identifier: string): Group | null {
    return (
      GroupManager.findGroupByUUID(this.model.outliner, identifier) ||
      GroupManager.findGroupByName(this.model.outliner, identifier)
    );
  }

  /**
   * Transforms a cube (translation, rotation, scale, origin shift).
   */
  transformElement(identifier: string, transform: TransformElementOptions): Element {
    const cube = this.findCube(identifier);
    if (!cube) {
      throw new Error(`Element "${identifier}" not found in model.`);
    }

    if (transform.translation) {
      const [tx, ty, tz] = transform.translation;
      cube.from = [cube.from[0] + tx, cube.from[1] + ty, cube.from[2] + tz];
      cube.to = [cube.to[0] + tx, cube.to[1] + ty, cube.to[2] + tz];
      cube.origin = [cube.origin[0] + tx, cube.origin[1] + ty, cube.origin[2] + tz];
    }

    if (transform.rotation) {
      cube.rotation = transform.rotation;
    }

    if (transform.origin) {
      cube.origin = transform.origin;
    }

    if (transform.scale) {
      const [sx, sy, sz] = transform.scale;
      const center = cube.origin;
      cube.from = [
        center[0] + (cube.from[0] - center[0]) * sx,
        center[1] + (cube.from[1] - center[1]) * sy,
        center[2] + (cube.from[2] - center[2]) * sz,
      ];
      cube.to = [
        center[0] + (cube.to[0] - center[0]) * sx,
        center[1] + (cube.to[1] - center[1]) * sy,
        center[2] + (cube.to[2] - center[2]) * sz,
      ];
    }

    return cube;
  }

  /**
   * Mirrors a cube along X, Y, or Z axis and attaches it to the model.
   */
  mirrorCube(identifier: string, axis: 'x' | 'y' | 'z', pivot: Vector3 = [0, 0, 0], newName?: string): Element {
    const original = this.findCube(identifier);
    if (!original) {
      throw new Error(`Element "${identifier}" not found to mirror.`);
    }

    const mirrored = CubeManager.mirrorCube(original, axis, pivot, newName);
    this.model.elements.push(mirrored);
    this.model.outliner.push(mirrored.uuid);
    return mirrored;
  }

  /**
   * Reparents a cube or bone into a target bone.
   */
  reparent(childIdentifier: string, targetParentGroupIdentifier: string): boolean {
    const childCube = this.findCube(childIdentifier);
    const childBone = this.findBone(childIdentifier);
    const targetParent = this.findBone(targetParentGroupIdentifier);

    if (!targetParent) {
      throw new Error(`Target parent group "${targetParentGroupIdentifier}" not found.`);
    }

    const childId = childCube ? childCube.uuid : childBone ? childBone.uuid : null;
    if (!childId) {
      throw new Error(`Child identifier "${childIdentifier}" not found.`);
    }

    // Remove from current position
    GroupManager.removeNode(this.model.outliner, childId);

    // If it's a bone, insert the full group object, otherwise insert the cube UUID string
    if (childBone) {
      targetParent.children.push(childBone);
    } else {
      targetParent.children.push(childId);
    }

    return true;
  }

  /**
   * Optimizes the model by culling occluded and internal touching faces.
   */
  cullHiddenFaces(): CullingResult {
    return FaceCuller.cullHiddenFaces(this.model.elements);
  }

  /**
   * Validates the model against Minecraft Bedrock rules.
   */
  validate(): ValidationReport {
    return BedrockValidator.validate(this.model);
  }

  /**
   * Automatically resolves issues (zero volume, fractional UVs, multi-axis rotations).
   */
  autoFix(): { fixedIssuesCount: number; fixesApplied: string[] } {
    return BedrockValidator.autoFix(this.model);
  }

  /**
   * Exports directly to a Bedrock Geometry object (1.12.0 format).
   */
  toBedrockGeometry(identifier?: string): BedrockGeometryFile {
    const geomId = identifier ?? `geometry.${this.model.name}`;
    const bones: BedrockBone[] = [];

    // Helper map to quickly find elements by UUID
    const elementMap = new Map<string, Element>();
    for (const el of this.model.elements) {
      elementMap.set(el.uuid, el);
    }

    // Recursive helper to traverse outliner and construct Bedrock bones
    const traverse = (node: OutlinerNode, parentName?: string) => {
      if (typeof node === 'string') {
        // Root orphan cube
        const el = elementMap.get(node);
        if (!el) return;

        // In Bedrock, all cubes must live inside a bone. Create or attach to "root"
        let rootBone = bones.find((b) => b.name === 'root');
        if (!rootBone) {
          rootBone = {
            name: 'root',
            pivot: [0, 0, 0],
            cubes: [],
          };
          bones.push(rootBone);
        }

        const [w, h, d] = Math3D.getSize(el.from, el.to);
        rootBone.cubes.push({
          origin: el.from,
          size: [w, h, d],
          pivot: el.origin,
          rotation: el.rotation,
          uv: [0, 0], // Box UV
        });
      } else {
        // Group (Bone)
        const bone: BedrockBone = {
          name: node.name,
          pivot: node.origin,
          rotation: node.rotation,
          parent: parentName,
          cubes: [],
        };

        for (const child of node.children) {
          if (typeof child === 'string') {
            const el = elementMap.get(child);
            if (el) {
              const [w, h, d] = Math3D.getSize(el.from, el.to);
              const cubeDef: BedrockCube = {
                origin: el.from,
                size: [w, h, d],
                pivot: el.origin,
                rotation: el.rotation,
                uv: [0, 0],
              };
              bone.cubes.push(cubeDef);
            }
          } else {
            // Nested child bone
            traverse(child, node.name);
          }
        }

        bones.push(bone);
      }
    };

    for (const node of this.model.outliner) {
      traverse(node);
    }

    return {
      format_version: '1.12.0',
      'minecraft:geometry': [
        {
          description: {
            identifier: geomId,
            texture_width: this.model.resolution.width,
            texture_height: this.model.resolution.height,
          },
          bones,
        },
      ],
    };
  }
}
