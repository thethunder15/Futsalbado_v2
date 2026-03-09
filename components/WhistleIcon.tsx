import React from 'react';

const WhistleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    {/* Corpo do apito */}
    <circle cx="16" cy="14" r="6" />
    
    {/* Argola superior */}
    <path d="M15 8.2V6a1 1 0 0 1 2 0v2.2" />
    
    {/* Bocal */}
    <path d="M11.5 10H3v4h7" />
    
    {/* Bolinha interna */}
    <circle cx="16" cy="14" r="2" fill="currentColor" />
  </svg>
);

export default WhistleIcon;
