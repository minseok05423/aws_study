import { useEffect, useState } from "react";
import Login from "./components/pages/Login";
import Signup from "./components/pages/Signup";
import Home from "./components/pages/Home";
import { useAuth } from "./components/auth/authContext";
import supabase from "./utils/supabase";

type Page = "login" | "signup" | "home";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const { session, signOut } = useAuth();

  const handleLogout = () => {
    setCurrentPage("login");
    signOut();
  };

  const verify = async () => {
    if (session) {
      try {
        const { data, error } = await supabase.auth.getUser(
          session.access_token
        );

        if (data?.user) {
          console.log("Token is valid for user:", data.user.id);
        }

        if (error) {
          console.error("Token verification failed:", error.message);
          signOut();
          setCurrentPage("login");
        }
      } catch (err) {
        console.error("Unexpected error during token verification:", err);
        signOut();
        setCurrentPage("login");
      }
    }
  };

  useEffect(() => {
    console.log("session changed:", session);

    verify();

    if (session && currentPage !== "home") {
      setCurrentPage("home");
    } else if (!session && currentPage === "home") {
      setCurrentPage("login");
    }
  }, [session, currentPage]);

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
