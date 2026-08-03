import type { Wine } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function uploadFile(file: File): Promise<Wine[]> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    // Try to get the error detail from the response body, falling back
    // to the status text if the body is not valid JSON.
    const body: unknown = await response.json().catch(() => null);
    const detail =
      typeof body === 'object' && body !== null && 'detail' in body
        ? String((body as { detail: unknown }).detail)
        : response.statusText;
    throw new Error(`Upload failed: ${detail}`);
  }

  return (await response.json()) as Wine[];
}
