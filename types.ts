
export interface User {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  rating: number; // 1-5
  position: 'Goleiro' | 'Zagueiro' | 'Meia' | 'Atacante';
  isAdmin?: boolean;
}

export interface PlayerEntry {
  userId: string;
  name: string;
  status: 'confirmado' | 'pendente' | 'ausente';
  joinedAt: number;
}

export interface Match {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  locationUri?: string;
  maxPlayers: number;
  pricePerPlayer: number;
  players: PlayerEntry[];
  organizerId: string;
  description: string;
  draft?: TeamDraft | null;
  status?: 'open' | 'finished';
  scoreAmarelo?: number;
  scoreLaranja?: number;
}

export interface TeamDraft {
  id?: string;
  teamAmarelo: string[];
  teamLaranja: string[];
  justification: string;
}
