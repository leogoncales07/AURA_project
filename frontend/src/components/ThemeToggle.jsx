"use client";
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

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
