import React, { useState } from 'react';
import { CriminalCase } from '../types';
import DataCollection from './DataCollection';
import InferenceBuilder from './InferenceBuilder';
import HypothesisBuilder from './HypothesisBuilder';
import ReportGenerator from './ReportGenerator';

type Tab = 'data' | 'inferences' | 'hypotheses' | 'report';

interface CaseViewProps {
  caseData: CriminalCase;
  updateCase: (updatedCase: CriminalCase) => void;
  onBack: () => void;
}

const CaseView: React.FC<CaseViewProps> = ({ caseData, updateCase, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('data');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'data':
        return <DataCollection caseData={caseData} updateCase={updateCase} />;
      case 'inferences':
        return <InferenceBuilder caseData={caseData} updateCase={updateCase} />;
      case 'hypotheses':
        return <HypothesisBuilder caseData={caseData} updateCase={updateCase} />;
      case 'report':
        return <ReportGenerator caseData={caseData} updateCase={updateCase} />;
      default:
        return null;
    }
  };

  // FIX: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
  const TabButton = ({ tab, label, icon }: { tab: Tab, label: string, icon: React.ReactElement }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
        activeTab === tab 
          ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
      }`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4 no-print">
        <div>
          <button onClick={onBack} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Volver al panel
          </button>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mt-1">{caseData.id}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{caseData.title}</p>
        </div>
      </div>
      
      <div className="border-b border-gray-200 dark:border-gray-700 no-print">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          <TabButton tab="data" label="1. Recopilación de Datos" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
          <TabButton tab="inferences" label="2. Realización de Inferencias" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
          <TabButton tab="hypotheses" label="3. Elaboración de Hipótesis" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>} />
          <TabButton tab="report" label="Informe y Sugerencias" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>} />
        </nav>
      </div>
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default CaseView;
