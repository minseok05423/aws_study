import { useState } from "react";
import supabase from "../utils/supabase";

interface ImageItem {
  name: string;
  signedUrl: string;
  createdAt: string;
}

interface UseImageFetchReturn {
  images: ImageItem[];
  loading: boolean;
  error: string;
  fetchImagesByLinkedId: (userId: string, linkedId: string) => Promise<void>;
  clearImages: () => void;
}

const useImageFetch = (): UseImageFetchReturn => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchImagesByLinkedId = async (userId: string, linkedId: string) => {
    if (!userId || !linkedId) {
      setError("User ID and Linked ID are required");
      return;
    }

    setLoading(true);
    setError("");
    setImages([]);

    try {
      // List all files in the user's folder
      const { data: files, error: listError } = await supabase.storage
        .from("images")
        .list(userId, {
          limit: 1000,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (listError) {
        throw new Error(listError.message);
      }

      if (!files || files.length === 0) {
        setError("No images found for this user");
        setLoading(false);
        return;
      }

      console.log("linkedId:", linkedId);
      console.log(
        "All files:",
        files.map((f) => f.name)
      );
      // Filter files that match the linkedId
      // Filename format: 20250110_linkedId.jpg
      const matchingFiles = files.filter((file) => {
        // Split by underscore and get the second part (linkedId.ext)
        const parts = file.name.split("_");
        if (parts.length < 2) return false;

        // Remove the file extension from the linkedId part
        const fileIdWithExt = parts[1];
        const fileId = fileIdWithExt.split(".")[0];

        return fileId === linkedId;
      });

      if (matchingFiles.length === 0) {
        setError("No images found for this todo");
        setLoading(false);
        return;
      }

      // Generate signed URLs for each matching image
      const imagePromises = matchingFiles.map(async (file) => {
        const filePath = `${userId}/${file.name}`;

        const { data, error: urlError } = await supabase.storage
          .from("images")
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (urlError) {
          console.error(
            `Error creating signed URL for ${file.name}:`,
            urlError
          );
          return null;
        }

        return {
          name: file.name,
          signedUrl: data.signedUrl,
          createdAt: file.created_at || "",
        };
      });

      const imageResults = await Promise.all(imagePromises);

      // Filter out nulls and placeholder files
      const validImages = imageResults
        .filter((img): img is ImageItem => img !== null)
        .filter((img) => !img.name.startsWith(".empty"));

      setImages(validImages);

      if (validImages.length === 0) {
        setError("No valid images found");
      }
    } catch (err) {
      setError(`Failed to fetch images: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const clearImages = () => {
    setImages([]);
    setError("");
  };

  return {
    images,
    loading,
    error,
    fetchImagesByLinkedId,
    clearImages,
  };
};

export default useImageFetch;
