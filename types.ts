export interface UploadedFile {
  id: string;
  name: string;
  content: string;
  type: string;
  size: number;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
  // New features
  replyToId?: string; // ID сообщения, на которое отвечаем
  replyToText?: string; // Текст цитаты (для упрощения отображения)
  isPinned?: boolean;
  isFavorite?: boolean;
  reactions?: Record<string, number>; // Map of emoji -> count
  userReactions?: string[]; // Emojis clicked by current user
}

export interface Folder {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt?: number;
  files: UploadedFile[];
  messages: Message[];
}

export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface UserPreferences {
  themeAccent: 'indigo' | 'blue' | 'emerald' | 'violet' | 'rose' | 'orange';
  emailNotifications: boolean;
  pushNotifications: boolean;
  timezone: string;
  dateFormat: 'DD.MM.YYYY' | 'MM/DD/YYYY';
  // New visual settings
  uiDensity: 'compact' | 'comfortable';
  fontSize: 'small' | 'medium' | 'large';
  customColor?: string; // Hex code for custom theme
}

export interface Gamification {
  xp: number;
  level: number;
  badges: string[];
}

export interface QuizResult {
  id: string;
  folderId?: string;
  topic: string;
  score: number;
  totalQuestions: number;
  difficulty: string;
  date: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  bio?: string;
  joinedAt: number;
  lastLoginAt?: number;
  socialLinks?: SocialLinks;
  preferences?: UserPreferences;
  gamification?: Gamification;
  quizHistory?: QuizResult[];
}

export interface AppSettings {
  theme: 'light' | 'dark';
  useStream: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'folder_create' | 'file_upload' | 'message_sent';
  title: string;
  subtitle?: string;
  timestamp: number;
}