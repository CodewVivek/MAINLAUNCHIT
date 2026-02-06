import { useState, useRef, useEffect } from "react";
import { CirclePlus, Video } from "lucide-react";
import Link from "next/link";

const LaunchDropdown = ({ user }) => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef();
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger button */}
            <button
                onClick={() => setOpen(!open)}
                className="text-gray-800 hover:text-white font-medium flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition bg-gray-200"
            >
                <CirclePlus className="w-4 h-4" />
                Launch
            </button>

            {/* Dropdown content */}
            {open && (
                <div className="absolute mt-2 w-44 bg-white shadow-lg border rounded-md z-50">
                    <Link
                        href="/submit"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100 flex items-center gap-2"
                    >
                        <CirclePlus className="w-4 h-4" />
                        Submit
                    </Link>
                    {user && (
                        <Link
                            href="/uploadpitch"
                            onClick={() => setOpen(false)}
                            className="block px-4 py-2 text-gray-800 hover:bg-gray-100 flex items-center gap-2"
                        >
                            <Video className="w-4 h-4" />
                            Pitch
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default LaunchDropdown;
