import { useState, useEffect } from "react";
import useDeepseekAPI from "../../hooks/useDeepseek";
import useImageFetch from "../../hooks/useImageFetch";
import supabase from "../../utils/supabase";
import { useAuth } from "../auth/authContext";
import ImageUploader from "..//ImageUploader";
import { v4 as uuidv4 } from "uuid";
import {
  uploadMultipleImages,
  type UploadResult,
} from "../../utils/imageBucket";

interface HomeProps {
  onLogout: () => void;
}

interface Todo {
  id: number;
  title: string;
  description: string;
  user_id: string;
  linked_id: string;
  created_at: string;
}

const Home = ({ onLogout }: HomeProps) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [flag, setFlag] = useState(1);
  const [deepseekResponse, setDeepseekResponse] = useState<string>("");

  // Image upload states
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { CallDeepseek, deepseekLoading } = useDeepseekAPI();
  const {
    images: fetchedImages,
    loading: imageLoading,
    error: imageError,
    fetchImagesByLinkedId,
  } = useImageFetch();
  const [loading, setLoading] = useState("");
  const { session } = useAuth();

  const token = session?.access_token;

  const TestPress = async () => {
    if (!token) {
      console.log("not authorized");
    } else {
      const response = await CallDeepseek(token, 128);
      const result = JSON.stringify(response, null, 2);
      setDeepseekResponse(result);
    }
  };

  useEffect(() => {
    let intervalId: number | null = null;

    if (deepseekLoading) {
      intervalId = setInterval(() => {
        setLoading((prev) => (prev += "."));
      }, 500);
    } else {
      setLoading("");
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [deepseekLoading]);

  useEffect(() => {
    const getTodos = async () => {
      const { data: todos } = await supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: true });

      if (todos && todos.length > 0) {
        setTodos(todos);
      } else {
        setTodos([]);
      }
    };
    getTodos();
  }, [flag]);

  const Switch = () => {
    setFlag((prev) => (prev *= -1));
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!newTask.title.trim()) return;

      const userId = session?.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      setUploading(true);

      // Generate a unique ID to link the todo with uploaded images
      const linkedId = uuidv4();

      // Upload images if any are selected
      if (images.length > 0) {
        const results = await uploadMultipleImages(images, userId, linkedId);

        const failedUploads = results.filter(
          (result: UploadResult) => result.error
        );

        if (failedUploads.length > 0) {
          const errorMessages = failedUploads
            .map(
              (result: UploadResult) => `${result.fileName}: ${result.error}`
            )
            .join("\n");
          alert(`Some image uploads failed:\n${errorMessages}`);
          setUploading(false);
          return;
        }
      }

      // Add the todo to database
      const { error } = await supabase
        .from("todos")
        .insert({
          ...newTask,
          user_id: userId,
          linked_id: linkedId,
        })
        .single();

      if (error) {
        throw new Error(error.message);
      }

      console.log("Adding todo:", newTask);

      // Clear form and images
      setNewTask({ title: "", description: "" });
      setImages([]);
      setPreviews([]);

      Switch();
    } catch (error) {
      console.log(`error: ${error}`);
      alert(`Failed to add todo: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    console.log("Deleting todo:", id);
    const { data, error: fetchError } = await supabase
      .from("todos")
      .select("linked_id")
      .eq("id", id)
      .single();

    const linkedId = data?.linked_id;

    if (fetchError) {
      console.log(`fetchError: ${fetchError}`);
      return;
    }
    const { error: dbError } = await supabase
      .from("todos")
      .delete()
      .eq("id", id);
    if (dbError) {
      console.log(`dbError: ${dbError}`);
      return;
    }
    const { error: storageError } = await supabase.storage
      .from("images")
      .remove([`${session?.user?.id}/${linkedId}`]);
    if (storageError) {
      console.log(`storageError: ${storageError}`);
      return;
    }

    Switch();
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingText(todo.title);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editingText.trim()) return;

    const { error } = await supabase
      .from("todos")
      .update({ title: editingText })
      .eq("id", id);
    console.log("Updating todo:", id, editingText);
    if (error) {
      console.log(`error: ${error}`);
    }

    Switch();
    setEditingId(null);
    setEditingText("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const handleCallImages = async (todo: Todo) => {
    const userId = session?.user?.id;

    if (!userId) {
      alert("You must be logged in to fetch images");
      return;
    }

    if (!todo.linked_id) {
      alert("This todo has no linked images");
      return;
    }

    // idk why i moved this into hooks, this shouldnt be there
    await fetchImagesByLinkedId(userId, todo.linked_id);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={onLogout}
            className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Todos */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Todos</h3>
          </div>
          <div className="p-6">
            {/* Add Todo Form */}
            <form onSubmit={handleAddTodo} className="mb-6">
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  placeholder="Title..."
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  placeholder="Description..."
                  className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <ImageUploader
                    images={images}
                    setImages={setImages}
                    previews={previews}
                    setPreviews={setPreviews}
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploading}
                  className={`px-6 py-2 rounded-md transition-colors font-medium ${
                    uploading
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {uploading ? "Uploading..." : "Add"}
                </button>
              </div>
            </form>

            {/* Todos List */}
            {todos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No todos yet. Add one above!
              </p>
            ) : (
              <ul className="space-y-3">
                {todos.map((todo) => (
                  <li
                    key={todo.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {/* Task Text or Edit Input */}
                    {editingId === todo.id ? (
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {todo.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          {todo.description}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {editingId === todo.id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(todo.id)}
                            className="text-green-600 hover:text-green-700 font-medium px-2"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-700 font-medium px-2"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleCallImages(todo)}
                            className="text-green-600 hover:text-green-700 font-medium px-2"
                          >
                            Call Images
                          </button>
                          <button
                            onClick={() => handleEditTodo(todo)}
                            className="text-blue-600 hover:text-blue-700 font-medium px-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="text-red-600 hover:text-red-700 font-medium px-2"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Fetched Images Display */}
        {fetchedImages.length > 0 && (
          <div className="bg-white rounded-lg shadow mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Linked Images
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {fetchedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-lg overflow-hidden border border-gray-200"
                  >
                    <img
                      src={img.signedUrl}
                      alt={img.name}
                      className="w-full h-48 object-cover"
                    />
                    {/* Image Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-xs">
                      <p className="truncate font-medium">{img.name}</p>
                      <p className="text-gray-300">
                        {new Date(img.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {imageLoading && (
          <div className="bg-white rounded-lg shadow mt-6 p-6 text-center">
            <p className="text-gray-600">Loading images...</p>
          </div>
        )}

        {/* Error State */}
        {imageError && (
          <div className="bg-red-50 rounded-lg shadow mt-6 p-6 text-center">
            <p className="text-red-600">{imageError}</p>
          </div>
        )}
      </main>
      <div className="mt-6 flex flex-col items-center">
        <button
          onClick={TestPress}
          disabled={deepseekLoading}
          aria-busy={deepseekLoading}
          className={`inline-flex items-center px-4 py-2 rounded-md font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            deepseekLoading
              ? "bg-gray-400 cursor-not-allowed focus:ring-gray-400"
              : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
          }`}
        >
          {deepseekLoading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h8M12 8v8"
              />
            </svg>
          )}
          <span className="ml-2">
            {deepseekLoading ? `Calling${loading}` : "Call Deepseek"}
          </span>
        </button>

        {deepseekResponse && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Deepseek response
            </h4>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-64 text-sm">
              {deepseekResponse}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
