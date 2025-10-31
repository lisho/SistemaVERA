
export enum Pillar {
  Victim = 'Víctima',
  Scene = 'Escena',
  Reconstruction = 'Reconstrucción',
  Author = 'Autor',
}

export interface DataItem {
  id: string;
  pillar: Pillar;
  code: string;
  content: string;
  victimIndex?: number;
}

export interface Inference {
  id: string;
  code: string;
  content: string;
  sourceDataIds: string[];
}

export interface Hypothesis {
  id: string;
  code: string;
  content: string;
  sourceInferenceIds: string[];
}

export interface CriminalCase {
  id: string;
  title: string;
  createdAt: string;
  data: DataItem[];
  inferences: Inference[];
  hypotheses: Hypothesis[];
  suggestions: string;
}