import React, { useMemo, useState } from 'react';
import { type Expense } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Line } from 'recharts';

interface AdminViewProps {
  expenses: Expense[];
  onDeleteExpense: (id: number) => void;
}

const COLORS = ['#1A73E8', '#00C896', '#F59E0B', '#EF4444', '#3B82F6', '#6B7280'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

const PieCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-2 bg-white border border-[#D0D5DD] rounded-lg shadow-sm">
          <p className="font-bold text-[#1F2937]">{`${data.name}`}</p>
          <p className="text-sm text-[#6B7280]">{`Total: ${formatCurrency(data.value)}`}</p>
        </div>
      );
    }
    return null;
};

const BarCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-white border border-[#D0D5DD] rounded-lg shadow-sm">
          <p className="font-bold text-[#1F2937]">{label}</p>
          <p className="text-sm text-[#6B7280]">{`Total: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
};


const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
);

const CameraIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
    </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);


const AdminView: React.FC<AdminViewProps> = ({ expenses, onDeleteExpense }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

    const openExpenseModal = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedExpense(null);
    };

    const handleDeleteClick = (expenseId: number) => {
        if (window.confirm('Tem a certeza que deseja eliminar esta despesa?')) {
            onDeleteExpense(expenseId);
            if (selectedExpense?.id === expenseId) {
                closeModal();
            }
        }
    };
    
    const parsedExpenses = useMemo(() => expenses.map(e => ({...e, date: new Date(e.date)})), [expenses]);

    const categories = useMemo(() => {
        const allCategories = new Set(parsedExpenses.map(e => e.category));
        return ['All', ...Array.from(allCategories)];
    }, [parsedExpenses]);

    const filteredExpenses = useMemo(() => {
        if (selectedCategory === 'All') {
            return parsedExpenses;
        }
        return parsedExpenses.filter(expense => expense.category === selectedCategory);
    }, [parsedExpenses, selectedCategory]);

    const { totalExpenses, categoryData } = useMemo(() => {
        const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        const dataByCategory = parsedExpenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {} as Record<string, number>);

        const chartData = Object.entries(dataByCategory)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return { totalExpenses: total, categoryData: chartData };
    }, [parsedExpenses, filteredExpenses]);

    const monthlyDataWithTrend = useMemo(() => {
        const expensesByMonth: Record<string, { total: number, date: Date }> = {};
        
        filteredExpenses.forEach(exp => {
            const year = exp.date.getFullYear();
            const month = exp.date.getMonth(); // 0-11
            const key = `${year}-${String(month).padStart(2, '0')}`;
            if (!expensesByMonth[key]) {
                expensesByMonth[key] = {
                    total: 0,
                    date: new Date(year, month, 1)
                };
            }
            expensesByMonth[key].total += exp.amount;
        });

        const sortedMonthlyData = Object.values(expensesByMonth)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(data => ({
                name: new Intl.DateTimeFormat('pt-PT', { month: 'short', year: '2-digit' }).format(data.date),
                total: data.total
            }));
            
        const n = sortedMonthlyData.length;
        if (n < 2) {
            return sortedMonthlyData.map(point => ({ ...point, trend: point.total }));
        }

        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        sortedMonthlyData.forEach((point, index) => {
            const x = index;
            const y = point.total;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        });

        const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const b = (sumY - m * sumX) / n;

        return sortedMonthlyData.map((point, index) => ({
            ...point,
            trend: Math.max(0, m * index + b),
        }));
    }, [filteredExpenses]);

    const formatYAxis = (tickItem: number) => {
        if (tickItem >= 1000) {
            return `${(tickItem / 1000).toFixed(1).replace('.', ',')}k €`;
        }
        return `${tickItem} €`;
    };

    return (
        <div className="container mx-auto space-y-6 sm:space-y-8">
            <div className="bg-white p-4 rounded-xl shadow-lg border border-[#D0D5DD]">
                <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-md font-semibold text-[#1F2937] mr-2">Filtrar por Categoria:</h4>
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200 ease-in-out ${
                                selectedCategory === category
                                    ? 'bg-[#1A73E8] text-white shadow-md border border-transparent'
                                    : 'bg-white text-[#6B7280] border border-[#D0D5DD] hover:bg-slate-100'
                            }`}
                        >
                            {category === 'All' ? 'Todas' : category}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* Total Expenses Card */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-[#D0D5DD] flex flex-col justify-center items-center text-center">
                    <h2 className="text-lg font-medium text-[#6B7280]">
                        {selectedCategory === 'All' ? 'Despesa Total da Obra' : `Total - ${selectedCategory}`}
                    </h2>
                    <p className="text-4xl sm:text-5xl font-bold text-[#1A73E8] mt-2">{formatCurrency(totalExpenses)}</p>
                </div>
                
                {/* Pie Chart Card */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-[#D0D5DD]">
                    <h3 className="text-xl font-semibold mb-4 text-[#1F2937]">Despesas por Categoria (Total)</h3>
                    {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                        <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                        >
                            {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<PieCustomTooltip />} />
                        <Legend iconSize={12} wrapperStyle={{fontSize: '14px'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[250px] text-gray-500">
                            Nenhuma despesa para exibir.
                        </div>
                    )}
                </div>
            </div>

            {/* Bar Chart Card */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-[#D0D5DD]">
                <h3 className="text-xl font-semibold mb-4 text-[#1F2937]">Despesas Mensais</h3>
                {monthlyDataWithTrend.length > 1 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyDataWithTrend} margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} width={70} />
                            <Tooltip content={<BarCustomTooltip />} cursor={{ fill: 'rgba(26, 115, 232, 0.1)' }} />
                            <Legend iconSize={12} wrapperStyle={{fontSize: '14px', paddingTop: '10px'}}/>
                            <Bar dataKey="total" name="Total Mensal" fill="#1A73E8" radius={[4, 4, 0, 0]} />
                            <Line 
                                type="monotone" 
                                dataKey="trend" 
                                name="Linha de Tendência" 
                                stroke="#F59E0B" 
                                strokeWidth={2} 
                                strokeDasharray="5 5" 
                                dot={false}
                                activeDot={false}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                        {selectedCategory === 'All' ? 'Registe despesas em mais de um mês para ver a evolução.' : 'Não há dados suficientes nesta categoria para exibir a evolução mensal.'}
                    </div>
                )}
            </div>

            {/* Expenses List / Cards */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-[#D0D5DD]">
                <h3 className="text-xl font-semibold mb-4 text-[#1F2937]">Registo de Despesas</h3>
                <div className="space-y-4">
                    {filteredExpenses.length > 0 ? (
                        [...filteredExpenses].reverse().map((expense) => (
                            <div 
                                key={expense.id}
                                className="bg-white border border-[#D0D5DD] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => openExpenseModal(expense)}
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span style={{ backgroundColor: '#1A73E820', color: '#1A73E8' }} className="px-2 py-1 text-xs font-medium rounded-full">
                                                {expense.category}
                                            </span>
                                            <span className="text-sm text-gray-500">{expense.date.toLocaleDateString('pt-PT')}</span>
                                        </div>
                                        <p className="font-medium text-[#1F2937] break-words flex items-center gap-2">
                                            {expense.description}
                                            {expense.imageUrl && <CameraIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <p className="text-lg font-mono font-semibold text-[#1F2937] whitespace-nowrap">
                                            {formatCurrency(expense.amount)}
                                        </p>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent modal from opening
                                                handleDeleteClick(expense.id);
                                            }} 
                                            className="p-2 rounded-full text-[#6B7280] hover:text-[#EF4444] hover:bg-red-100 transition-colors"
                                            aria-label={`Eliminar despesa ${expense.description}`}
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            {selectedCategory === 'All' ? 'Nenhuma despesa registada ainda.' : `Nenhuma despesa na categoria '${selectedCategory}'.`}
                        </div>
                    )}
                </div>
            </div>
            {isModalOpen && selectedExpense && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
                    onClick={closeModal}
                >
                    <div 
                        className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                         <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-[#6B7280]">
                            <XIcon className="h-6 w-6" />
                        </button>
                        <h3 className="text-2xl font-bold text-[#1F2937] pr-8">{selectedExpense.description}</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="font-semibold text-[#6B7280]">Categoria</div>
                            <div className="text-[#1F2937] sm:text-right">{selectedExpense.category}</div>

                            <div className="font-semibold text-[#6B7280]">Data de Registo</div>
                            <div className="text-[#1F2937] sm:text-right">{new Date(selectedExpense.date).toLocaleString('pt-PT')}</div>

                            <div className="font-semibold text-[#6B7280] text-lg">Valor</div>
                            <div className="text-lg font-bold text-[#1A73E8] sm:text-right">{formatCurrency(selectedExpense.amount)}</div>
                        </div>

                        {selectedExpense.imageUrl && (
                            <div>
                                <h4 className="text-md font-semibold text-[#1F2937] mb-2">Imagem Anexada</h4>
                                <img src={selectedExpense.imageUrl} alt="Anexo da despesa" className="w-full h-auto max-h-80 object-contain rounded-lg border border-[#D0D5DD]"/>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminView;