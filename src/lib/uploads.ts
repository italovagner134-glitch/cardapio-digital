/**
 * Validação de upload compartilhada — imagem de produto/logo/capa e (Fase
 * futura) vídeo de capa. Duas camadas, porque nenhuma sozinha é confiável:
 *
 * 1. Tamanho: bloqueia arquivo grande demais antes de gastar tempo/banda
 *    de verdade no Storage.
 * 2. Tipo real (assinatura binária/"magic bytes"), não só `file.type` — o
 *    Content-Type que o navegador manda é o que o próprio remetente
 *    declarou, então um arquivo malicioso renomeado pra .jpg com
 *    `file.type` forjado passaria batido numa checagem só de MIME.
 *
 * O limite de tamanho do REQUEST inteiro (antes até de chegar aqui) vem de
 * `experimental.serverActions.bodySizeLimit` em next.config.ts.
 */

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5MB
// Mesmo limite documentado em StoreCover.tsx pro vídeo de capa (10MB/12s) —
// duração não dá pra checar aqui sem decodificar o vídeo; tamanho é o
// guarda-corpo do servidor, a duração fica pro dono respeitar na hora de
// gravar.
export const VIDEO_MAX_BYTES = 10 * 1024 * 1024; // 10MB

export type UploadKind = "image" | "video";

interface Signature {
  mimeType: string;
  extensions: string[];
  /** Bytes esperados a partir de `offset`; `null` = qualquer byte (curinga). */
  magic: (number | null)[];
  offset?: number;
}

const IMAGE_SIGNATURES: Signature[] = [
  { mimeType: "image/jpeg", extensions: ["jpg", "jpeg"], magic: [0xff, 0xd8, 0xff] },
  { mimeType: "image/png", extensions: ["png"], magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  {
    mimeType: "image/webp",
    extensions: ["webp"],
    magic: [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50],
  },
  { mimeType: "image/gif", extensions: ["gif"], magic: [0x47, 0x49, 0x46, 0x38] },
];

const VIDEO_SIGNATURES: Signature[] = [
  // MP4/MOV (ISO base media): tamanho da box (4 bytes, qualquer valor) +
  // "ftyp" no offset 4 — cobre H.264/AAC (mp4) e QuickTime (mov).
  { mimeType: "video/mp4", extensions: ["mp4", "m4v"], magic: [0x66, 0x74, 0x79, 0x70], offset: 4 },
  { mimeType: "video/quicktime", extensions: ["mov"], magic: [0x66, 0x74, 0x79, 0x70], offset: 4 },
  // WebM/Matroska: cabeçalho EBML.
  { mimeType: "video/webm", extensions: ["webm"], magic: [0x1a, 0x45, 0xdf, 0xa3] },
];

function matchesSignature(bytes: Uint8Array, sig: Signature): boolean {
  const offset = sig.offset ?? 0;
  if (bytes.length < offset + sig.magic.length) return false;
  return sig.magic.every((expected, i) => expected === null || bytes[offset + i] === expected);
}

export interface UploadValidation {
  ok: boolean;
  error?: string;
  /** Extensão de arquivo certa pro tipo REAL detectado (nunca a extensão
   * que veio no nome original — evita salvar um .png que na verdade é
   * .webp, por exemplo, por causa do nome do arquivo mentir). */
  extension?: string;
}

/** Lê só os primeiros bytes — nunca o arquivo inteiro — suficiente pra
 * conferir a assinatura de qualquer formato desta lista. */
async function readHeader(file: File, length = 16): Promise<Uint8Array> {
  const slice = file.slice(0, length);
  return new Uint8Array(await slice.arrayBuffer());
}

export async function validateUpload(file: File, kind: UploadKind): Promise<UploadValidation> {
  const maxBytes = kind === "image" ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES;
  const maxLabel = kind === "image" ? "5MB" : "10MB";

  if (file.size === 0) {
    return { ok: false, error: "Arquivo vazio." };
  }
  if (file.size > maxBytes) {
    return { ok: false, error: `Arquivo maior que o limite de ${maxLabel}.` };
  }

  const signatures = kind === "image" ? IMAGE_SIGNATURES : VIDEO_SIGNATURES;
  const header = await readHeader(file);
  const match = signatures.find((sig) => matchesSignature(header, sig));

  if (!match) {
    const allowed = kind === "image" ? "JPEG, PNG, WebP ou GIF" : "MP4, MOV ou WebM";
    return { ok: false, error: `Formato não reconhecido. Envie um arquivo ${allowed} de verdade.` };
  }

  return { ok: true, extension: match.extensions[0] };
}
