import { useState } from "react";
import supabase from "../utils/supabase";
import { useAuth } from "./auth/authContext";

interface ImageItem {
  name: string;
  signedUrl: string;
  createdAt: string;
}

const ImageSearch = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageItem[]>([]);
  const [searchUUID, setSearchUUID] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { session } = useAuth();

  const fetchUserImages = async () => {
    if (!session?.user?.id) {
      setError("You must be logged in to search images");
      return;
    }

    setLoading(true);
    setError("");
    setImages([]);

    const userId = session.user.id;

    try {
      // List all files in the user's folder
      const { data: files, error: listError } = await supabase.storage
        .from("images")
        .list(userId, {
          limit: 100,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (listError) {
        throw new Error(listError.message);
      }

      if (!files || files.length === 0) {
        setError("No images found");
        setLoading(false);
        return;
      }

      // Generate signed URLs for each image
      const imagePromises = files.map(async (file) => {
        const filePath = `${userId}/${file.name}`;

        const { data, error } = await supabase.storage
          .from("images")
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (data) {
          console.log(`Signed URL for ${file.name}:`, data.signedUrl);
        }

        if (error) {
          console.error(`Error creating signed URL for ${file.name}:`, error);
          return null;
        }

        return {
          name: file.name,
          signedUrl: data.signedUrl,
          createdAt: file.created_at || "",
        };
      });

      const imageResults = await Promise.all(imagePromises);
      // Filter out any placeholder files (e.g. .emptyFolderPlaceholder) and nulls
      const validImages = imageResults
        .filter((img): img is ImageItem => img !== null)
        .filter((img) => !img.name.startsWith(".empty"));
      <span className="text-sm">🔍</span>;

      setImages(validImages);
      // reset any previous filtered view
      setFilteredImages([]);
    } catch (err) {
      setError(`Failed to fetch images: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = () => {
    const q = searchUUID.trim();
    if (!q) {
      // empty -> clear filter
      setFilteredImages([]);
      return;
    }

    // Search by substring match on filename (date_custom_uuid)
    const matches = images.filter((img) => img.name.includes(q));
    setFilteredImages(matches);
    if (matches.length === 0) {
      setError("No images matched that UUID");
    } else {
      setError("");
    }
  };

  const clearSearch = () => {
    setSearchUUID("");
    setFilteredImages([]);
    setError("");
  };

  const handleImageClick = (signedUrl: string, fileName: string) => {
    console.log(`Clicked image: ${fileName}`);
    console.log(`Signed URL: ${signedUrl}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Image Search</h3>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={searchUUID}
            onChange={(e) => setSearchUUID(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") performSearch();
            }}
            placeholder="Enter UUID part (e.g. 123e4567)"
            className="px-3 py-2 border rounded-md text-sm w-64"
          />
          <button
            onClick={performSearch}
            disabled={loading}
            className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400"
          >
            Search
          </button>
          <button
            onClick={clearSearch}
            className="bg-gray-200 text-gray-800 px-3 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
          >
            Clear
          </button>
          <button
            onClick={fetchUserImages}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
          >
            {loading ? "Loading..." : "Fetch My Images"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!loading && (filteredImages.length > 0 || images.length > 0) && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Found{" "}
            {filteredImages.length > 0 ? filteredImages.length : images.length}{" "}
            image
            {(filteredImages.length > 0
              ? filteredImages.length
              : images.length) !== 1
              ? "s"
              : ""}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(filteredImages.length > 0 ? filteredImages : images).map(
              (image, index) => (
                <div
                  key={index}
                  className="relative group rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleImageClick(image.signedUrl, image.name)}
                >
                  <img
                    src={image.signedUrl}
                    alt={image.name}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />

                  {/* Image Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-xs">
                    <p className="truncate font-medium">{image.name}</p>
                    {image.createdAt && (
                      <p className="text-gray-300 text-xs">
                        {new Date(image.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Hover Indicator */}
                  <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm">=</span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {!loading && images.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500">
          <p>Click "Fetch My Images" to load your uploaded images</p>
        </div>
      )}
    </div>
  );
};

export default ImageSearch;
