import { GoogleGenAI, Type } from '@google/genai';
import { type GeminiExpenseResponse, type Expense } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const expenseSchema = {
  type: Type.OBJECT,
  properties: {
    isExpense: {
      type: Type.BOOLEAN,
      description: 'O texto e/ou imagem descreve uma nova despesa de construção?',
    },
    description: {
      type: Type.STRING,
      description: 'Uma breve descrição do item da despesa. Se houver uma imagem, use-a para obter mais detalhes.',
    },
    category: {
      type: Type.STRING,
      description: "A categoria da despesa. Opções: 'Materiais', 'Mão de Obra', 'Ferramentas', 'Documentação', 'Outros'.",
    },
    amount: {
      type: Type.NUMBER,
      description: 'O valor numérico da despesa. Extraia-o do texto ou da imagem, se disponível.',
    },
    date: {
        type: Type.STRING,
        description: "A data da despesa no formato AAAA-MM-DD. Se o utilizador mencionar uma data (p. ex., 'hoje', 'ontem', '25 de maio'), converta-a para este formato. Se nenhuma data for mencionada, omita este campo.",
    },
    responseText: {
      type: Type.STRING,
      description: 'Se a mensagem do utilizador não for uma despesa (p. ex., uma pergunta ou saudação), forneça aqui uma resposta conversacional e útil. Se for uma despesa, este campo deve ser omitido.',
    }
  },
  required: ['isExpense'],
};

export async function analyzeExpenseMessage(
    message: string, 
    expenses: Expense[],
    imageBase64?: string, 
    imageMimeType?: string
): Promise<GeminiExpenseResponse> {
  try {
    const expensesContext = expenses.length > 0 
        ? `Contexto das despesas já registadas (usar para responder a perguntas): ${JSON.stringify(expenses.map(e => ({ id: e.id, desc: e.description, cat: e.category, val: e.amount, data: e.date.toISOString().split('T')[0] })))}`
        : "Ainda não há despesas registadas.";

    const textPart = {
        text: `${expensesContext}\n\nAnalise a seguinte mensagem do utilizador e a imagem anexa (se houver): "${message}"`,
    };

    const parts: any[] = [textPart];

    if (imageBase64 && imageMimeType) {
        parts.push({
            inlineData: {
                mimeType: imageMimeType,
                data: imageBase64,
            },
        });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            responseMimeType: 'application/json',
            responseSchema: expenseSchema,
            systemInstruction: "Você é um assistente IA especializado em gestão de obras. A sua tarefa é analisar as mensagens, imagens e o contexto de despesas fornecido. Se a mensagem for sobre uma NOVA despesa, extraia os detalhes (descrição, valor, categoria e data, se mencionada) e defina 'isExpense' como true. Se nenhuma data for mencionada para a despesa, não inclua o campo de data. Se for uma pergunta sobre despesas existentes, o estado da obra, ou uma saudação, use o contexto para responder de forma útil e conversacional no campo 'responseText' e defina 'isExpense' como false."
        }
    });
    
    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);
    
    return parsedJson as GeminiExpenseResponse;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to analyze expense message.");
  }
}