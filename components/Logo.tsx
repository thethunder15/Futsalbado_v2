
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "w-24 h-24" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img src="/logo.png" alt="Logo Futsalbado" className="w-full h-full object-contain drop-shadow-md" />
    </div>
  );
};

export default Logo;
