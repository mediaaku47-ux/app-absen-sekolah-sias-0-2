import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET_NAME = process.env.NEON_BUCKET_NAME || 'assets';
const REGION = process.env.AWS_REGION || 'ap-southeast-1';
const ENDPOINT = process.env.AWS_ENDPOINT_URL_S3;

const isStorageAvailable = Boolean(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  ENDPOINT
);

let s3Client: S3Client | null = null;
if (isStorageAvailable) {
  s3Client = new S3Client({
    region: REGION,
    endpoint: ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

export const neonStorage = {
  isConfigured(): boolean {
    return isStorageAvailable && s3Client !== null;
  },

  getBucketName(): string {
    return BUCKET_NAME;
  },

  async upload(key: string, data: Buffer | string, contentType = 'application/octet-stream') {
    if (!s3Client) {
      console.log(`[Neon Object Storage] Simulated upload for key: ${key}`);
      return { success: true, key, url: `/api/storage/files/${encodeURIComponent(key)}`, simulated: true };
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: Buffer.isBuffer(data) ? data : Buffer.from(data),
      ContentType: contentType,
    });

    await s3Client.send(command);
    return { success: true, key, simulated: false };
  },

  async getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    if (!s3Client) {
      return `/api/storage/files/${encodeURIComponent(key)}`;
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  },

  async list(prefix?: string) {
    if (!s3Client) {
      return { files: [], simulated: true };
    }

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    return {
      files: (response.Contents || []).map((item) => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
      })),
      simulated: false,
    };
  },

  async delete(key: string) {
    if (!s3Client) {
      return { success: true, simulated: true };
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return { success: true, simulated: false };
  },

  getStatus() {
    return {
      configured: isStorageAvailable,
      bucket: BUCKET_NAME,
      region: REGION,
      endpoint: ENDPOINT || 'https://storage.ap-southeast-1.aws.neon.tech',
    };
  },
};
