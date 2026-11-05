import { BBModel, Element, Group, OutlinerNode } from '../types/bbmodel.types.js';
import { Math3D } from '../utils/math3d.js';
import { GroupManager } from '../ast/group-manager.js';

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  elementUuid?: string;
  elementName?: string;
  autoFixable: boolean;
}

export interface ValidationReport {
  isValid: boolean;
  errorsCount: number;
  warningsCount: number;
  issues: ValidationIssue[];
}

export class BedrockValidator {
  /**
   * Checks if an integer is a power of 2 (16, 32, 64, 128, etc.).
   */
  static isPowerOfTwo(n: number): boolean {
    return n > 0 && (n & (n - 1)) === 0;
  }

  /**
   * Validates a BBModel against Bedrock Engine limits and best practices.
   */
  static validate(model: BBModel): ValidationReport {
    const issues: ValidationIssue[] = [];

    // 1. Resolution checks (Power of Two)
    const { width, height } = model.resolution;
    if (!this.isPowerOfTwo(width) || !this.isPowerOfTwo(height)) {
      issues.push({
        severity: 'warning',
        code: 'TEXTURE_NOT_POWER_OF_TWO',
        message: `Texture resolution (${width}x${height}) is not a power of two. May cause rendering artifacts on mobile GPUs.`,
        autoFixable: false,
      });
    }

    // 2. Element checks
    for (const el of model.elements) {
      const [w, h, d] = Math3D.getSize(el.from, el.to);

      // Zero volume check
      if (w <= 0 || h <= 0 || d <= 0) {
        issues.push({
          severity: 'error',
          code: 'ZERO_VOLUME_ELEMENT',
          message: `Cube "${el.name}" has zero volume (${w}x${h}x${d}). In Bedrock this causes invisible geometry or physics errors.`,
          elementUuid: el.uuid,
          elementName: el.name,
          autoFixable: true,
        });
      }

      // Bedrock multi-axis rotation limit check on individual cubes
      if (el.rotation) {
        const nonZeroAxes = el.rotation.filter((r) => Math.abs(r) > Math3D.EPSILON).length;
        if (nonZeroAxes > 1) {
          issues.push({
            severity: 'error',
            code: 'BEDROCK_MULTI_AXIS_CUBE_ROTATION',
            message: `Cube "${el.name}" rotates on ${nonZeroAxes} axes (${el.rotation.join(', ')}). In Minecraft Bedrock, individual cubes can only rotate on ONE axis. Multi-axis rotation must be applied to a parent bone.`,
            elementUuid: el.uuid,
            elementName: el.name,
            autoFixable: true,
          });
        }
      }

      // Non-integer UV check
      if (el.faces) {
        for (const [dir, face] of Object.entries(el.faces)) {
          if (!face || !face.uv) continue;
          const [u1, v1, u2, v2] = face.uv;
          if (
            !Number.isInteger(u1) ||
            !Number.isInteger(v1) ||
            !Number.isInteger(u2) ||
            !Number.isInteger(v2)
          ) {
            issues.push({
              severity: 'warning',
              code: 'NON_INTEGER_UV',
              message: `Cube "${el.name}" face "${dir}" uses fractional UVs (${face.uv.join(', ')}). May cause blurry seams or bleeding in MCPE.`,
              elementUuid: el.uuid,
              elementName: el.name,
              autoFixable: true,
            });
            break; // Report once per element
          }
        }
      }
    }

    // 3. Check for Z-fighting (identical coplanar overlapping faces)
    const elements = model.elements;
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const a = elements[i];
        const b = elements[j];

        // Check if both cubes have identical bounds
        if (
          Math3D.approxEqualsVector3(a.from, b.from) &&
          Math3D.approxEqualsVector3(a.to, b.to)
        ) {
          issues.push({
            severity: 'error',
            code: 'DUPLICATE_CUBE_Z_FIGHTING',
            message: `Cubes "${a.name}" and "${b.name}" share identical bounds. This will cause intense flickering (Z-fighting).`,
            elementUuid: a.uuid,
            elementName: a.name,
            autoFixable: true,
          });
        }
      }
    }

    const errorsCount = issues.filter((i) => i.severity === 'error').length;
    const warningsCount = issues.filter((i) => i.severity === 'warning').length;

    return {
      isValid: errorsCount === 0,
      errorsCount,
      warningsCount,
      issues,
    };
  }

  /**
   * Automatically resolves fixable issues in the model.
   * - Eliminates zero-volume elements
   * - Snaps fractional UVs to integers
   * - Moves multi-axis rotating cubes into isolated parent bones
   */
  static autoFix(model: BBModel): { fixedIssuesCount: number; fixesApplied: string[] } {
    let fixedIssuesCount = 0;
    const fixesApplied: string[] = [];

    // 1. Remove zero-volume cubes
    const initialCount = model.elements.length;
    model.elements = model.elements.filter((el) => {
      const [w, h, d] = Math3D.getSize(el.from, el.to);
      const isZero = w <= 0 || h <= 0 || d <= 0;
      if (isZero) {
        // Also remove from outliner
        GroupManager.removeNode(model.outliner, el.uuid);
      }
      return !isZero;
    });
    const removedZeroVolume = initialCount - model.elements.length;
    if (removedZeroVolume > 0) {
      fixedIssuesCount += removedZeroVolume;
      fixesApplied.push(`Removed ${removedZeroVolume} zero-volume element(s)`);
    }

    // 2. Snap fractional UVs
    let uvSnappedCount = 0;
    for (const el of model.elements) {
      if (!el.faces) continue;
      for (const face of Object.values(el.faces)) {
        if (!face || !face.uv) continue;
        const snapped = Math3D.snapUV(face.uv, 1);
        if (
          face.uv[0] !== snapped[0] ||
          face.uv[1] !== snapped[1] ||
          face.uv[2] !== snapped[2] ||
          face.uv[3] !== snapped[3]
        ) {
          face.uv = snapped;
          uvSnappedCount++;
        }
      }
    }
    if (uvSnappedCount > 0) {
      fixedIssuesCount += uvSnappedCount;
      fixesApplied.push(`Snapped ${uvSnappedCount} fractional UV coordinate(s) to exact integers`);
    }

    // 3. Fix multi-axis rotation on cubes by wrapping into dedicated parent bone
    let wrappedBonesCount = 0;
    for (const el of model.elements) {
      if (el.rotation) {
        const nonZeroAxes = el.rotation.filter((r) => Math.abs(r) > Math3D.EPSILON).length;
        if (nonZeroAxes > 1) {
          // Transfer rotation to a new bone
          const rotation = [...el.rotation] as [number, number, number];
          const origin = [...el.origin] as [number, number, number];
          el.rotation = undefined; // clear cube rotation

          const newBone = GroupManager.createGroup({
            name: `${el.name}_pivot`,
            origin,
            rotation,
            children: [el.uuid],
          });

          // Remove element from existing outliner position
          GroupManager.removeNode(model.outliner, el.uuid);
          // Insert new bone
          model.outliner.push(newBone);

          wrappedBonesCount++;
        }
      }
    }
    if (wrappedBonesCount > 0) {
      fixedIssuesCount += wrappedBonesCount;
      fixesApplied.push(`Isolated ${wrappedBonesCount} multi-axis cube(s) into dedicated parent bones for Bedrock engine compliance`);
    }

    return {
      fixedIssuesCount,
      fixesApplied,
    };
  }
}
