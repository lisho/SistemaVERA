
import React from 'react';
import { CriminalCase } from '../types';
import Card from './shared/Card';

interface CaseDashboardProps {
  cases: CriminalCase[];
  onNewCase: () => void;
  onSelectCase: (caseId: string) => void;
}

const CaseDashboard: React.FC<CaseDashboardProps> = ({ cases, onNewCase, onSelectCase }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Gestión de Casos</h2>
        <button
          onClick={onNewCase}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Crear Nuevo Caso
        </button>
      </div>
      
      {cases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map(c => (
            <Card key={c.id} onClick={() => onSelectCase(c.id)} className="cursor-pointer hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-400">
              <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">{c.id}</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">{c.title}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-4">Creado: {new Date(c.createdAt).toLocaleDateString('es-ES')}</p>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
            <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-200">No hay casos</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Comience creando un nuevo caso para iniciar el análisis.</p>
            </div>
        </Card>
      )}
    </div>
  );
};

export default CaseDashboard;
