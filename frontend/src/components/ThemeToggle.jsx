"use client";
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from "react";

import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
    const [theme, setTheme] = useState("dark"); // Default to dark for premium feel

    useEffect(() => {
        const savedTheme = localStorage.getItem("aura-theme") || "dark";
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
            aria-label="Toggle theme"
        >
            <div className={styles.iconWrapper}>
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </div>
        </button>
    );
}
