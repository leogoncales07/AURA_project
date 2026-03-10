import React from 'react';

const AuraLogo = ({ size = 32, className = "", style = {} }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={style}
        >
            <defs>
                <linearGradient id="aura-luxury-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A855F7" /> {/* Amethyst */}
                    <stop offset="100%" stopColor="#6366F1" /> {/* Indigo */}
                </linearGradient>
                <filter id="aura-halo-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* The Halo - Ethereal, floating ring of light */}
            <ellipse
                cx="50" cy="22" rx="22" ry="6"
                stroke="#c084fc"
                strokeWidth="1"
                opacity="0.5"
                filter="url(#aura-halo-glow)"
            />
            <ellipse
                cx="50" cy="22" rx="22" ry="6"
                stroke="url(#aura-luxury-purple)"
                strokeWidth="0.5"
                opacity="0.7"
            />

            {/* The Elegant "A" - Continuous, fluid lines forming a modern monogram */}

            {/* Left structural path */}
            <path
                d="M34 82C36 78 38 55 50 20"
                stroke="url(#aura-luxury-purple)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Right structural path */}
            <path
                d="M50 20C62 55 64 78 66 82"
                stroke="url(#aura-luxury-purple)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* The Ethereal Crossbar - A fluid, looping wave */}
            <path
                d="M36 68C42 62 58 62 64 68"
                stroke="url(#aura-luxury-purple)"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.9"
            />

            {/* Apex light node */}
            <circle cx="50" cy="20" r="1.5" fill="white" opacity="0.8" />
        </svg>
    );
};

export default AuraLogo;
