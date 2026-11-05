import { v4 as uuidv4 } from 'uuid';
import { Group, OutlinerNode, Vector3, Element } from '../types/bbmodel.types.js';
import { Math3D } from '../utils/math3d.js';

export interface CreateGroupOptions {
  name: string;
  origin?: Vector3;
  rotation?: Vector3;
  color?: number;
  mirror_uv?: boolean;
  children?: OutlinerNode[];
}

export class GroupManager {
  /**
   * Creates a new Group (Bone) node.
   */
  static createGroup(options: CreateGroupOptions): Group {
    return {
      name: options.name,
      uuid: uuidv4(),
      origin: options.origin ?? [0, 0, 0],
      rotation: options.rotation,
      color: options.color,
      mirror_uv: options.mirror_uv ?? false,
      isOpen: true,
      children: options.children ?? [],
    };
  }

  /**
   * Recursively finds a group by UUID or Name in the outliner tree.
   */
  static findGroup(
    outliner: OutlinerNode[],
    predicate: (group: Group) => boolean
  ): Group | null {
    for (const node of outliner) {
      if (typeof node !== 'string') {
        if (predicate(node)) {
          return node;
        }
        const found = this.findGroup(node.children, predicate);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Finds a group by its UUID.
   */
  static findGroupByUUID(outliner: OutlinerNode[], uuid: string): Group | null {
    return this.findGroup(outliner, (g) => g.uuid === uuid);
  }

  /**
   * Finds a group by its name.
   */
  static findGroupByName(outliner: OutlinerNode[], name: string): Group | null {
    return this.findGroup(outliner, (g) => g.name.toLowerCase() === name.toLowerCase());
  }

  /**
   * Recursively collects all Cube UUIDs belonging to a group and its sub-groups.
   */
  static getAllChildCubeUUIDs(group: Group): string[] {
    const cubeUuids: string[] = [];
    for (const child of group.children) {
      if (typeof child === 'string') {
        cubeUuids.push(child);
      } else {
        cubeUuids.push(...this.getAllChildCubeUUIDs(child));
      }
    }
    return cubeUuids;
  }

  /**
   * Computes the joint origin (pivot) for a group based on its contained cubes.
   * Pivot mode:
   * - 'center': Center of all cubes
   * - 'bottom': Center X/Z, lowest Y (standard for leg/body joints)
   * - 'top': Center X/Z, highest Y (standard for hanging limbs)
   */
  static computeOptimalPivot(
    cubes: Element[],
    mode: 'center' | 'bottom' | 'top' = 'bottom'
  ): Vector3 {
    if (cubes.length === 0) return [0, 0, 0];

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const cube of cubes) {
      minX = Math.min(minX, cube.from[0], cube.to[0]);
      minY = Math.min(minY, cube.from[1], cube.to[1]);
      minZ = Math.min(minZ, cube.from[2], cube.to[2]);

      maxX = Math.max(maxX, cube.from[0], cube.to[0]);
      maxY = Math.max(maxY, cube.from[1], cube.to[1]);
      maxZ = Math.max(maxZ, cube.from[2], cube.to[2]);
    }

    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    switch (mode) {
      case 'center':
        return [centerX, (minY + maxY) / 2, centerZ];
      case 'bottom':
        return [centerX, minY, centerZ];
      case 'top':
        return [centerX, maxY, centerZ];
    }
  }

  /**
   * Removes a node (cube UUID or group) from anywhere in the outliner tree.
   */
  static removeNode(outliner: OutlinerNode[], targetId: string): boolean {
    for (let i = 0; i < outliner.length; i++) {
      const node = outliner[i];
      if (typeof node === 'string' && node === targetId) {
        outliner.splice(i, 1);
        return true;
      } else if (typeof node !== 'string') {
        if (node.uuid === targetId) {
          outliner.splice(i, 1);
          return true;
        }
        if (this.removeNode(node.children, targetId)) {
          return true;
        }
      }
    }
    return false;
  }
}
