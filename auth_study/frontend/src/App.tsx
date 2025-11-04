import { useState } from "react";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Home from "./components/pages/Home";

type Page = "login" | "signup" | "home";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");

  const handleLogout = () => {
    setCurrentPage("login");
  };

  return (
    <>
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
    </>
  );
}

export default App;
