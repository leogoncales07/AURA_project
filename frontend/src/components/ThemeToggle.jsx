"use client";
import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
    const [theme, setTheme] = useState("light");

    useEffect(() => {
        const savedTheme = localStorage.getItem("aura-theme") ||
            (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("aura-theme", newTheme);
    };

    return (
        <button
            onClick={toggleTheme}
            className={styles.toggle}
            aria-label="Alternar modo escuro"
        >
            {theme === "light" ? "🌙" : "☀️"}
        </button>
    );
}
