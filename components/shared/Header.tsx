
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md no-print">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sistema VERA
            </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Análisis Psicológico del Delito</p>
      </div>
    </header>
  );
};

export default Header;
