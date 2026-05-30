// D0 Data Viz — World Line Types

export type EventType = 'arrival' | 'encounter' | 'conflict' | 'ritual';
export type ObservationState = 'psi' | 'observed';

export interface WorldLineCharacter {
  id: string;
  label: string;
  color: string;
}

export interface WorldLineEvent {
  id: string;
  label: string[];
  type: EventType;
  eraIndex: number;
  description: string;
  attendance: Record<string, ObservationState>;
  placeLabel?: string;
}

export interface WorldLineEra {
  label: string;
  xNorm: [number, number];
  color: string;
}

export interface WorldLineData {
  characters: WorldLineCharacter[];
  events: WorldLineEvent[];
  eras: WorldLineEra[];
}
