import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://openapi.tripo3d.ai/v3";

const tripo = defineProvider({
  name: "Tripo3D",
  hosts: ["openapi.tripo3d.ai"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/account/balance`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ data: object({ balance: number(), frozen: number() }) }));
  },
});

type Account = { fields: { token: string } };

const auth = (account: Account) => ({ Authorization: `Bearer ${account.fields.token}` });

// Every field the docs list for these endpoints goes through; `options` carries newer or rarer ones.
const options = record(json()).optional();

const modelOutput = {
  texture: boolean().optional(),
  pbr: boolean().optional(),
  texture_seed: number().optional(),
  texture_quality: string().optional(),
  texture_version: string().optional(),
  delight: boolean().optional(),
  face_limit: number().optional(),
  geometry_quality: string().optional(),
  auto_size: boolean().optional(),
  quad: boolean().optional(),
  smart_low_poly: boolean().optional(),
  generate_parts: boolean().optional(),
  compress: string().optional(),
  export_orientation: string().optional(),
  export_uv: boolean().optional(),
  model_seed: number().optional(),
  options,
};

const modelNote =
  "Returns { code, data: { task_id } }; poll tasks.get until status is success, then read output.model_url. " +
  "`model` is a version string such as v3.1-20260211 or v3.0-20250812 (H series), or P1-20260311 / P2-20260801 (P series, low-poly). " +
  "texture_quality, geometry_quality, auto_size, quad, smart_low_poly, generate_parts and compress need model v3.0 or newer. generate_parts requires texture=false and pbr=false. " +
  "Unset optional fields use the server defaults; `options` is merged into the request body for fields not listed here.";

const tripoTools = (account: Account, signal: AbortSignal) => {
  const headers = auth(account);
  const get = async (fetch: typeof globalThis.fetch, path: string) =>
    decodeJson(await fetch(`${base}${path}`, { signal, headers }), json());
  const post = async (fetch: typeof globalThis.fetch, path: string, body: Record<string, unknown>) => {
    const { options: extra, ...rest } = body;
    return decodeJson(
      await fetch(`${base}${path}`, {
        method: "POST",
        signal,
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ ...(extra as object | undefined), ...rest }),
      }),
      json(),
    );
  };

  return router({
    account: router(
      {
        balance: query(
          {
            description: "Get the credit balance: balance is available credits, frozen is credits reserved for in-progress tasks.",
            input: object({}),
          },
          ({ fetch }) => get(fetch, "/account/balance"),
        ),
        usage: query(
          {
            description: "List per-task credit consumption history: task_id, type, credits_consumed, created_at.",
            input: object({}),
          },
          ({ fetch }) => get(fetch, "/account/usage"),
        ),
      },
      { title: "Account", description: "Credit balance and usage." },
    ),
    tasks: router(
      {
        get: query(
          {
            description:
              "Get one task by task_id: type, status (queued, running, success, failed, cancelled), progress 0-100, error_code and error_message on failure, credits_consumed and, on success, output (model_url, rendered_image_url, and other task-specific URLs).",
            input: object({ task_id: string() }),
          },
          ({ fetch }, { task_id }) => get(fetch, `/tasks/${encodeURIComponent(task_id)}`),
        ),
      },
      { title: "Tasks", description: "Poll asynchronous generation and processing tasks." },
    ),
    files: router(
      {
        upload: mutation(
          {
            description:
              "Upload a file and get a file_token to pass as `input` to other tools. Content is base64. Images: JPEG or PNG up to 20 MB. Models: GLB, GLTF, FBX, OBJ or STL up to 150 MB (very large files are better sent by public URL as `input` instead).",
            input: object({
              filename: string(),
              contentBase64: string(),
              mimeType: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { filename, contentBase64, mimeType }) => {
            const bytes = Uint8Array.from(atob(contentBase64), (c) => c.charCodeAt(0));
            const form = new FormData();
            form.set("file", new Blob([bytes], mimeType === undefined ? undefined : { type: mimeType }), filename);
            return decodeJson(await fetch(`${base}/files`, { method: "POST", signal, headers, body: form }), json());
          },
        ),
      },
      { title: "Files", description: "Upload images and models for use as task inputs." },
    ),
    generation: router(
      {
        textToModel: mutation(
          {
            description: `Generate a 3D model from a text prompt (prompt up to 1024 chars, negative_prompt up to 255). ${modelNote}`,
            input: object({
              prompt: string(),
              model: string(),
              negative_prompt: string().optional(),
              image_seed: number().optional(),
              ...modelOutput,
            }),
            approval: always(),
          },
          ({ fetch }, input) => post(fetch, "/generation/text-to-model", input),
        ),
        imageToModel: mutation(
          {
            description: `Generate a 3D model from one image. input is exactly one of: a file_token from files.upload, a public image URL, or the task_id of a text_to_image / image_to_image task. ${modelNote}`,
            input: object({
              input: string(),
              model: string(),
              enable_image_autofix: boolean().optional(),
              texture_alignment: string().optional(),
              orientation: string().optional(),
              ...modelOutput,
            }),
            approval: always(),
          },
          ({ fetch }, input) => post(fetch, "/generation/image-to-model", input),
        ),
        multiviewToModel: mutation(
          {
            description: `Generate a 3D model from multiview images. inputs is an array of objects with exactly one key each among front, left, back, right (value a URL or file_token), e.g. [{"front":"file_abc"},{"left":"https://..."}]; the front view is required and at least 2 views are needed. It can also be [{"task_id":"..."}] to reuse an image-to-multiview or edit-multiview task. ${modelNote}`,
            input: object({
              inputs: array(json()),
              model: string(),
              texture_alignment: string().optional(),
              orientation: string().optional(),
              ...modelOutput,
            }),
            approval: always(),
          },
          ({ fetch }, input) => post(fetch, "/generation/multiview-to-model", input),
        ),
        textToImage: mutation(
          {
            description:
              "Generate an image from a text prompt. model: seedream_v5, seedream_v4 (default), banana, banana_pro, banana2, chat_image_2, chat_image_2.5_flare, chat_image_2.5_sunburst (chat_image_1 and 1.5 are being retired). size is model-specific: seedream models take 2K, 4K or WxH (default 2048x2048), banana models take fixed sizes, chat_image models take presets (see the vendor image-generation docs); aspect_ratio applies to banana models only; quality (low to max) applies to chat_image_2 and 2.5 models only; background (auto, opaque, transparent) to 2.5 models only. template: asset_extraction, character_completion, t_pose, variants or figure. Returns a task_id; the result image is in the task output.",
            input: object({
              prompt: string(),
              model: string().optional(),
              size: string().optional(),
              quality: string().optional(),
              background: string().optional(),
              aspect_ratio: string().optional(),
              output_format: string().optional(),
              watermark: boolean().optional(),
              template: string().optional(),
              options,
            }),
            approval: always(),
          },
          ({ fetch }, input) => post(fetch, "/generation/text-to-image", input),
        ),
        imageToImage: mutation(
          {
            description:
              "Edit or transform an image. input is a public URL, file_token or task_id; inputs adds extra reference images (up to 4 seedream, 10 banana, 16 chat_image). prompt is required unless a template is set (t_pose, character_completion, 3d_enhance, variants, figure). Model, size, quality, background, aspect_ratio and output_format behave as in textToImage (default model seedream_v5). Returns a task_id.",
            input: object({
              input: string(),
              inputs: array(string()).optional(),
              prompt: string().optional(),
              model: string().optional(),
              size: string().optional(),
              quality: string().optional(),
              background: string().optional(),
              aspect_ratio: string().optional(),
              output_format: string().optional(),
              template: string().optional(),
              options,
            }),
            approval: always(),
          },
          ({ fetch }, input) => post(fetch, "/generation/image-to-image", input),
        ),
        imageToMultiview: mutation(
          {
            description:
              "Generate multiview images (front, left, back, right) from one image. input is a file_token or public URL of an image with a clean background. Returns a task_id usable as multiviewToModel input.",
            input: object({ input: string(), options }),
            approval: always(),
          },
          ({ fetch }, input) => post(fetch, "/generation/image-to-multiview", input),
        ),
        editMultiview: mutation(
          {
            description:
              'Edit multiview images. input is the task_id of a multiview task, or a file_token or URL of a multiview image. prompts is an array of { prompt, view } where view is front, left, back or right, e.g. [{"prompt":"change the shirt color to red","view":"front"}].',
            input: object({ input: string(), prompts: array(json()), options }),
            approval: always(),
          },
          ({ fetch }, input) => post(fetch, "/generation/edit-multiview", input),
        ),
      },
      { title: "Generation", description: "Create 3D models and images. Each call starts an asynchronous task and costs credits." },
    ),
    models: router(
      {
        texture: mutation(
          {
            description:
              'Texture or re-texture a model. input is a task_id of a 3D generation task, a file_token or a model URL (GLB, GLTF, FBX, OBJ, STL up to 150 MB). model is the texture version (v3.5-20260815, v3.0-20250812 default, v2.5-20250123). texture_prompt guides the result with exactly one of { text } (optionally with style_image), { image } or { images } (4 images front, left, back, right). part_names limits texturing to segmented parts. texture_quality: fast (needs v3.5), standard, detailed, extreme. Returns a task_id.',
            input: object({
              input: string(),
              model: string().optional(),
              texture_prompt: record(json()).optional(),
              pbr: boolean().optional(),
              texture_seed: number().optional(),
              texture_alignment: string().optional(),
              texture_quality: string().optional(),
              part_names: array(string()).optional(),
              compress: string().optional(),
              bake: boolean().optional(),
              delight: boolean().optional(),
              options,
            }),
            approval: always(),
          },
          ({ fetch }, input) => post(fetch, "/models/texture", input),
        ),
        convert: mutation(
          {
            description:
              "Convert a model to another format. input is a task_id, file_token or model URL. format: GLTF, FBX, USDZ, OBJ, STL or 3MF. Optional: quad (forces FBX), force_symmetry (quad only), face_limit, flatten_bottom, flatten_bottom_threshold, texture_size (default 4096), texture_format (JPEG default, PNG, WEBP, ...), bake, pack_uv, export_vertex_colors, plus other fields via options. Orientation changes belong in this last step. Returns a task_id.",
            input: object({
              input: string(),
              format: string(),
              quad: boolean().optional(),
              force_symmetry: boolean().optional(),
              face_limit: number().optional(),
              flatten_bottom: boolean().optional(),
              flatten_bottom_threshold: number().optional(),
              texture_size: number().optional(),
              texture_format: string().optional(),
              bake: boolean().optional(),
              pack_uv: boolean().optional(),
              export_vertex_colors: boolean().optional(),
              options,
            }),
            approval: always(),
          },
          ({ fetch }, input) => post(fetch, "/models/convert", input),
        ),
        import: mutation(
          {
            description:
              "Import an external 3D model (GLB, GLTF, FBX, OBJ, STL up to 150 MB) as a Tripo task so it can be textured, rigged or converted by task_id. input is a file_token or URL. Returns a task_id.",
            input: object({ input: string(), options }),
            approval: always(),
          },
          ({ fetch }, input) => post(fetch, "/models/import", input),
        ),
      },
      { title: "Models", description: "Texture, convert and import 3D models." },
    ),
    animations: router(
      {
        rigCheck: mutation(
          {
            description:
              "Check whether a GLB model can be rigged and which rig type fits (biped, quadruped, hexapod, octopod, avian, serpentine, aquatic). input is a task_id, file_token or URL. Returns a task_id; the answer (riggable, rig_type) is in the task output.",
            input: object({ input: string(), options }),
            approval: always(),
          },
          ({ fetch }, input) => post(fetch, "/animations/rig-check", input),
        ),
        rig: mutation(
          {
            description:
              "Add a skeleton to a model. input is a task_id, file_token or URL. model: v1.0-20240301 (default, biped only) or v2.5-20260210 (non-humanoid creatures). rig_type defaults to biped; run rigCheck first. spec: tripo (default) or mixamo bone naming. out_format: glb (default) or fbx. Returns a task_id.",
            input: object({
              input: string(),
              model: string().optional(),
              rig_type: string().optional(),
              spec: string().optional(),
              out_format: string().optional(),
              options,
            }),
            approval: always(),
          },
          ({ fetch }, input) => post(fetch, "/animations/rig", input),
        ),
        retarget: mutation(
          {
            description:
              "Apply preset animations to a rigged model. input is the task_id of a rig task. Give exactly one of animation (e.g. preset:idle, preset:walk, preset:run, preset:jump, preset:slash, preset:quadruped:walk, or any of the 90+ preset:biped:* names for rig v1.0) or animations (array of them). out_format: glb or fbx. bake_animation (glb only, default true), export_with_geometry (default true), animate_in_place (default false). Returns a task_id.",
            input: object({
              input: string(),
              animation: string().optional(),
              animations: array(string()).optional(),
              out_format: string().optional(),
              bake_animation: boolean().optional(),
              export_with_geometry: boolean().optional(),
              animate_in_place: boolean().optional(),
              options,
            }),
            approval: always(),
          },
          ({ fetch }, input) => post(fetch, "/animations/retarget", input),
        ),
      },
      { title: "Animations", description: "Rig models and apply preset animations." },
    ),
    mesh: router(
      {
        segment: mutation(
          {
            description:
              "Split a model into semantic parts. input is a task_id, file_token or URL. model: v1.0-20250506 (geometry-based, default) or v2.0-20260430 (beta, semantic labels; supports segmentation_granularity simple, balanced or detailed, split_by_connectivity, and ref_image, which overrides those two). Returns a task_id.",
            input: object({
              input: string(),
              model: string().optional(),
              segmentation_granularity: string().optional(),
              split_by_connectivity: boolean().optional(),
              ref_image: string().optional(),
              options,
            }),
            approval: always(),
          },
          ({ fetch }, input) => post(fetch, "/mesh/segment", input),
        ),
        complete: mutation(
          {
            description:
              "Complete segmented parts. input is the task_id of a segment task. part_names limits which parts (default all). completion_mode: ai_completion (default) or quick_cap (fast hole fill). Returns a task_id.",
            input: object({
              input: string(),
              model: string().optional(),
              part_names: array(string()).optional(),
              completion_mode: string().optional(),
              options,
            }),
            approval: always(),
          },
          ({ fetch }, input) => post(fetch, "/mesh/complete", input),
        ),
        decimate: mutation(
          {
            description:
              "Retopologize a model to a lower polycount. input is a task_id, file_token or URL. face_limit is the target polycount. model is the retopology version (default v2.0; v3.0 supports smart_uv). quad outputs quads. bake (not on v1.0) bakes textures; part_names (not on v1.0) limits to segmented parts. Returns a task_id.",
            input: object({
              input: string(),
              model: string().optional(),
              face_limit: number().optional(),
              quad: boolean().optional(),
              smart_uv: boolean().optional(),
              bake: boolean().optional(),
              part_names: array(string()).optional(),
              options,
            }),
            approval: always(),
          },
          ({ fetch }, input) => post(fetch, "/mesh/decimate", input),
        ),
      },
      { title: "Mesh", description: "Segment, complete and retopologize meshes." },
    ),
  });
};

export default defineApp({ user: { accounts: { tripo: tripo.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.tripo ?? [], (account) => tripoTools(account, signal), { signal }), {
    title: "Tripo3D",
    description:
      "Generate and process 3D models with Tripo: text, image and multiview to 3D, image generation, texturing, format conversion, rigging, animation retargeting, segmentation, retopology, tasks and credits.",
    icons,
    instructions:
      "Generation and processing tools start asynchronous tasks and spend credits. Take the returned data.task_id and poll tasks.get until status is success (or failed), then use output.model_url. Pass a previous task's task_id as `input` to chain steps (generate, texture, rig, retarget, convert). Check account.balance first when cost matters.",
  }),
}));
