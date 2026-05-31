export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  role: 'user' | 'admin';
}

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  createdAt: any; // Firestore Timestamp
  sentimentScore: number; // -1.0 to 1.0
  sentimentLabel: 'positive' | 'neutral' | 'negative';
  dominantEmotion: string; // "Calm", "Joy", "Anxiety", "Sorrow", "Anger", "Hope"
  analysisTips?: string; // AI generated suggestions
}

export interface MoodLog {
  id: string;
  userId: string;
  moodValue: number; // 1-5
  energyValue: number; // 1-5
  sleepHours: number;
  notes?: string;
  createdAt: any; // Firestore Timestamp
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: any;
  updatedAt: any;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'ai';
  text: string;
  createdAt: any;
  detectedEmotion?: string;
}

export interface ArchitectureTab {
  id: string;
  title: string;
  iconName: string;
  content: string;
}
