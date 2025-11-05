import { useEffect, useState } from "react";
import { setItem, getItem } from "../utils/localStorage";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState(() => {
    const item = getItem(key);
    return (item as T) || initialValue;
  });
  // function inside useState is a lazy function, it executes only at mount

  useEffect(() => {
    setItem(key, value);
  }, [value]);

  return [value, setValue] as const;
}
