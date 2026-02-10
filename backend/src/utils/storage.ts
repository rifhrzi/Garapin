import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { AppError } from './errors';

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY || env.SUPABASE_URL.includes('[')) {
      throw new AppError('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env', 503);
    }
    supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  }
  return supabase;
}

const DELIVERY_FILES_BUCKET = 'delivery-files';
const CHAT_FILES_BUCKET = 'chat-files';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/zip',
  'application/x-rar-compressed',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export async function uploadChatFile(
  file: Express.Multer.File,
  conversationId: string
): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new AppError('File size exceeds 10MB limit', 400);
  }

  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new AppError('File type not allowed', 400);
  }

  const timestamp = Date.now();
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${conversationId}/${timestamp}-${safeName}`;

  const client = getSupabase();

  const { error } = await client.storage
    .from(CHAT_FILES_BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new AppError(`File upload failed: ${error.message}`, 502);
  }

  const { data: urlData } = client.storage
    .from(CHAT_FILES_BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export async function uploadDeliveryFile(
  file: Express.Multer.File,
  projectId: string
): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new AppError('File size exceeds 10MB limit', 400);
  }

  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new AppError('File type not allowed', 400);
  }

  const timestamp = Date.now();
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${projectId}/${timestamp}-${safeName}`;

  const client = getSupabase();

  const { error } = await client.storage
    .from(DELIVERY_FILES_BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new AppError(`File upload failed: ${error.message}`, 502);
  }

  const { data: urlData } = client.storage
    .from(DELIVERY_FILES_BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
