export const API_BASE = '/api';

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = 'Erro na requisição';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || errorDetail;
    } catch {
      // Ignora erro de parsing JSON
    }
    throw new Error(errorDetail);
  }
  return response.json();
}
