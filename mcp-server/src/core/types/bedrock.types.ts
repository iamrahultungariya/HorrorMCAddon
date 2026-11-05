import { z } from 'zod';
import { Vector3Schema, Vector2Schema } from './bbmodel.types.js';

export const BedrockCubeSchema = z.object({
  origin: Vector3Schema,
  size: Vector3Schema,
  rotation: Vector3Schema.optional(),
  pivot: Vector3Schema.optional(),
  inflate: z.number().optional(),
  mirror: z.boolean().optional(),
  uv: z.union([
    Vector2Schema, // Box UV offset [u, v]
    z.object({
      north: z.object({ uv: Vector2Schema, uv_size: Vector2Schema.optional() }).optional(),
      south: z.object({ uv: Vector2Schema, uv_size: Vector2Schema.optional() }).optional(),
      east: z.object({ uv: Vector2Schema, uv_size: Vector2Schema.optional() }).optional(),
      west: z.object({ uv: Vector2Schema, uv_size: Vector2Schema.optional() }).optional(),
      up: z.object({ uv: Vector2Schema, uv_size: Vector2Schema.optional() }).optional(),
      down: z.object({ uv: Vector2Schema, uv_size: Vector2Schema.optional() }).optional(),
    }), // Per-face UV
  ]),
});
export type BedrockCube = z.infer<typeof BedrockCubeSchema>;

export const BedrockBoneSchema = z.object({
  name: z.string(),
  parent: z.string().optional(),
  pivot: Vector3Schema.default([0, 0, 0]),
  rotation: Vector3Schema.optional(),
  binding: z.string().optional(),
  mirror: z.boolean().optional(),
  inflate: z.number().optional(),
  locators: z.record(Vector3Schema).optional(),
  cubes: z.array(BedrockCubeSchema).default([]),
});
export type BedrockBone = z.infer<typeof BedrockBoneSchema>;

export const BedrockDescriptionSchema = z.object({
  identifier: z.string(),
  texture_width: z.number().default(64),
  texture_height: z.number().default(64),
  visible_bounds_width: z.number().optional(),
  visible_bounds_height: z.number().optional(),
  visible_bounds_offset: Vector3Schema.optional(),
});
export type BedrockDescription = z.infer<typeof BedrockDescriptionSchema>;

export const BedrockGeometryEntrySchema = z.object({
  description: BedrockDescriptionSchema,
  bones: z.array(BedrockBoneSchema).default([]),
});
export type BedrockGeometryEntry = z.infer<typeof BedrockGeometryEntrySchema>;

export const BedrockGeometryFileSchema = z.object({
  format_version: z.enum(['1.12.0', '1.14.0', '1.16.0']).default('1.12.0'),
  'minecraft:geometry': z.array(BedrockGeometryEntrySchema).optional(),
  // Legacy format where geometry name is a root key (e.g. "geometry.model": {...})
}).catchall(z.any());
export type BedrockGeometryFile = z.infer<typeof BedrockGeometryFileSchema>;
