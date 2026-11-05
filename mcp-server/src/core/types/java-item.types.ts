import { z } from 'zod';
import { Vector3Schema, UV4Schema, FaceDirectionSchema, DisplayRecordSchema } from './bbmodel.types.js';

export const JavaElementRotationSchema = z.object({
  origin: Vector3Schema,
  axis: z.enum(['x', 'y', 'z']),
  angle: z.union([
    z.literal(-45),
    z.literal(-22.5),
    z.literal(0),
    z.literal(22.5),
    z.literal(45),
  ]),
  rescale: z.boolean().optional(),
});
export type JavaElementRotation = z.infer<typeof JavaElementRotationSchema>;

export const JavaFaceSchema = z.object({
  uv: UV4Schema.optional(),
  texture: z.string(), // e.g. "#0" or "#layer0"
  cullface: FaceDirectionSchema.optional(),
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]).optional(),
  tintindex: z.number().optional(),
});
export type JavaFace = z.infer<typeof JavaFaceSchema>;

export const JavaElementSchema = z.object({
  name: z.string().optional(),
  from: Vector3Schema,
  to: Vector3Schema,
  rotation: JavaElementRotationSchema.optional(),
  shade: z.boolean().optional(),
  faces: z.record(FaceDirectionSchema, JavaFaceSchema),
});
export type JavaElement = z.infer<typeof JavaElementSchema>;

export const JavaItemModelSchema = z.object({
  parent: z.string().optional(),
  ambientocclusion: z.boolean().optional(),
  textures: z.record(z.string()).default({}),
  elements: z.array(JavaElementSchema).default([]),
  display: DisplayRecordSchema.optional(),
  overrides: z.array(z.record(z.any())).optional(),
});
export type JavaItemModel = z.infer<typeof JavaItemModelSchema>;
