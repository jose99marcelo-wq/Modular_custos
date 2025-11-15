import React, { useState } from 'react';
import { type Project } from '../types';

interface ProjectSelectionViewProps {
    projects: Project[];
    onSelectProject: (projectId: number) => void;
    onCreateProject: (name: string) => void;
}

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

const ProjectSelectionView: React.FC<ProjectSelectionViewProps> = ({ projects, onSelectProject, onCreateProject }) => {
    const [newProjectName, setNewProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = () => {
        if (newProjectName.trim()) {
            onCreateProject(newProjectName.trim());
            setNewProjectName('');
            setIsCreating(false);
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6">
            <h1 className="text-3xl font-bold text-[#1F2937] mb-6">Os Meus Projetos</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => {
                    const totalCost = project.expenses.reduce((sum, exp) => sum + exp.amount, 0);
                    return (
                        <div
                            key={project.id}
                            onClick={() => onSelectProject(project.id)}
                            className="bg-white p-6 rounded-xl shadow-lg border border-[#D0D5DD] hover:border-[#1A73E8] hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                        >
                            <div>
                                <h2 className="text-xl font-bold text-[#1F2937] mb-2 truncate">{project.name}</h2>
                                <p className="text-sm text-gray-500">{project.expenses.length} despesas registadas</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm font-medium text-gray-600">Custo Total</p>
                                <p className="text-2xl font-bold text-[#1A73E8]">{formatCurrency(totalCost)}</p>
                            </div>
                        </div>
                    );
                })}

                {/* Create New Project Card */}
                {isCreating ? (
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-[#D0D5DD] flex flex-col gap-4">
                        <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Nome do Novo Projeto"
                            className="w-full px-4 py-2 text-[#1F2937] bg-white border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                            autoFocus
                        />
                        <div className="flex gap-2">
                             <button onClick={handleCreate} className="flex-1 px-4 py-2 bg-[#1A73E8] text-white rounded-lg hover:opacity-90 disabled:bg-opacity-50" disabled={!newProjectName.trim()}>
                                Criar
                            </button>
                            <button onClick={() => setIsCreating(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                                Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => setIsCreating(true)}
                        className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#1A73E8] hover:text-[#1A73E8] transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-gray-500"
                        style={{minHeight: '210px'}}
                    >
                        <PlusIcon className="w-12 h-12 mb-2" />
                        <h2 className="text-lg font-semibold">Criar Novo Projeto</h2>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectSelectionView;
