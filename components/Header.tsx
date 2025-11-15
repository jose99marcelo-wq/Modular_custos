import React from 'react';
import { type View } from '../types';

interface HeaderProps {
    currentView?: View;
    setView?: (view: View) => void;
    projectName?: string;
    onGoToProjectList: () => void;
    onLogout?: () => void;
}

const HomeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const MessageCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
  </svg>
);

const PieChartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </svg>
);

const LogOutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
);


export const Header: React.FC<HeaderProps> = ({ currentView, setView, projectName, onGoToProjectList, onLogout }) => {
    const getButtonClass = (viewName: View) => {
        return `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentView === viewName
                ? 'bg-[#1A73E8] text-white'
                : 'text-[#6B7280] hover:bg-slate-100'
        }`;
    };

    return (
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#D0D5DD]">
            <div className="flex items-center gap-2">
                <button onClick={onGoToProjectList} className="p-1 rounded-full hover:bg-slate-100 transition-colors" aria-label="Voltar à lista de projetos">
                    <HomeIcon className="h-6 w-6 text-[#1A73E8]" />
                </button>
                <h1 className="text-xl font-bold text-[#1F2937] truncate">
                  {projectName ? projectName : 'Chat de Obra'}
                </h1>
            </div>
            <div className="flex items-center gap-2">
                {currentView && setView && (
                  <nav className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
                      <button onClick={() => setView('chat')} className={getButtonClass('chat')}>
                          <MessageCircleIcon className="h-5 w-5" />
                          Chat
                      </button>
                      <button onClick={() => setView('admin')} className={getButtonClass('admin')}>
                          <PieChartIcon className="h-5 w-5" />
                          Dashboard
                      </button>
                  </nav>
                )}
                {onLogout && (
                    <button 
                        onClick={onLogout} 
                        className="p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors ml-2" 
                        aria-label="Sair"
                    >
                        <LogOutIcon className="h-5 w-5" />
                    </button>
                )}
            </div>
        </header>
    );
};