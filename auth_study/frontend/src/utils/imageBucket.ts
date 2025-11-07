import supabase from "./supabase";

export interface UploadResult {
  fileName: string;
  publicUrl: string;
  error?: string;
}

const uploadImageToStorage = async (
  file: File,
  userId: string,
  linkedId: string
): Promise<UploadResult> => {
  // Sanitize filename by removing special characters
  const fileName = `${Date.now()}_${linkedId}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from("images")
    .upload(filePath, file);

  if (error) {
    console.error("Upload error details:", {
      message: error.message,
      error: error,
      filePath,
      fileSize: file.size,
      fileType: file.type,
    });

    return {
      fileName: file.name,
      publicUrl: "",
      error: error.message,
    };
  }

  const { data: publicUrlData } = supabase.storage
    .from("images")
    .getPublicUrl(filePath);

  return {
    fileName: file.name,
    publicUrl: publicUrlData.publicUrl,
  };
};

const uploadMultipleImages = async (
  files: File[],
  userId: string,
  linkedId: string
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];

  for (const file of files) {
    const result = await uploadImageToStorage(file, userId, linkedId);
    results.push(result);
  }

  return results;
};

export { uploadImageToStorage, uploadMultipleImages };
