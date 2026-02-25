/**
 * Upload a prescription image (Blob or File) to the backend.
 * Uses native fetch with FormData (no base64).
 */

/**
 * Upload a prescription image (Blob or File) to the backend.
 * The backend will: Cloudinary upload → Mistral OCR → AI extraction → MongoDB save.
 * Returns the extracted medication data.
 */
export const uploadPrescription = async (imageBlob, onProgress) => {
  const formData = new FormData();
  formData.append('prescriptions', imageBlob, 'prescription.png');

  const token = localStorage.getItem('pharmacy_token');

  const response = await fetch(
    `${import.meta.env.VITE_API_URL || '/api'}/prescription/upload`,
    {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Upload failed (${response.status})`);
  }

  return response.json();
};
