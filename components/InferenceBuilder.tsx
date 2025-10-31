
import React, { useState } from 'react';
import { CriminalCase, DataItem, Inference } from '../types';
import Card from './shared/Card';

interface InferenceBuilderProps {
  caseData: CriminalCase;
  updateCase: (updatedCase: CriminalCase) => void;
}

const InferenceBuilder: React.FC<InferenceBuilderProps> = ({ caseData, updateCase }) => {
  const [selectedDataIds, setSelectedDataIds] = useState<string[]>([]);
  const [inferenceContent, setInferenceContent] = useState('');

  const toggleDataSelection = (id: string) => {
    setSelectedDataIds(prev =>
      prev.includes(id) ? prev.filter(dataId => dataId !== id) : [...prev, id]
    );
  };

  const handleAddInference = (e: React.FormEvent) => {
    e.preventDefault();
    if (inferenceContent.trim() === '' || selectedDataIds.length === 0) return;

    const nextIdNumber = (caseData.inferences.map(i => parseInt(i.code.replace('I',''))).reduce((a,b) => Math.max(a,b), 0) || 0) + 1;
    const newInference: Inference = {
      id: `INF-${Date.now()}`,
      code: `I${nextIdNumber}`,
      content: inferenceContent.trim(),
      sourceDataIds: selectedDataIds,
    };

    updateCase({
      ...caseData,
      inferences: [...caseData.inferences, newInference],
    });

    setInferenceContent('');
    setSelectedDataIds([]);
  };

  const handleDeleteInference = (inferenceId: string) => {
    const inferenceToDelete = caseData.inferences.find(inf => inf.id === inferenceId);
    if (!inferenceToDelete) return;

    const isUsedInHypothesis = caseData.hypotheses.some(hyp => hyp.sourceInferenceIds.includes(inferenceToDelete.code));
    
    let confirmMessage = '¿Está seguro de que desea eliminar esta inferencia?';
    if (isUsedInHypothesis) {
      confirmMessage = 'ADVERTENCIA: Esta inferencia es utilizada por al menos una hipótesis. Si la elimina, el enlace se romperá. ¿Desea continuar?';
    }

    if (window.confirm(confirmMessage)) {
      const updatedInferences = caseData.inferences.filter(inf => inf.id !== inferenceId);
      updateCase({ ...caseData, inferences: updatedInferences });
    }
  };

  const getDataItemByCode = (code: string): DataItem | undefined => {
    return caseData.data.find(d => d.code === code);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Data Selection */}
      <Card>
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">1. Seleccionar Datos Objetivos</h3>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
          {caseData.data.length > 0 ? caseData.data.map(item => (
            <div
              key={item.id}
              onClick={() => toggleDataSelection(item.code)}
              className={`p-3 rounded-md flex items-start gap-3 cursor-pointer transition-all duration-200 ${
                selectedDataIds.includes(item.code)
                  ? 'bg-blue-200 dark:bg-blue-900/70 ring-2 ring-blue-500'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedDataIds.includes(item.code)}
                readOnly
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="font-mono font-bold text-sm text-gray-700 dark:text-gray-300">{item.code}</span>
              <p className="text-gray-800 dark:text-gray-200">{item.content}</p>
            </div>
          )) : <p className="text-sm text-gray-500 dark:text-gray-400 italic">No hay datos disponibles. Añada datos en la Fase 1.</p>}
        </div>
      </Card>

      {/* Right Column: Inference Creation & List */}
      <div className="space-y-8">
        <Card>
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">2. Formular Inferencia</h3>
          <form onSubmit={handleAddInference}>
            <textarea
              value={inferenceContent}
              onChange={(e) => setInferenceContent(e.target.value)}
              placeholder="Escriba la inferencia basada en los datos seleccionados..."
              rows={4}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={selectedDataIds.length === 0 || inferenceContent.trim() === ''}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Crear Inferencia
            </button>
          </form>
        </Card>

        <Card>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Inferencias Creadas</h3>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                {caseData.inferences.length > 0 ? caseData.inferences.map(inf => (
                    <div key={inf.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-grow min-w-0">
                                <span className="font-mono font-bold text-lg text-green-600 dark:text-green-400 flex-shrink-0">{inf.code}</span>
                                <p className="text-gray-900 dark:text-gray-100 break-words">{inf.content}</p>
                            </div>
                            <button 
                                onClick={() => handleDeleteInference(inf.id)} 
                                className="p-1 text-gray-500 hover:text-red-600 flex-shrink-0" 
                                aria-label={`Eliminar inferencia ${inf.code}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                        <div className="mt-3 pl-8 border-l-2 border-gray-300 dark:border-gray-600 ml-3">
                           <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Procede de:</p>
                           {inf.sourceDataIds.map(dataCode => {
                               const dataItem = getDataItemByCode(dataCode);
                               return (
                                <div key={dataCode} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-1">
                                    <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">{dataCode}</span>
                                    <span className="truncate">{dataItem?.content}</span>
                                </div>
                               )
                           })}
                        </div>
                    </div>
                )) : <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">No hay inferencias creadas.</p>}
            </div>
        </Card>
      </div>
    </div>
  );
};

export default InferenceBuilder;
