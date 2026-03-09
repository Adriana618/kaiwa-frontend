export interface Card {
  id: string;
  deck_id: string;
  card_type: string;
  front: { text: string; reading?: string; audio_url?: string; image_url?: string };
  back: { text: string; reading?: string; examples?: string[] };
  tags: string[];
  created_at: string;
}

export interface CardState {
  status: string;
  difficulty: number;
  stability: number;
  retrievability: number;
  stability_cem: number;
  due_at: string | null;
  last_review_at: string | null;
  review_count: number;
  lapse_count: number;
}

export interface CardWithState extends Card {
  card_state: CardState | null;
}

export interface ReviewResult {
  card_id: string;
  next_due_at: string;
  new_stability: number;
  new_difficulty: number;
  cem_adjustment: number;
  retrievability: number;
}

export interface ReviewStats {
  cards_due: number;
  cards_reviewed_today: number;
  new_cards_today: number;
  retention_rate: number;
}

export interface ImmersionLog {
  id: string;
  language: string;
  modality: string;
  duration_minutes: number;
  source_name: string | null;
  source_type: string | null;
  domain_tags: string[];
  comprehension: number | null;
  logged_at: string;
  activity_date: string;
}

export interface Deck {
  id: string;
  user_id: string;
  language: string;
  name: string;
  description: string | null;
  is_shared: boolean;
  created_at: string;
}
