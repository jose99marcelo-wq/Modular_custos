
import React, { useState, useCallback, useEffect } from 'react';
import { analyzeExpenseMessage } from './services/geminiService';
import { type Message, type Expense, type View, type Project } from './types';
import ChatView from './components/ChatView';
import AdminView from './components/AdminView';
import { Header } from './components/Header';
import ProjectSelectionView from './components/ProjectSelectionView';
import AuthView from './components/AuthView';
import { supabase } from './supabaseClient';
import { type Session } from '@supabase/supabase-js';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const App: React.FC = () => {
  const [view, setView] = useState<View>('chat');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsFetchingData(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const fetchProjects = async () => {
    if (!session) return;
    setIsFetchingData(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, expenses(*)')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const projectsWithParsedDates = data.map(p => ({
          ...p,
          messages: [], // messages will be fetched on project selection
          expenses: p.expenses.map((e: any) => ({...e, date: new Date(e.date)}))
      }));

      setProjects(projectsWithParsedDates);
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      setError("Não foi possível carregar os seus projetos. Verifique a sua ligação ou as políticas de segurança no Supabase e tente novamente.");
    } finally {
        setIsFetchingData(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchProjects();
    } else {
      setProjects([]);
      setSelectedProjectId(null);
      setError(null);
    }
  }, [session]);

  const handleSelectProject = async (projectId: number) => {
    setSelectedProjectId(projectId);
    setView('chat');
    
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1 || projects[projectIndex].messages.length > 0) return;

    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        setProjects(currentProjects => 
            currentProjects.map(p => 
                p.id === projectId ? {...p, messages: data} : p
            )
        );

    } catch (error) {
        console.error("Error fetching messages:", error);
    }
  };
  
  const handleGoToProjectList = () => {
      setSelectedProjectId(null);
      fetchProjects(); // Refresh project list totals
  };

  const handleCreateProject = async (name: string) => {
    if (!session) return;
    try {
        const { data, error } = await supabase
            .from('projects')
            .insert({ name, user_id: session.user.id })
            .select()
            .single();

        if (error) throw error;
        
        const initialBotMessage: Omit<Message, 'id' | 'project_id' | 'created_at'> = {
            text: `Olá! Bem-vindo ao projeto '${name}'. Descreva as suas despesas ou faça uma pergunta sobre o progresso.`,
            sender: 'bot',
        };
        
        const {data: msgData, error: msgError} = await supabase
            .from('messages')
            .insert({ ...initialBotMessage, project_id: data.id })
            .select()
            .single();

        if(msgError) throw msgError;

        const newProject: Project = { ...data, expenses: [], messages: [msgData] };

        setProjects(prev => [...prev, newProject]);
        setSelectedProjectId(newProject.id);
        setView('chat');
    } catch(error) {
        console.error("Error creating project:", error);
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!selectedProject) return;
    try {
        const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
        if (error) throw error;

        const updatedExpenses = selectedProject.expenses.filter(expense => expense.id !== expenseId);
        const updatedProjects = projects.map(p => p.id === selectedProject.id ? {...p, expenses: updatedExpenses} : p);
        setProjects(updatedProjects);

    } catch(error) {
        console.error("Error deleting expense:", error);
    }
  };
  
  const handleSendMessage = useCallback(async (text: string, image?: File) => {
    if (!selectedProject || !session) return;

    setIsLoading(true);

    const tempUserMessageId = `temp_${Date.now()}`;
    const userMessage: Message = {
      id: tempUserMessageId,
      text,
      sender: 'user',
      imageUrl: image ? URL.createObjectURL(image) : undefined,
    };

    setProjects(currentProjects => currentProjects.map(p =>
      p.id === selectedProject.id ? { ...p, messages: [...p.messages, userMessage] } : p
    ));

    try {
      let imageUrlForDb: string | undefined = undefined;

      if (image) {
        const filePath = `${session.user.id}/${selectedProject.id}/${Date.now()}_${image.name}`;
        const { error: uploadError } = await supabase.storage.from('expense_images').upload(filePath, image);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('expense_images').getPublicUrl(filePath);
        imageUrlForDb = publicUrl;
      }
      
      const { data: dbUserMessage, error: userMsgError } = await supabase.from('messages').insert({
        project_id: selectedProject.id,
        text,
        sender: 'user',
        image_url: imageUrlForDb,
      }).select().single();

      if (userMsgError) throw userMsgError;

      setProjects(prevProjects => prevProjects.map(p => {
          if (p.id !== selectedProject.id) return p;
          return { ...p, messages: p.messages.map(m => m.id === tempUserMessageId ? dbUserMessage : m) };
      }));

      const imageBase64ForApi = image ? (await fileToBase64(image)).split(',')[1] : undefined;
      const imageMimeType = image ? image.type : undefined;
      const result = await analyzeExpenseMessage(text, selectedProject.expenses, imageBase64ForApi, imageMimeType);

      let botMessageText = '';
      let updatedExpenses = selectedProject.expenses;

      if (result.isExpense && result.amount && result.category && result.description) {
        const expenseDate = result.date ? new Date(`${result.date}T00:00:00`) : new Date();

        const { data: newExpenseData, error: expenseError } = await supabase
          .from('expenses')
          .insert({
            project_id: selectedProject.id,
            description: result.description,
            category: result.category,
            amount: result.amount,
            date: expenseDate.toISOString(),
            image_url: imageUrlForDb,
          })
          .select()
          .single();

        if (expenseError) throw expenseError;

        updatedExpenses = [...updatedExpenses, { ...newExpenseData, date: new Date(newExpenseData.date) }];
        botMessageText = `✅ Despesa registada: ${result.description} (${result.amount.toFixed(2)} €) na categoria '${result.category}' com data de ${expenseDate.toLocaleDateString('pt-PT')}.`;
      } else if (result.responseText) {
        botMessageText = result.responseText;
      } else {
        botMessageText = "Não entendi a sua mensagem. Pode tentar de novo? Se for uma despesa, lembre-se de incluir o item, o valor e a descrição.";
      }

      const { data: dbBotMessage, error: botMsgError } = await supabase.from('messages').insert({
        project_id: selectedProject.id,
        text: botMessageText,
        sender: 'bot',
      }).select().single();

      if (botMsgError) throw botMsgError;

      setProjects(prevProjects => prevProjects.map(p =>
        p.id === selectedProject.id ? { ...p, expenses: updatedExpenses, messages: [...p.messages, dbBotMessage] } : p
      ));

    } catch (error) {
      console.error('Error processing message:', error);
      const { data: dbBotMessage } = await supabase.from('messages').insert({
        project_id: selectedProject.id,
        text: 'Desculpe, ocorreu um erro ao processar a sua mensagem. Tente novamente.',
        sender: 'bot',
      }).select().single();
      
      setProjects(prevProjects => prevProjects.map(p => {
          if (p.id !== selectedProject.id) return p;
          const messagesWithoutTemp = p.messages.filter(m => m.id !== tempUserMessageId);
          return { ...p, messages: dbBotMessage ? [...messagesWithoutTemp, dbBotMessage] : messagesWithoutTemp };
      }));

    } finally {
      setIsLoading(false);
    }
  }, [selectedProject, projects, session]);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (isFetchingData) {
      return (
        <div className="flex items-center justify-center h-screen bg-[#F5F7FA]">
            <div className="text-xl font-semibold text-gray-600">A carregar...</div>
        </div>
      );
  }

  if (!session) {
    return <AuthView />;
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F5F7FA] p-4 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Ocorreu um Erro</h2>
        <p className="text-gray-700 mb-6">{error}</p>
        <button 
          onClick={fetchProjects} 
          className="px-6 py-2 bg-[#1A73E8] text-white rounded-lg hover:opacity-90"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!selectedProject) {
      return (
          <div className="flex flex-col h-screen font-sans bg-[#F5F7FA]">
              <Header onGoToProjectList={handleGoToProjectList} onLogout={handleLogout} />
              <ProjectSelectionView projects={projects} onSelectProject={handleSelectProject} onCreateProject={handleCreateProject} />
          </div>
      )
  }

  return (
    <div className="flex flex-col h-screen font-sans">
      <Header 
        currentView={view} 
        setView={setView} 
        projectName={selectedProject.name}
        onGoToProjectList={handleGoToProjectList}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto p-2 sm:p-4">
        {view === 'chat' ? (
          <ChatView
            messages={selectedProject.messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <AdminView expenses={selectedProject.expenses} onDeleteExpense={handleDeleteExpense} />
        )}
      </main>
    </div>
  );
};

export default App;
