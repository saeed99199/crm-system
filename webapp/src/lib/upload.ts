type UploadResult = {
  id: string;
  url: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export async function uploadFile(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BACKEND_URL}/api/upload`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "فشل رفع الملف");
  return data.data;
}

export async function deleteFile(fileId: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/files/${fileId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "فشل حذف الملف");
  }
}
