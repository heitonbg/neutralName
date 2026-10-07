import { apiBaseUrl, apiClient } from './client.js';

export async function uploadImages(files, onProgress) {
  const formData = new FormData();
  files.forEach((file) => formData.append('photos', file));
  const data = await apiClient.post('/api/upload', formData, {
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
  return (data.urls || []).map((url) => new URL(url, `${apiBaseUrl}/`).toString());
}
