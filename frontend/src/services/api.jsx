const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      // Try to get error message from response body, otherwise use status text
      const errorData = await response.json().catch(() => null); // Use .catch in case body is not valid JSON
      const errorMessage = errorData?.detail || response.statusText;
      throw new Error(`Upload failed: ${errorMessage}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in uploadFile service:", error);
    // Re-throw the error so the component can handle it
    throw error;
  }
}
