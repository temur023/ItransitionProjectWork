import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function TagInput({ value = [], onChange, apiUrl, placeholder = "Type to search tags...", disabled = false }) {
    const [input, setInput] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (!input.trim()) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const response = await axios.post(`${apiUrl}/api/Inventory/tag-suggestions`, [input.trim()]);
                const list = response.data?.data || response.data || [];
                setSuggestions(Array.isArray(list) ? list : []);
                setShowDropdown(true);
                setActiveIndex(-1);
            } catch {
                setSuggestions([]);
                setShowDropdown(false);
            }
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [input, apiUrl]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowDropdown(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Selection Option 1: Add tag(s) — called when user presses Enter or clicks a suggestion
    // Accepts either a suggestion name (clicked/arrow-selected) or the raw typed input
    const addTag = (name) => {
        const raw = (name ?? input).trim();
        if (!raw) return;
        // Split by comma or space so "iphone smart" or "iphone, smart" becomes two tags
        // This allows users to add multiple tags at once by typing them separated by spaces or commas
        const parts = raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
        const next = [...value];
        let added = false;
        for (const n of parts) {
            if (n && !next.includes(n)) {
                next.push(n);
                added = true;
            }
        }
        if (added) {
            onChange(next);
            setInput("");
            setSuggestions([]);
            setShowDropdown(false);
        }
    };

    const removeTag = (index) => {
        onChange(value.filter((_, i) => i !== index));
    };

    // Selection Option 2: Keyboard-based selection and navigation
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            // If dropdown is open and user has highlighted a suggestion with arrows, select that suggestion
            if (showDropdown && activeIndex >= 0 && suggestions[activeIndex]) {
                addTag(suggestions[activeIndex]);
                return;
            }
            // Otherwise, add whatever the user typed as a new tag (will be split by spaces/commas)
            addTag(input);
        } else if (e.key === "Backspace" && !input && value.length > 0) {
            // If input is empty and Backspace is pressed, remove the last added tag
            removeTag(value.length - 1);
        } else if (e.key === "ArrowDown") {
            // Navigate down through the suggestion dropdown list
            e.preventDefault();
            setActiveIndex((i) => (i < suggestions.length - 1 ? i + 1 : i));
        } else if (e.key === "ArrowUp") {
            // Navigate up through the suggestion dropdown list
            e.preventDefault();
            setActiveIndex((i) => (i > 0 ? i - 1 : -1));
        }
    };

    return (
        <div ref={wrapperRef} className="tag-input-wrapper position-relative">
            <div className="d-flex flex-wrap align-items-center gap-1 border rounded p-2 bg-light">
                {value.map((tag, i) => (
                    <span key={i} className="badge bg-primary d-inline-flex align-items-center gap-1">
                        {tag}
                        {!disabled && (
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                style={{ fontSize: "0.5rem" }}
                                aria-label="Remove tag"
                                onClick={() => removeTag(i)}
                            />
                        )}
                    </span>
                ))}
                {!disabled && (
                    <input
                        type="text"
                        className="border-0 bg-transparent flex-grow-1"
                        style={{ minWidth: "120px", outline: "none" }}
                        placeholder={placeholder}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onFocus={() => input.trim() && setShowDropdown(true)}
                        onKeyDown={handleKeyDown}
                    />
                )}
            </div>
            {showDropdown && suggestions.length > 0 && (
                <ul className="list-group position-absolute start-0 mt-1 shadow" style={{ zIndex: 1050, maxHeight: "200px", overflowY: "auto" }}>
                    {/* Selection Option 3: Click to select — clicking a suggestion adds it as a tag */}
                    {/* Mouse hover highlights the suggestion (sets activeIndex for keyboard combo) */}
                    {suggestions.filter((s) => !value.includes(s)).map((s, i) => (
                        <li
                            key={s}
                            className={`list-group-item list-group-item-action ${i === activeIndex ? "active" : ""}`}
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setActiveIndex(i)}  // Highlight on hover
                            onClick={() => addTag(s)}              // Click to select suggestion
                        >
                            {s}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}