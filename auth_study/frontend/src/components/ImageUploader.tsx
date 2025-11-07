import { useState, useRef } from "react";
import type { DragEvent } from "react";
import { useAuth } from "./auth/authContext";
import { uploadMultipleImages, type UploadResult } from "../utils/imageBucket";
import { generateUUID } from "../utils/uuid";

const ImageUploader = () => {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { session } = useAuth();

  const processFiles = (files: FileList) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    setImages((prev) => [...prev, ...imageFiles]);

    imageFiles.forEach((file) => {
      const blobUrl = URL.createObjectURL(file);
      setPreviews((prev) => [...prev, blobUrl]);
    });
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const clearAll = () => {
    setImages([]);
    setPreviews([]);
  };

  const uploadToSupabase = async () => {
    if (images.length === 0) {
      alert("No images to upload");
      return;
    }

    if (!session?.user?.id) {
      alert("You must be logged in to upload images");
      return;
    }

    const userId = session.user.id;
    const linkedId = generateUUID();

    try {
      const results = await uploadMultipleImages(images, userId, linkedId);

      const failedUploads = results.filter(
        (result: UploadResult) => result.error
      );

      if (failedUploads.length > 0) {
        const errorMessages = failedUploads
          .map((result: UploadResult) => `${result.fileName}: ${result.error}`)
          .join("\n");
        alert(`Some uploads failed:\n${errorMessages}`);
      } else {
        alert("All images uploaded successfully!");
        clearAll();
      }
    } catch (error) {
      alert(`Upload failed: ${error}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Image Uploader</h3>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50"
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          onChange={onFileSelect}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="text-gray-600">
            <p className="text-lg font-medium">
              Drag and drop images here, or click to select
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports: JPG, PNG, GIF, WebP
            </p>
          </div>

          <button
            onClick={handleButtonClick}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Select Images
          </button>
        </div>
      </div>

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {images.length} image{images.length !== 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={uploadToSupabase}
                className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 text-sm font-medium"
              >
                Upload to Cloud
              </button>
              <button
                onClick={clearAll}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative group rounded-lg overflow-hidden border border-gray-200"
              >
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-48 object-cover"
                />

                {/* Image Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-xs">
                  <p className="truncate font-medium">{images[index].name}</p>
                  <p className="text-gray-300">
                    {(images[index].size / 1024).toFixed(1)} KB •{" "}
                    {images[index].type.split("/")[1].toUpperCase()}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
