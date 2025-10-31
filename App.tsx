
import React, { useState, useCallback } from 'react';
import { CriminalCase } from './types';
import CaseDashboard from './components/CaseDashboard';
import CaseView from './components/CaseView';
import Header from './components/shared/Header';

const App: React.FC = () => {
  const [cases, setCases] = useState<CriminalCase[]>([]);
  const [activeCase, setActiveCase] = useState<CriminalCase | null>(null);

  const createNewCase = useCallback(() => {
    const newCase: CriminalCase = {
      id: `CASO-${Date.now()}`,
      title: `Nuevo Caso - ${new Date().toLocaleString('es-ES')}`,
      createdAt: new Date().toISOString(),
      data: [],
      inferences: [],
      hypotheses: [],
      suggestions: '',
    };
    setCases(prevCases => [...prevCases, newCase]);
    setActiveCase(newCase);
  }, []);

  const selectCase = useCallback((caseId: string) => {
    const selected = cases.find(c => c.id === caseId);
    if (selected) {
      setActiveCase(selected);
    }
  }, [cases]);

  const updateCase = useCallback((updatedCase: CriminalCase) => {
    setActiveCase(updatedCase);
    setCases(prevCases => prevCases.map(c => c.id === updatedCase.id ? updatedCase : c));
  }, []);
  
  const goBackToDashboard = () => {
    setActiveCase(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      <Header />
      <main className="p-4 sm:p-6 md:p-8">
        {activeCase ? (
          <CaseView 
            caseData={activeCase} 
            updateCase={updateCase} 
            onBack={goBackToDashboard}
          />
        ) : (
          <CaseDashboard 
            cases={cases} 
            onNewCase={createNewCase} 
            onSelectCase={selectCase} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
