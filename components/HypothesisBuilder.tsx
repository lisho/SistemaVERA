
import React, { useState } from 'react';
import { CriminalCase, Inference, Hypothesis } from '../types';
import Card from './shared/Card';

interface HypothesisBuilderProps {
  caseData: CriminalCase;
  updateCase: (updatedCase: CriminalCase) => void;
}

const HypothesisBuilder: React.FC<HypothesisBuilderProps> = ({ caseData, updateCase }) => {
  const [selectedInferenceIds, setSelectedInferenceIds] = useState<string[]>([]);
  const [hypothesisContent, setHypothesisContent] = useState('');

  const toggleInferenceSelection = (id: string) => {
    setSelectedInferenceIds(prev =>
      prev.includes(id) ? prev.filter(infId => infId !== id) : [...prev, id]
    );
  };

  const handleAddHypothesis = (e: React.FormEvent) => {
    e.preventDefault();
    if (hypothesisContent.trim() === '' || selectedInferenceIds.length === 0) return;

    const nextIdNumber = (caseData.hypotheses.map(h => parseInt(h.code.replace('H',''))).reduce((a,b) => Math.max(a,b), 0) || 0) + 1;
    const newHypothesis: Hypothesis = {
      id: `HYP-${Date.now()}`,
      code: `H${nextIdNumber}`,
      content: hypothesisContent.trim(),
      sourceInferenceIds: selectedInferenceIds,
    };

    updateCase({
      ...caseData,
      hypotheses: [...caseData.hypotheses, newHypothesis],
    });

    setHypothesisContent('');
    setSelectedInferenceIds([]);
  };

  const handleDeleteHypothesis = (hypothesisId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta hipótesis?')) {
        const updatedHypotheses = caseData.hypotheses.filter(hyp => hyp.id !== hypothesisId);
        updateCase({ ...caseData, hypotheses: updatedHypotheses });
    }
  };
  
  const getInferenceByCode = (code: string): Inference | undefined => {
    return caseData.inferences.find(i => i.code === code);
  }


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Inference Selection */}
      <Card>
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">1. Seleccionar Inferencias</h3>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
          {caseData.inferences.length > 0 ? caseData.inferences.map(item => (
            <div
              key={item.id}
              onClick={() => toggleInferenceSelection(item.code)}
              className={`p-3 rounded-md flex items-start gap-3 cursor-pointer transition-all duration-200 ${
                selectedInferenceIds.includes(item.code)
                  ? 'bg-blue-200 dark:bg-blue-900/70 ring-2 ring-blue-500'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedInferenceIds.includes(item.code)}
                readOnly
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="font-mono font-bold text-sm text-green-600 dark:text-green-400">{item.code}</span>
              <p className="text-gray-800 dark:text-gray-200">{item.content}</p>
            </div>
          )) : <p className="text-sm text-gray-500 dark:text-gray-400 italic">No hay inferencias disponibles. Créelas en la Fase 2.</p>}
        </div>
      </Card>

      {/* Right Column: Hypothesis Creation & List */}
      <div className="space-y-8">
        <Card>
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">2. Formular Hipótesis</h3>
          <form onSubmit={handleAddHypothesis}>
            <textarea
              value={hypothesisContent}
              onChange={(e) => setHypothesisContent(e.target.value)}
              placeholder="Escriba la hipótesis basada en las inferencias seleccionadas..."
              rows={4}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={selectedInferenceIds.length === 0 || hypothesisContent.trim() === ''}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Crear Hipótesis
            </button>
          </form>
        </Card>
        
        <Card>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Hipótesis Creadas</h3>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                {caseData.hypotheses.length > 0 ? caseData.hypotheses.map(hyp => (
                    <div key={hyp.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-grow min-w-0">
                                <span className="font-mono font-bold text-lg text-purple-600 dark:text-purple-400 flex-shrink-0">{hyp.code}</span>
                                <p className="text-gray-900 dark:text-gray-100 break-words">{hyp.content}</p>
                            </div>
                            <button 
                                onClick={() => handleDeleteHypothesis(hyp.id)} 
                                className="p-1 text-gray-500 hover:text-red-600 flex-shrink-0" 
                                aria-label={`Eliminar hipótesis ${hyp.code}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                        <div className="mt-3 pl-8 border-l-2 border-gray-300 dark:border-gray-600 ml-3">
                           <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Sustentada por:</p>
                           {hyp.sourceInferenceIds.map(infCode => {
                               const infItem = getInferenceByCode(infCode);
                               return (
                                <div key={infCode} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-1">
                                    <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">{infCode}</span>
                                    <span className="truncate">{infItem?.content}</span>
                                </div>
                               )
                           })}
                        </div>
                    </div>
                )) : <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">No hay hipótesis creadas.</p>}
            </div>
        </Card>
      </div>
    </div>
  );
};

export default HypothesisBuilder;
