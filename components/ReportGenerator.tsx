

import React from 'react';
import { CriminalCase, Pillar, DataItem } from '../types';

interface ReportGeneratorProps {
  caseData: CriminalCase;
  updateCase: (updatedCase: CriminalCase) => void;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ caseData, updateCase }) => {
  const handleSuggestionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateCase({ ...caseData, suggestions: e.target.value });
  };
  
  const handlePrint = () => {
    window.print();
  };

  const dataByPillar = (pillar: Pillar) => caseData.data.filter(d => d.pillar === pillar);
  
  const renderVictimData = () => {
    const victimData = dataByPillar(Pillar.Victim);
    if (victimData.length === 0) return null;

    // FIX: Using the generic form of reduce to ensure correct type inference for victimsGrouped.
    const victimsGrouped = victimData.reduce<Record<number, DataItem[]>>((acc, item) => {
      const index = item.victimIndex || 1;
      if (!acc[index]) {
        acc[index] = [];
      }
      acc[index].push(item);
      return acc;
    }, {});

    return Object.entries(victimsGrouped).map(([index, items]) => (
      <div key={`victim-report-${index}`} className="mb-3 pl-4">
        <h5 className="text-md font-semibold italic text-gray-600 dark:text-gray-400 print:text-gray-700">Víctima {index}</h5>
        <ul className="list-none pl-5 mt-2 space-y-2">
          {items.map(d => (
            <li key={d.id} className="flex items-start">
              <span className="font-mono text-sm bg-gray-200 dark:bg-gray-700 print:bg-gray-200 text-gray-800 dark:text-gray-200 print:text-black px-2 py-1 rounded mr-3">{d.code}</span>
              <span>{d.content}</span>
            </li>
          ))}
        </ul>
      </div>
    ));
  };


  return (
    <div>
        <div className="flex justify-end mb-6 no-print">
            <button
                onClick={handlePrint}
                className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 flex items-center"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                </svg>
                Imprimir / Guardar como PDF
            </button>
        </div>

        <div id="report-content" className="bg-white dark:bg-gray-800 p-8 shadow-lg rounded-lg print:shadow-none print:p-0 print:dark:bg-white print:text-black">
            <header className="text-center border-b-2 border-gray-300 dark:border-gray-600 pb-4 mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white print:text-black">Informe de Análisis Criminal</h1>
                <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 print:text-blue-700 mt-2">Método VERA</h2>
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-300 print:text-gray-600">
                    <p><strong>ID de Caso:</strong> {caseData.id}</p>
                    <p><strong>Fecha de Generación:</strong> {new Date().toLocaleString('es-ES')}</p>
                </div>
            </header>

            <section className="mb-10 print-break-inside-avoid">
                <h3 className="text-2xl font-bold border-b border-gray-300 dark:border-gray-500 pb-2 mb-4 text-gray-800 dark:text-gray-100 print:text-black">1. Datos Objetivos Recopilados</h3>
                {[Pillar.Victim, Pillar.Scene, Pillar.Reconstruction, Pillar.Author].map(pillar => (
                    <div key={pillar} className="mb-4 print-break-inside-avoid">
                        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 print:text-black">{pillar}</h4>
                        {pillar === Pillar.Victim ? renderVictimData() : (
                            <ul className="list-none pl-5 mt-2 space-y-2">
                                {dataByPillar(pillar).map(d => (
                                    <li key={d.id} className="flex items-start">
                                        <span className="font-mono text-sm bg-gray-200 dark:bg-gray-700 print:bg-gray-200 text-gray-800 dark:text-gray-200 print:text-black px-2 py-1 rounded mr-3">{d.code}</span>
                                        <span>{d.content}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </section>

            <section className="mb-10 print-break-inside-avoid">
                <h3 className="text-2xl font-bold border-b border-gray-300 dark:border-gray-500 pb-2 mb-4 text-gray-800 dark:text-gray-100 print:text-black">2. Proceso de Inferencia</h3>
                {caseData.inferences.map(inf => (
                    <div key={inf.id} className="mb-6 print-break-inside-avoid">
                        <div className="flex items-start gap-3 bg-gray-100 dark:bg-gray-700/50 print:bg-gray-100 p-3 rounded-md">
                            <span className="font-mono font-bold text-lg text-green-600 dark:text-green-400 print:text-green-700">{inf.code}</span>
                            <p className="font-semibold">{inf.content}</p>
                        </div>
                        <div className="mt-2 pl-10">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 print:text-gray-600 mb-1">Procede de:</p>
                            <ul className="list-none pl-2 border-l-2 border-gray-300 dark:border-gray-600">
                            {inf.sourceDataIds.map(dId => {
                                const data = caseData.data.find(d => d.code === dId);
                                return <li key={dId} className="text-sm pl-2 py-0.5"><span className="font-mono bg-gray-200 dark:bg-gray-600 print:bg-gray-200 px-1.5 rounded text-xs mr-2">{dId}</span>{data?.content}</li>
                            })}
                            </ul>
                        </div>
                    </div>
                ))}
            </section>
            
            <section className="mb-10 print-break-inside-avoid">
                <h3 className="text-2xl font-bold border-b border-gray-300 dark:border-gray-500 pb-2 mb-4 text-gray-800 dark:text-gray-100 print:text-black">3. Elaboración de Hipótesis</h3>
                {caseData.hypotheses.map(hyp => (
                    <div key={hyp.id} className="mb-6 print-break-inside-avoid">
                        <div className="flex items-start gap-3 bg-blue-100 dark:bg-blue-900/50 print:bg-blue-100 p-3 rounded-md">
                            <span className="font-mono font-bold text-lg text-purple-600 dark:text-purple-400 print:text-purple-700">{hyp.code}</span>
                            <p className="font-bold">{hyp.content}</p>
                        </div>
                        <div className="mt-2 pl-10">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 print:text-gray-600 mb-1">Sustentada por:</p>
                             <ul className="list-none pl-2 border-l-2 border-gray-300 dark:border-gray-600">
                            {hyp.sourceInferenceIds.map(iId => {
                                const inf = caseData.inferences.find(i => i.code === iId);
                                return <li key={iId} className="text-sm pl-2 py-0.5"><span className="font-mono bg-gray-200 dark:bg-gray-600 print:bg-gray-200 px-1.5 rounded text-xs mr-2">{iId}</span>{inf?.content}</li>
                            })}
                            </ul>
                        </div>
                    </div>
                ))}
            </section>

            <section className="print-break-inside-avoid">
                <h3 className="text-2xl font-bold border-b border-gray-300 dark:border-gray-500 pb-2 mb-4 text-gray-800 dark:text-gray-100 print:text-black">4. Sugerencias Operativas</h3>
                 <textarea
                    value={caseData.suggestions}
                    onChange={handleSuggestionsChange}
                    placeholder="Añada aquí las sugerencias operativas para orientar la labor de los investigadores..."
                    rows={6}
                    className="w-full bg-yellow-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 no-print"
                />
                <div className="hidden print:block whitespace-pre-wrap p-3 border border-gray-300 rounded-md bg-yellow-50">{caseData.suggestions}</div>
            </section>
            
            <footer className="mt-12 pt-6 border-t-2 border-gray-400 dark:border-gray-600">
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <p className="font-semibold">Analista:</p>
                        <div className="mt-8 border-b border-gray-400"></div>
                    </div>
                     <div>
                        <p className="font-semibold">Fecha y Firma:</p>
                        <div className="mt-8 border-b border-gray-400"></div>
                    </div>
                </div>
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">Informe confidencial generado con el Sistema VERA</p>
            </footer>
        </div>
    </div>
  );
};

export default ReportGenerator;