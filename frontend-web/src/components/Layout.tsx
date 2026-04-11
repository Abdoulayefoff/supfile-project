import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Settings,
  Search,
  Folder,
  Image as ImageIcon,
  Video,
  FileText,
  Home,
  X,
} from "lucide-react";
import Dashboard from "../features/dashboard/DashboardPage";

type ThemeMode = "light" | "dark";

const navItems = [
  { label: "Accueil", path: "/dashboard", icon: Home },
  { label: "Tous les fichiers", path: "/files", icon: Folder },
  { label: "Photos", path: "/photos", icon: ImageIcon },
  { label: "Vidéos", path: "/videos", icon: Video },
  { label: "Documents", path: "/documents", icon: FileText },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as ThemeMode | null;
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: light)"
    ).matches;

    const initialTheme = savedTheme ?? (systemPrefersDark ? "dark" : "light");
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <Dashboard></Dashboard>
  );
}