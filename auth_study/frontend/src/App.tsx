import { useState } from "react";
import Login from "./components/pages/Login";
import Signup from "./components/pages/Signup";
import Home from "./components/pages/Home";
import { AuthProvider } from "./auth/authProvider";
import { useAuth } from "./auth/authContext";

type Page = "login" | "signup" | "home";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const { signOut } = useAuth();

  const handleLogout = () => {
    setCurrentPage("login");
    signOut();
  };

  return (
    <AuthProvider>
      {currentPage === "login" ? (
        <Login
          onNavigateToSignup={() => setCurrentPage("signup")}
          onLoginSuccess={() => setCurrentPage("home")}
        />
      ) : currentPage === "signup" ? (
        <Signup onNavigateToLogin={() => setCurrentPage("login")} />
      ) : (
        <Home onLogout={handleLogout} />
      )}
    </AuthProvider>
  );
}

export default App;
