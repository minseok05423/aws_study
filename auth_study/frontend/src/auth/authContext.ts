import { useContext, createContext } from "react";
import type { Session } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
  user: unknown;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);
