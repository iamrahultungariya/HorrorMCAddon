import { z } from 'zod';

export const Vector3Schema = z.tuple([z.number(), z.number(), z.number()]);
export type Vector3 = z.infer<typeof Vector3Schema>;

export const Vector2Schema = z.tuple([z.number(), z.number()]);
export type Vector2 = z.infer<typeof Vector2Schema>;

export const UV4Schema = z.tuple([z.number(), z.number(), z.number(), z.number()]);
export type UV4 = z.infer<typeof UV4Schema>;

export const FaceDirectionSchema = z.enum(['north', 'south', 'east', 'west', 'up', 'down']);
export type FaceDirection = z.infer<typeof FaceDirectionSchema>;

export const FaceSchema = z.object({
  uv: UV4Schema,
  texture: z.union([z.number(), z.string(), z.null()]).optional(),
  cullface: FaceDirectionSchema.optional(),
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]).optional(),
  tintindex: z.number().optional(),
  enabled: z.boolean().optional(),
});
export type Face = z.infer<typeof FaceSchema>;

export const FacesRecordSchema = z.object({
  north: FaceSchema.optional(),
  south: FaceSchema.optional(),
  east: FaceSchema.optional(),
  west: FaceSchema.optional(),
  up: FaceSchema.optional(),
  down: FaceSchema.optional(),
});
export type FacesRecord = z.infer<typeof FacesRecordSchema>;

export const ElementSchema = z.object({
  name: z.string().default('cube'),
  box_uv: z.boolean().optional(),
  rescale: z.boolean().optional(),
  locked: z.boolean().optional(),
  from: Vector3Schema,
  to: Vector3Schema,
  autouv: z.number().optional(),
  color: z.number().optional(),
  origin: Vector3Schema.default([0, 0, 0]),
  faces: FacesRecordSchema,
  type: z.literal('cube').default('cube'),
  uuid: z.string(),
  rotation: Vector3Schema.optional(),
  inflate: z.number().optional(),
  visibility: z.boolean().optional(),
});
export type Element = z.infer<typeof ElementSchema>;

// Outliner can be nested recursively
export type OutlinerNode = string | Group;

export interface Group {
  name: string;
  origin: Vector3;
  rotation?: Vector3;
  color?: number;
  uuid: string;
  export?: boolean;
  isOpen?: boolean;
  locked?: boolean;
  visibility?: boolean;
  autouv?: number;
  mirror_uv?: boolean;
  children: OutlinerNode[];
}

export const GroupSchema: z.ZodType<Group, z.ZodTypeDef, any> = z.lazy(() =>
  z.object({
    name: z.string().default('bone'),
    origin: Vector3Schema.default([0, 0, 0]),
    rotation: Vector3Schema.optional(),
    color: z.number().optional(),
    uuid: z.string(),
    export: z.boolean().optional(),
    isOpen: z.boolean().optional(),
    locked: z.boolean().optional(),
    visibility: z.boolean().optional(),
    autouv: z.number().optional(),
    mirror_uv: z.boolean().optional(),
    children: z.array(z.union([z.string(), GroupSchema])).default([]),
  })
);

export const TextureSchema = z.object({
  path: z.string().optional(),
  name: z.string(),
  folder: z.string().default('entity'),
  namespace: z.string().optional(),
  id: z.string().optional(),
  particle: z.boolean().optional(),
  render_mode: z.string().optional(),
  visible: z.boolean().optional(),
  mode: z.string().optional(),
  saved: z.boolean().optional(),
  uuid: z.string(),
  source: z.string(), // data:image/png;base64,...
  relative_path: z.string().optional(),
  width: z.number().default(16),
  height: z.number().default(16),
  uv_width: z.number().optional(),
  uv_height: z.number().optional(),
});
export type Texture = z.infer<typeof TextureSchema>;

export const KeyframeSchema = z.object({
  channel: z.enum(['rotation', 'position', 'scale']),
  data_points: z.array(z.record(z.any())),
  time: z.number(),
  color: z.number().optional(),
  interpolation: z.enum(['linear', 'catmullrom', 'bezier', 'step']).default('linear'),
  uuid: z.string(),
});
export type Keyframe = z.infer<typeof KeyframeSchema>;

export const AnimatorSchema = z.object({
  name: z.string(),
  type: z.literal('bone').default('bone'),
  keyframes: z.array(KeyframeSchema).default([]),
});
export type Animator = z.infer<typeof AnimatorSchema>;

export const AnimationSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  loop: z.enum(['once', 'hold', 'loop']).default('loop'),
  override: z.boolean().optional(),
  anim_time_update: z.string().optional(),
  blend_weight: z.string().optional(),
  length: z.number().default(1),
  snapping: z.number().default(24),
  animators: z.record(AnimatorSchema).default({}),
});
export type Animation = z.infer<typeof AnimationSchema>;

export const MetaSchema = z.object({
  format_version: z.string().default('4.10'),
  creation_time: z.number().optional(),
  model_format: z.enum(['bedrock', 'modded_entity', 'java_block', 'generic_model']).default('bedrock'),
  box_uv: z.boolean().default(false),
});
export type Meta = z.infer<typeof MetaSchema>;

export const ResolutionSchema = z.object({
  width: z.number().default(64),
  height: z.number().default(64),
});
export type Resolution = z.infer<typeof ResolutionSchema>;

export const DisplaySlotSchema = z.object({
  rotation: Vector3Schema.default([0, 0, 0]),
  translation: Vector3Schema.default([0, 0, 0]),
  scale: Vector3Schema.default([1, 1, 1]),
});
export type DisplaySlot = z.infer<typeof DisplaySlotSchema>;

export const DisplayRecordSchema = z.object({
  thirdperson_righthand: DisplaySlotSchema.optional(),
  thirdperson_lefthand: DisplaySlotSchema.optional(),
  firstperson_righthand: DisplaySlotSchema.optional(),
  firstperson_lefthand: DisplaySlotSchema.optional(),
  gui: DisplaySlotSchema.optional(),
  head: DisplaySlotSchema.optional(),
  ground: DisplaySlotSchema.optional(),
  fixed: DisplaySlotSchema.optional(),
});
export type DisplayRecord = z.infer<typeof DisplayRecordSchema>;

export const BBModelSchema = z.object({
  meta: MetaSchema,
  name: z.string().default('model'),
  geometry_name: z.string().optional(),
  resolution: ResolutionSchema.default({ width: 64, height: 64 }),
  elements: z.array(ElementSchema).default([]),
  outliner: z.array(z.union([z.string(), GroupSchema])).default([]),
  textures: z.array(TextureSchema).default([]),
  animations: z.array(AnimationSchema).default([]),
  display: DisplayRecordSchema.optional(),
});
export type BBModel = z.infer<typeof BBModelSchema>;
