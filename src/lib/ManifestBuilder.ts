import protobuf from 'protobufjs';

// Mirror of proto/silent_blow/manifest.proto
const root = protobuf.Root.fromJSON({
  nested: {
    silent_blow: {
      nested: {
        ManifestEntry: {
          fields: {
            type: { type: 'string', id: 1 },
            name: { type: 'string', id: 2 },
            steps: { type: 'int32', id: 3 },
          },
        },
        Manifest: {
          fields: {
            entries: { rule: 'repeated', type: 'ManifestEntry', id: 1 },
          },
        },
        ManifestChunk: {
          fields: {
            seq: { type: 'int32', id: 1 },
            total: { type: 'int32', id: 2 },
            data: { type: 'bytes', id: 3 },
          },
        },
      },
    },
  },
});

const ManifestType = root.lookupType('silent_blow.Manifest');
const ManifestChunkType = root.lookupType('silent_blow.ManifestChunk');

export interface ManifestEntry {
  type: string;
  name: string;
  steps: number;
}

export interface ManifestData {
  entries: ManifestEntry[];
}

const MAX_CHUNK_SIZE = 1200;

export async function compressData(data: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();

  const chunks: Uint8Array[] = [];
  const reader = cs.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const total = chunks.reduce((s, c) => s + c.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/** Encode a manifest into a list of protobuf ManifestChunk byte arrays (for QR codes) */
export async function encodeManifest(manifest: ManifestData): Promise<Uint8Array[]> {
  const msg = ManifestType.create({ entries: manifest.entries });
  const serialized = ManifestType.encode(msg).finish();
  const compressed = await compressData(serialized);

  const totalChunks = Math.ceil(compressed.length / MAX_CHUNK_SIZE);
  const chunks: Uint8Array[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * MAX_CHUNK_SIZE;
    const end = Math.min(start + MAX_CHUNK_SIZE, compressed.length);
    const chunkData = compressed.slice(start, end);

    const chunk = ManifestChunkType.create({
      seq: i,
      total: totalChunks,
      data: chunkData,
    });
    chunks.push(ManifestChunkType.encode(chunk).finish());
  }

  return chunks;
}

/** Build manifest from file metadata */
export function buildManifest(files: { name: string; pageCount: number }[]): ManifestData {
  return {
    entries: files.map((f) => ({
      type: 'pdf',
      name: f.name,
      steps: f.pageCount,
    })),
  };
}
