import React from 'react';

const Navigation = () => {
  return (
    <div className="max-w-7xl mx-auto flex items-center justify-center h-16 px-4 sm:px-6 lg:px-8">
      {/* Logo */}
      <a href="/" aria-label="go to app" className="flex items-center">
        <span className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent select-none">
          JobSmartly
        </span>
      </a>
    </div>
  );
};

export default Navigation; 