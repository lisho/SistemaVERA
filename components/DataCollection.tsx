import React, { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { CriminalCase, Pillar, DataItem } from '../types';
import Card from './shared/Card';

interface DataCollectionProps {
  caseData: CriminalCase;
  updateCase: (updatedCase: CriminalCase) => void;
}

const PILLAR_CONFIG = {
  [Pillar.Victim]: { prefix: 'DV', color: 'red', label: 'Víctima', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> },
  [Pillar.Scene]: { prefix: 'DE', color: 'green', label: 'Escena', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-6-6m6 6v-4.5m0 4.5h-4.5M3 3l6 6M3 3v4.5M3 3h4.5M12 12l6 6m-6-6-6-6"/></svg> },
  [Pillar.Reconstruction]: { prefix: 'DR', color: 'yellow', label: 'Reconstrucción', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-1.141-1.424l-7.104 2.536-7.104-2.536A1 1 0 0 0 4.685 6.812l7.103 2.536 7.386-2.536Z"></path><path d="m12 17.613-7.315-2.613A1 1 0 0 0 3.826 16.4l7.104 2.536 7.103-2.536a1 1 0 0 0-.862-1.4l-7.104 2.613Z"></path><path d="m12 12.613-7.315-2.613A1 1 0 0 0 3.826 11.4l7.104 2.536 7.103-2.536a1 1 0 0 0-.862-1.4l-7.104 2.613Z"></path></svg> },
  [Pillar.Author]: { prefix: 'DA', color: 'purple', label: 'Autor', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2"></path><path d="M12 21v2"></path><path d="m4.22 4.22 1.42 1.42"></path><path d="m18.36 18.36 1.42 1.42"></path><path d="M1 12h2"></path><path d="M21 12h2"></path><path d="m4.22 19.78 1.42-1.42"></path><path d="m18.36 5.64 1.42-1.42"></path></svg> },
};

const PILLAR_COLORS = {
    red: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-600 dark:text-red-300', ring: 'ring-red-500' },
    green: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-600 dark:text-green-300', ring: 'ring-green-500' },
    yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-600 dark:text-yellow-300', ring: 'ring-yellow-500' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-600 dark:text-purple-300', ring: 'ring-purple-500' },
};

// Componente de la Ficha/Modal que contiene toda la lógica de edición
const PillarEditor: React.FC<{ 
    pillar: Pillar, 
    caseData: CriminalCase, 
    updateCase: (updatedCase: CriminalCase) => void,
    activeVictimIndex: number | null,
    closeModal: () => void,
}> = ({ pillar, caseData, updateCase, activeVictimIndex, closeModal }) => {

  // Componente interno para una sola ficha de datos (ya sea una víctima o un pilar genérico)
  const DataInputCard: React.FC<{ pillar: Pillar, victimIndex?: number }> = ({ pillar, victimIndex }) => {
    const [inputVariable, setInputVariable] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [aiInputText, setAiInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<DataItem | null>(null);
    const [editingVariable, setEditingVariable] = useState('');
    const [editingValue, setEditingValue] = useState('');
    const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
    
    const [generatedProfile, setGeneratedProfile] = useState('');
    const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const config = PILLAR_CONFIG[pillar];
    const isVictim = pillar === Pillar.Victim;
    const pillarData = useMemo(() => caseData.data.filter(d => 
        isVictim ? (d.pillar === pillar && d.victimIndex === victimIndex) : d.pillar === pillar
    ).sort((a,b) => {
        const numA = parseInt(a.code.split('-').pop() || '0');
        const numB = parseInt(b.code.split('-').pop() || '0');
        return numA - numB;
    }), [caseData.data, pillar, victimIndex, isVictim]);

    const getNextId = () => {
        const existingIds = pillarData.map(d => {
            const parts = d.code.split('-');
            return parts.length > 1 ? parseInt(parts[parts.length - 1], 10) : NaN;
        }).filter(n => !isNaN(n));
        return (existingIds.length > 0 ? Math.max(...existingIds) : 0) + 1;
    };

    const handleAddDataManual = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputVariable.trim() === '' || inputValue.trim() === '') return;
        const nextIdNumber = getNextId();
        const code = isVictim ? `DV${victimIndex}-${nextIdNumber}` : `${config.prefix}-${nextIdNumber}`;
        const newDataItem: DataItem = {
            id: code,
            pillar,
            code,
            content: `${inputVariable.trim()}: ${inputValue.trim()}`,
            ...(isVictim && { victimIndex })
        };
        updateCase({ ...caseData, data: [...caseData.data, newDataItem] });
        setInputVariable('');
        setInputValue('');
    };

    const handleAiBreakdown = async () => {
        if (aiInputText.trim() === '') return;
        setIsLoading(true);
        setError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const sanitizationResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Eres un analista criminal experto. Reescribe el siguiente texto para que sea objetivo, neutral y anonimizado. Elimina nombres propios, direcciones, y detalles gráficos explícitos, usando placeholders genéricos (ej. 'la víctima'). El objetivo es preparar el texto para un análisis de IA sin activar filtros de contenido sensible. Tu única salida debe ser el texto reescrito. Texto original: "${aiInputText}"`,
            });
            const sanitizedText = sanitizationResponse.text;
            if (!sanitizedText || sanitizationResponse.promptFeedback?.blockReason) {
              setError("No se pudo reformular el texto. Por favor, revise el contenido original y vuelva a intentarlo.");
              return;
            }

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Eres un analista criminal VERA. Extrae puntos de datos objetivos del siguiente texto sobre '${config.label}'. Enumera cada hecho como un par clave-valor (variable, valor). No infieras, solo extrae hechos. Texto: "${sanitizedText}"`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                variable: { type: Type.STRING, description: 'Etiqueta concisa.' },
                                valor: { type: Type.STRING, description: 'El dato específico.' },
                            },
                            required: ['variable', 'valor'],
                        },
                    },
                },
            });

            const text = response.text;
            if (!text) {
                const blockReason = response.promptFeedback?.blockReason;
                setError(blockReason ? "El análisis fue bloqueado. Revise el texto para que sea más objetivo." : "La respuesta de la IA estaba vacía.");
                return;
            }

            const extractedData = JSON.parse(text.trim());
            if (extractedData?.length > 0) {
                const baseId = getNextId() - 1;
                const newItems: DataItem[] = extractedData.map((item: {variable: string, valor: string}, index: number) => {
                    const currentIdNumber = baseId + index + 1;
                    const code = isVictim ? `DV${victimIndex}-${currentIdNumber}` : `${config.prefix}-${currentIdNumber}`;
                    return {
                        id: code,
                        pillar,
                        code,
                        content: `${item.variable}: ${item.valor}`,
                        ...(isVictim && { victimIndex })
                    };
                });
                updateCase({ ...caseData, data: [...caseData.data, ...newItems] });
                setAiInputText('');
            }
        } catch (e) {
            console.error("Error processing with AI:", e);
            setError("No se pudieron procesar los datos. Compruebe el formato o inténtelo de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const confirmDeleteItem = (itemId: string) => {
        const itemToDelete = caseData.data.find(item => item.id === itemId);
        if (!itemToDelete) return;
    
        const { pillar, victimIndex } = itemToDelete;
        const config = PILLAR_CONFIG[pillar];
        const isVictim = pillar === Pillar.Victim;
    
        const groupItems = caseData.data.filter(d => 
            isVictim ? (d.pillar === pillar && d.victimIndex === victimIndex) : d.pillar === pillar
        );
        const otherItems = caseData.data.filter(d => 
            isVictim ? (d.pillar !== pillar || d.victimIndex !== victimIndex) : d.pillar !== pillar
        );
    
        const remainingGroupItems = groupItems.filter(item => item.id !== itemId);
    
        const sortedItems = [...remainingGroupItems].sort((a, b) => {
            const numA = parseInt(a.code.split('-').pop() || '0', 10);
            const numB = parseInt(b.code.split('-').pop() || '0', 10);
            return numA - numB;
        });
    
        const codeChangeMap: { [oldCode: string]: string } = {};
        const reindexedItems = sortedItems.map((item, index) => {
            const newNumericId = index + 1;
            const newCode = isVictim ? `DV${victimIndex}-${newNumericId}` : `${config.prefix}-${newNumericId}`;
            
            if (item.code !== newCode) {
                codeChangeMap[item.code] = newCode;
            }
            
            return { ...item, id: newCode, code: newCode };
        });
    
        const updatedInferences = caseData.inferences.map(inference => {
            const newSourceDataIds = inference.sourceDataIds
                .filter(id => id !== itemToDelete.code)
                .map(id => codeChangeMap[id] || id);
    
            return { ...inference, sourceDataIds: newSourceDataIds };
        });
    
        const updatedData = [...otherItems, ...reindexedItems];
    
        updateCase({ 
            ...caseData, 
            data: updatedData,
            inferences: updatedInferences
        });
        
        setDeletingItemId(null);
    };

    const handleStartEdit = (item: DataItem) => {
        setEditingItem(item);
        const [variable, ...valueParts] = item.content.split(':');
        setEditingVariable(variable);
        setEditingValue(valueParts.join(':').trim());
    };

    const handleCancelEdit = () => setEditingItem(null);

    const handleSaveEdit = () => {
        if (!editingItem) return;
        const updatedData = caseData.data.map(item =>
            item.id === editingItem.id ? { ...item, content: `${editingVariable.trim()}: ${editingValue.trim()}` } : item
        );
        updateCase({ ...caseData, data: updatedData });
        handleCancelEdit();
    };
    
    const handleGenerateProfile = async () => {
        if (pillarData.length < 3) {
            setProfileError("Se necesitan al menos 3 datos para generar un perfil significativo.");
            return;
        }
        setIsGeneratingProfile(true);
        setProfileError(null);
        setGeneratedProfile('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const dataForProfile = pillarData.map(d => `${d.code}: ${d.content}`).join('\n');
            
            const prompt = `
                Eres un psicólogo criminal y analista de perfiles VERA experto.
                Sintetiza los siguientes datos objetivos sobre una víctima en un perfil psicológico narrativo y coherente.
                Este perfil debe enfocarse en la personalidad, estilo de vida, relaciones, vulnerabilidades y cualquier patrón de comportamiento relevante.
                Basa tu análisis única y exclusivamente en los datos proporcionados. No inventes información ni hagas suposiciones que no estén directamente respaldadas por los hechos listados.
                La salida debe ser un texto redactado en prosa, bien estructurado.

                Datos objetivos:
                ${dataForProfile}
            `;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-pro",
                contents: prompt,
            });
            
            const text = response.text;
            if (!text) {
                 const blockReason = response.promptFeedback?.blockReason;
                 setProfileError(blockReason ? "La generación fue bloqueada por filtros de contenido." : "La respuesta de la IA estaba vacía.");
                 return;
            }

            setGeneratedProfile(text);
        } catch (e) {
            console.error("Error generating profile:", e);
            setProfileError("Ocurrió un error al generar el perfil. Por favor, inténtelo de nuevo.");
        } finally {
            setIsGeneratingProfile(false);
        }
    };

    const colorClasses = PILLAR_COLORS[config.color as keyof typeof PILLAR_COLORS];

    const ViewToggle = () => (
      <div className="flex items-center space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
          <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'cards' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          </button>
          <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
          </button>
      </div>
    );

    const renderActionButtons = (item: DataItem) => {
        const isDeleting = deletingItemId === item.id;
        return (
            isDeleting ? (
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-red-500 font-semibold">¿Seguro?</span>
                    <button onClick={() => confirmDeleteItem(item.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs">Sí</button>
                    <button onClick={() => setDeletingItemId(null)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-2 rounded text-xs">No</button>
                </div>
            ) : (
                <>
                    <button onClick={() => handleStartEdit(item)} className="p-1 text-gray-500 hover:text-blue-600" aria-label={`Editar ${item.code}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg></button>
                    <button onClick={() => setDeletingItemId(item.id)} className="p-1 text-gray-500 hover:text-red-600" aria-label={`Eliminar ${item.code}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </>
            )
        );
    };

    return (
        <Card className={`mb-6 ${isVictim ? 'border-l-4 border-red-500' : ''}`}>
            <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Desglose con IA</label>
                    <textarea value={aiInputText} onChange={(e) => setAiInputText(e.target.value)} placeholder={`Pegue aquí un bloque de texto sobre ${isVictim ? `la Víctima ${victimIndex}`: `'${config.label}'`}...`} rows={4} disabled={isLoading} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" />
                    <button onClick={handleAiBreakdown} disabled={isLoading || aiInputText.trim() === ''} className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
                        {isLoading ? 'Procesando...' : "Desglosar con IA"}
                    </button>
                    {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
                </div>
                <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div><div className="relative flex justify-center"><span className="bg-white dark:bg-gray-800 px-2 text-sm text-gray-500 dark:text-gray-400">O</span></div></div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entrada Manual</label>
                    <form onSubmit={handleAddDataManual} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        <input type="text" value={inputVariable} onChange={(e) => setInputVariable(e.target.value)} placeholder="Variable" className="sm:col-span-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Valor" className="sm:col-span-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button type="submit" className="sm:col-span-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">Añadir</button>
                    </form>
                </div>
            </div>
            <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">Datos Registrados</h4>
                     <div className="flex items-center gap-2">
                        {isVictim && pillarData.length > 0 && (
                            <button onClick={handleGenerateProfile} disabled={isGeneratingProfile} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-3 rounded-md text-sm transition duration-300 disabled:bg-gray-400 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                                {isGeneratingProfile ? 'Generando...' : 'Generar Perfil'}
                            </button>
                        )}
                        {pillarData.length > 0 && <ViewToggle />}
                    </div>
                </div>
                
                {isVictim && (profileError || generatedProfile || isGeneratingProfile) && (
                  <div className="mb-6">
                    {profileError && <p className="text-sm text-red-500 mt-1">{profileError}</p>}
                    {isGeneratingProfile && <p className="text-sm text-blue-500 italic py-4 text-center">Analizando datos para construir el perfil...</p>}
                    {generatedProfile && (
                      <Card className="bg-blue-50 dark:bg-blue-900/40 border-l-4 border-blue-500">
                        <h5 className="text-md font-semibold text-blue-800 dark:text-blue-200 mb-2">Perfil Psicológico de la Víctima</h5>
                        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed font-sans">
                          {generatedProfile}
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                <div className="max-h-80 overflow-y-auto pr-2 -mr-2">
                    {pillarData.length > 0 ? (
                      viewMode === 'cards' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {pillarData.map(item => {
                            const isEditing = editingItem?.id === item.id;
                            const [variable, ...valueParts] = item.content.split(':');
                            const value = valueParts.join(':').trim();
                            return(
                              <div key={item.id} className={`p-3 rounded-md ${colorClasses.bg}`}>
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <input type="text" value={editingVariable} onChange={(e) => setEditingVariable(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md px-3 py-1 text-sm"/>
                                        <textarea value={editingValue} onChange={(e) => setEditingValue(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md px-3 py-1 text-sm" rows={2}/>
                                        <div className="flex items-center space-x-2 justify-end">
                                            <button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md text-sm">Guardar</button>
                                            <button onClick={handleCancelEdit} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded-md text-sm">Cancelar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full">
                                        <div className="flex justify-between items-start">
                                            <span className="font-mono font-bold text-sm text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-black/20 px-2 py-1 rounded flex-shrink-0">{item.code}</span>
                                            <div className="flex-shrink-0 flex items-center space-x-1 -mr-1">
                                                {renderActionButtons(item)}
                                            </div>
                                        </div>
                                        <div className="mt-2 flex-grow">
                                            <p className="font-semibold text-gray-700 dark:text-gray-300 break-words">{variable}</p>
                                            <p className="text-gray-800 dark:text-gray-200 break-words text-sm">{value}</p>
                                        </div>
                                    </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="space-y-2">
                            {pillarData.map(item => {
                                const isEditing = editingItem?.id === item.id;
                                const [variable, ...valueParts] = item.content.split(':');
                                const value = valueParts.join(':').trim();
                                return (
                                    <div key={item.id} className={`p-3 rounded-md ${colorClasses.bg}`}>
                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    <input type="text" value={editingVariable} onChange={(e) => setEditingVariable(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md px-3 py-2"/>
                                                    <input type="text" value={editingValue} onChange={(e) => setEditingValue(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md px-3 py-2" />
                                                </div>
                                                <div className="flex items-center space-x-2 justify-end">
                                                    <button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md text-sm">Guardar</button>
                                                    <button onClick={handleCancelEdit} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded-md text-sm">Cancelar</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between gap-3 w-full">
                                                <div className="flex items-start gap-3 flex-grow min-w-0">
                                                    <span className="font-mono font-bold text-sm text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-black/20 px-2 py-1 rounded flex-shrink-0">{item.code}</span>
                                                    <p className="text-gray-800 dark:text-gray-200 break-words flex-1">
                                                        <strong className="font-semibold text-gray-700 dark:text-gray-300">{variable}:</strong> {value}
                                                    </p>
                                                </div>
                                                <div className="flex-shrink-0 flex items-center space-x-1">
                                                    {renderActionButtons(item)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                      )
                    ) : <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">No hay datos registrados.</p>}
                </div>
            </div>
        </Card>
    );
  }

  // Renderiza el contenido del editor según el pilar
  if (pillar === Pillar.Victim) {
      if (activeVictimIndex) {
          return (
              <div>
                   <button onClick={closeModal} className="mb-4 text-blue-600 dark:text-blue-400 hover:underline flex items-center text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Volver al panel
                  </button>
                  <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Gestionando Víctima {activeVictimIndex}</h3>
                  <DataInputCard key={activeVictimIndex} pillar={Pillar.Victim} victimIndex={activeVictimIndex} />
              </div>
          );
      }
      return <p>Error: No se especificó ninguna víctima para editar.</p>;
  }
  
  return <DataInputCard pillar={pillar} />;
};

const VictimSelectionPanel: React.FC<{
    caseData: CriminalCase;
    onSelectVictim: (index: number) => void;
    onAddVictim: () => void;
}> = ({ caseData, onSelectVictim, onAddVictim }) => {
    const victimIndices = useMemo(() => {
        const indices = new Set(caseData.data.filter(d => d.pillar === Pillar.Victim && d.victimIndex != null).map(d => d.victimIndex as number));
        return Array.from(indices).sort((a, b) => a - b);
    }, [caseData.data]);

    return (
        <div className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 gap-3">
                {victimIndices.map(index => {
                    const dataCount = caseData.data.filter(d => d.pillar === Pillar.Victim && d.victimIndex === index).length;
                    return (
                        <div key={index} onClick={() => onSelectVictim(index)} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg cursor-pointer border-2 border-transparent hover:border-red-500 transition-colors duration-200 flex flex-col justify-center items-center text-center h-28">
                            <div className="text-red-600 dark:text-red-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </div>
                            <p className="font-bold text-md mt-1 text-gray-800 dark:text-gray-200">Víctima {index}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{dataCount} dato(s)</p>
                        </div>
                    );
                })}
                <div onClick={onAddVictim} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg cursor-pointer border-2 border-dashed border-gray-400 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors duration-200 flex flex-col justify-center items-center text-center h-28 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    <p className="font-semibold text-sm mt-1">Añadir Víctima</p>
                </div>
            </div>
        </div>
    );
};


// Componente principal que muestra las fichas y gestiona el modal
const DataCollection: React.FC<DataCollectionProps> = ({ caseData, updateCase }) => {
  const [modalPillar, setModalPillar] = useState<Pillar | null>(null);
  const [activeVictimIndex, setActiveVictimIndex] = useState<number | null>(null);

  const handleSelectVictim = (index: number) => {
    setActiveVictimIndex(index);
    setModalPillar(Pillar.Victim);
  };

  const handleAddVictim = () => {
    const victimIndices = new Set(caseData.data.filter(d => d.pillar === Pillar.Victim && d.victimIndex != null).map(d => d.victimIndex as number));
    const newIndex = (victimIndices.size > 0 ? Math.max(...Array.from(victimIndices)) : 0) + 1;
    setActiveVictimIndex(newIndex);
    setModalPillar(Pillar.Victim);
  };

  const PillarCardComponent = ({ pillar }: { pillar: Pillar }) => {
      const config = PILLAR_CONFIG[pillar];
      const colorClasses = PILLAR_COLORS[config.color as keyof typeof PILLAR_COLORS];
      const isVictimCard = pillar === Pillar.Victim;

      const victimDataCount = useMemo(() => {
          const victimIndices = new Set(caseData.data.filter(d => d.pillar === Pillar.Victim && d.victimIndex != null).map(d => d.victimIndex));
          return victimIndices.size;
      }, [caseData.data]);
      const victimTotalDataPoints = caseData.data.filter(d => d.pillar === Pillar.Victim).length;

      return (
          <div className={`rounded-lg p-5 shadow-md flex flex-col justify-between transition-all duration-300 border-2 border-transparent ${colorClasses.bg} bg-white dark:bg-gray-800 ${isVictimCard ? 'lg:col-span-4' : 'lg:col-span-2'}`}>
              <div>
                  <div className={`flex items-center gap-4 ${colorClasses.text}`}>
                      {config.icon}
                      <h3 className="text-2xl font-bold">{config.label}</h3>
                  </div>
                   {isVictimCard ? (
                     <>
                        <p className="mt-4 text-gray-600 dark:text-gray-300">
                          {victimDataCount} víctima(s) con {victimTotalDataPoints} datos.
                        </p>
                        <VictimSelectionPanel caseData={caseData} onSelectVictim={handleSelectVictim} onAddVictim={handleAddVictim} />
                     </>
                  ) : (
                     <>
                        <p className="mt-4 text-gray-600 dark:text-gray-300">
                            {`${caseData.data.filter(d => d.pillar === pillar).length} datos registrados.`}
                        </p>
                        <button onClick={() => setModalPillar(pillar)} className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200">
                            Gestionar
                        </button>
                     </>
                  )}
              </div>
          </div>
      );
  };
  
  const closeModal = () => {
      setModalPillar(null);
      setActiveVictimIndex(null);
  };

  const PillarModal = ({ isOpen, onClose, pillar }: { isOpen: boolean, onClose: () => void, pillar: Pillar | null }) => {
      if (!isOpen || !pillar) return null;
      const config = PILLAR_CONFIG[pillar];
      return (
          <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={onClose}>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                  <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                      <div className="flex items-center gap-3">
                        <span className={PILLAR_COLORS[config.color as keyof typeof PILLAR_COLORS].text}>{config.icon}</span>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{config.label}</h2>
                      </div>
                      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full p-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </header>
                  <main className="overflow-y-auto p-6">
                      <PillarEditor 
                        pillar={pillar} 
                        caseData={caseData} 
                        updateCase={updateCase} 
                        activeVictimIndex={activeVictimIndex}
                        closeModal={onClose}
                      />
                  </main>
              </div>
          </div>
      );
  };
  
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <PillarCardComponent pillar={Pillar.Victim} />
          <PillarCardComponent pillar={Pillar.Scene} />
          <PillarCardComponent pillar={Pillar.Reconstruction} />
          <PillarCardComponent pillar={Pillar.Author} />
      </div>
      <PillarModal
        isOpen={!!modalPillar}
        onClose={closeModal}
        pillar={modalPillar}
      />
    </>
  );
};

export default DataCollection;