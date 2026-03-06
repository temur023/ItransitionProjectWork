import { useState, useEffect, useCallback } from "react";

function useTheme() {
  const normalizeTheme = (value) => {
    // Supports: "light"/"dark", 1/2 (PreferedTheme enum), and "Light"/"Dark"
    if (value === 2 || value === "2" || value === "Dark" || value === "dark") return "dark";
    return "light";
  };

  const [theme, setTheme] = useState(
    () => normalizeTheme(localStorage.getItem("theme") || "light")
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme(t => t === "light" ? "dark" : "light"), []);
  const setPreferredTheme = useCallback((preferred) => setTheme(normalizeTheme(preferred)), []);

  return { theme, toggleTheme, setPreferredTheme };
}

export default useTheme;