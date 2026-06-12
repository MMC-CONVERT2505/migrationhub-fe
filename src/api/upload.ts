import { apiClient } from './client';
import type { UploadResponse } from '@/types/api';

/** Multipart upload to the shared /upload endpoint. Returns the stored file
 *  name (use `meta.filename` when creating a banner) and a resolved URL. */
export const uploadService = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post<UploadResponse>('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
