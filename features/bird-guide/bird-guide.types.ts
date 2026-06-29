export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ObservationSighting {
  date: string;
  seen: boolean;
  heard: boolean;
  photographed: boolean;
  quality: 1 | 2 | 3 | 4 | 5 | null;
  notes: string | null;
  locationName: string | null;
}

export interface ObservedBirdEntry {
  name: string;
  sightings: ObservationSighting[];
}

export interface UserContext {
  observedCount: number;
  collectedCount: number;
  totalBirdsInCatalog: number;
  observations: ObservedBirdEntry[];
}

export interface ChatActionInput {
  messages: ChatMessage[];
}
