import React from 'react';

const AuraLogo = ({ size = 32, className = "", style = {} }) => {
    return (
        <img
            src="/aura-logo-white.png"
            alt="Aura Logo"
            width={size}
            height={size}
            className={`aura-logo-img ${className}`}
            style={{ 
                objectFit: 'contain', 
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                display: 'block',
                ...style 
            }}
        />
    );
};

export default AuraLogo;
