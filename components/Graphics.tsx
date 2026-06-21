import React from 'react';

export const MushroomGraphic = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 120" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    {/* Stem */}
    <path d="M40 50 C40 80 35 100 35 110 C35 115 65 115 65 110 C65 100 60 80 60 50 Z" opacity="0.7"/>
    {/* Stem details (lines) */}
    <path d="M45 55 Q 43 80 40 105 M 55 55 Q 57 80 60 105" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
    {/* Cap */}
    <path d="M50 10 C10 10 0 40 0 50 C0 55 100 55 100 50 C100 40 90 10 50 10 Z"/>
    {/* Gills/Underbelly */}
    <path d="M5 50 C25 65 75 65 95 50 C75 55 25 55 5 50 Z" fill="currentColor" opacity="0.4"/>
    {/* Spots */}
    <circle cx="30" cy="30" r="4" fill="currentColor" opacity="0.3"/>
    <circle cx="50" cy="20" r="5" fill="currentColor" opacity="0.3"/>
    <circle cx="70" cy="35" r="4" fill="currentColor" opacity="0.3"/>
    <circle cx="40" cy="42" r="3" fill="currentColor" opacity="0.3"/>
    <circle cx="60" cy="40" r="3.5" fill="currentColor" opacity="0.3"/>
    <circle cx="20" cy="45" r="2" fill="currentColor" opacity="0.3"/>
    <circle cx="80" cy="45" r="2.5" fill="currentColor" opacity="0.3"/>
  </svg>
);

export const HempLeafGraphic = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    {/* Center leaf */}
    <path d="M50 5 C 58 25 60 45 50 60 C 40 45 42 25 50 5 Z" />
    {/* Side leaves */}
    <path d="M50 60 C 65 40 85 30 95 35 C 85 55 65 65 50 60 Z" />
    <path d="M50 60 C 35 40 15 30 5 35 C 15 55 35 65 50 60 Z" />
    {/* Lower leaves */}
    <path d="M50 60 C 65 65 85 70 85 80 C 75 85 60 75 50 60 Z" />
    <path d="M50 60 C 35 65 15 70 15 80 C 25 85 40 75 50 60 Z" />
    {/* Lowest small leaves */}
    <path d="M50 60 C 58 70 70 80 65 85 C 60 85 55 75 50 60 Z" />
    <path d="M50 60 C 42 70 30 80 35 85 C 40 85 45 75 50 60 Z" />
    {/* Stem */}
    <path d="M48 60 L 47 95 C 47 98 53 98 53 95 L 52 60 Z" />
  </svg>
);

export const VineGraphic = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 190 Q 50 120 100 100 T 190 10" strokeWidth="3" strokeLinecap="round"/>
    <path d="M10 190 Q 80 180 100 100 T 190 10" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    {/* Leaves */}
    <path d="M40 145 C 30 125 10 125 10 145 C 10 155 30 155 40 145 Z" fill="currentColor" stroke="none"/>
    <path d="M90 95 C 80 75 60 75 60 95 C 60 105 80 105 90 95 Z" fill="currentColor" stroke="none"/>
    <path d="M140 45 C 130 25 110 25 110 45 C 110 55 130 55 140 45 Z" fill="currentColor" stroke="none"/>
    <path d="M65 120 C 85 130 85 150 65 150 C 55 150 55 130 65 120 Z" fill="currentColor" stroke="none"/>
    <path d="M115 70 C 135 80 135 100 115 100 C 105 100 105 80 115 70 Z" fill="currentColor" stroke="none"/>
    <path d="M165 20 C 185 30 185 50 165 50 C 155 50 155 30 165 20 Z" fill="currentColor" stroke="none"/>
  </svg>
);

export const BerryBranchGraphic = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 150 200" className={className} fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 180 Q 50 100 130 20" strokeWidth="3" strokeLinecap="round"/>
    {/* Leaves */}
    <path d="M40 130 C 20 110 10 130 20 140 C 30 150 50 140 40 130 Z" fill="currentColor" stroke="none" opacity="0.8"/>
    <path d="M70 80 C 50 60 40 80 50 90 C 60 100 80 90 70 80 Z" fill="currentColor" stroke="none" opacity="0.8"/>
    <path d="M100 30 C 80 10 70 30 80 40 C 90 50 110 40 100 30 Z" fill="currentColor" stroke="none" opacity="0.8"/>
    
    <path d="M60 150 C 80 140 90 160 80 170 C 70 180 50 160 60 150 Z" fill="currentColor" stroke="none" opacity="0.8"/>
    <path d="M90 100 C 110 90 120 110 110 120 C 100 130 80 110 90 100 Z" fill="currentColor" stroke="none" opacity="0.8"/>
    <path d="M120 50 C 140 40 150 60 140 70 C 130 80 110 60 120 50 Z" fill="currentColor" stroke="none" opacity="0.8"/>
    
    {/* Berries */}
    <circle cx="30" cy="110" r="6" fill="currentColor"/>
    <circle cx="60" cy="60" r="6" fill="currentColor"/>
    <circle cx="90" cy="10" r="6" fill="currentColor"/>
    <circle cx="85" cy="140" r="6" fill="currentColor"/>
    <circle cx="115" cy="90" r="6" fill="currentColor"/>
  </svg>
);
