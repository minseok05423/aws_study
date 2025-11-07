import { useState, useEffect } from "react";
import useDeepseekAPI from "../../hooks/useDeepseek";
import supabase from "../../utils/supabase";
import { useAuth } from "../auth/authContext";
import ImageUploader from "..//ImageUploader";
import ImageSearch from "../ImageSearch";

interface HomeProps {
  onLogout: () => void;
}

interface Todo {
  id: number;
  title: string;
  description: string;
  user_id: string;
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

  const { CallDeepseek, deepseekLoading } = useDeepseekAPI();
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

      const { error } = await supabase
        .from("todos")
        .insert({
          ...newTask,
          user_id: userId,
        })
        .single();

      if (error) {
        throw new Error(error.message);
      }

      console.log("Adding todo:", newTask);
      Switch();
    } catch (error) {
      console.log(`error: ${error}`);
    }

    setNewTask({ title: "", description: "" });
  };

  const handleDeleteTodo = async (id: number) => {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    console.log("Deleting todo:", id);
    if (error) {
      console.log(`error: ${error}`);
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
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Add
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
      </main>
      <div>
        <ImageUploader />
      </div>
      <div>
        <ImageSearch />
      </div>
      <div>
        <button className="border" onClick={TestPress}>
          call deepseek
        </button>
        <div>
          {deepseekLoading ? <p>Loading{loading}</p> : null}
          {deepseekResponse && (
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {deepseekResponse}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
