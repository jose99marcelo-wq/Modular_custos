
export interface Message {
  id: number | string;
  text: string;
  sender: 'user' | 'bot';
  imageUrl?: string;
}

export interface Expense {
  id: number;
  description: string;
  category: string;
  amount: number;
  date: Date;
  imageUrl?: string;
}

export interface Project {
    id: number;
    name: string;
    messages: Message[];
    expenses: Expense[];
}

export interface GeminiExpenseResponse {
  isExpense: boolean;
  description?: string;
  category?: string;
  amount?: number;
  date?: string; // Formato AAAA-MM-DD
  responseText?: string;
}

export type View = 'chat' | 'admin';
