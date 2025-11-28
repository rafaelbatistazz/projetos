import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Users, Lock, Calendar, Search } from 'lucide-react';
import Button from '../../components/ui/Button';

interface Client {
    email: string;
    nome: string;
    status_cliente: boolean;
}

interface Course {
    id: string;
    title: string;
}

interface CourseAccess {
    course_id: string;
    expires_at: string | null;
}

const CourseAccess = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [clientAccess, setClientAccess] = useState<Map<string, CourseAccess>>(new Map());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedClient) {
            fetchClientAccess(selectedClient);
        }
    }, [selectedClient]);

    const fetchData = async () => {
        try {
            const [clientsRes, coursesRes] = await Promise.all([
                supabase.from('clientes').select('email, nome, status_cliente').order('nome'),
                supabase.from('courses').select('id, title').order('title')
            ]);

            if (clientsRes.data) setClients(clientsRes.data);
            if (coursesRes.data) setCourses(coursesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const fetchClientAccess = async (email: string) => {
        try {
            const { data } = await supabase
                .from('course_access')
                .select('course_id, expires_at')
                .eq('email', email);

            const accessMap = new Map<string, CourseAccess>();
            data?.forEach(item => {
                accessMap.set(item.course_id, {
                    course_id: item.course_id,
                    expires_at: item.expires_at
                });
            });
            setClientAccess(accessMap);
        } catch (error) {
            console.error('Error fetching client access:', error);
        }
    };

    const handleToggleCourse = (courseId: string) => {
        const newAccess = new Map(clientAccess);
        if (newAccess.has(courseId)) {
            newAccess.delete(courseId);
        } else {
            newAccess.set(courseId, { course_id: courseId, expires_at: null });
        }
        setClientAccess(newAccess);
    };

    const handleSetExpiration = (courseId: string, date: string) => {
        const newAccess = new Map(clientAccess);
        const access = newAccess.get(courseId);
        if (access) {
            access.expires_at = date || null;
            newAccess.set(courseId, access);
            setClientAccess(newAccess);
        }
    };

    const handleSave = async () => {
        if (!selectedClient) {
            toast.error('Selecione um cliente');
            return;
        }

        setSaving(true);
        try {
            // Delete all existing access for this client
            await supabase
                .from('course_access')
                .delete()
                .eq('email', selectedClient);

            // Insert new access
            if (clientAccess.size > 0) {
                const accessRecords = Array.from(clientAccess.values()).map(access => ({
                    email: selectedClient,
                    course_id: access.course_id,
                    expires_at: access.expires_at
                }));

                const { error } = await supabase
                    .from('course_access')
                    .insert(accessRecords);

                if (error) throw error;
            }

            toast.success('Acessos salvos com sucesso!');
        } catch (error) {
            console.error('Error saving access:', error);
            toast.error('Erro ao salvar acessos');
        } finally {
            setSaving(false);
        }
    };

    const filteredClients = clients.filter(client => {
        const matchesFilter = filterActive === 'all' ||
            (filterActive === 'active' && client.status_cliente) ||
            (filterActive === 'inactive' && !client.status_cliente);

        const matchesSearch = client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return <div className="text-white">Carregando...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Gerenciar Acessos aos Cursos</h1>
                <p className="text-gray-400">Controle quais cursos cada cliente pode acessar</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Client List */}
                <div className="lg:col-span-1">
                    <div className="bg-[#1a1f2e] rounded-xl border border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-700">
                            <h2 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
                                <Users className="h-5 w-5 text-primary" />
                                Clientes
                            </h2>

                            {/* Search */}
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar cliente..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-[#0f1419] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {/* Filter */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilterActive('all')}
                                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${filterActive === 'all'
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    Todos
                                </button>
                                <button
                                    onClick={() => setFilterActive('active')}
                                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${filterActive === 'active'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    Ativos
                                </button>
                                <button
                                    onClick={() => setFilterActive('inactive')}
                                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${filterActive === 'inactive'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    Inativos
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[600px] overflow-y-auto">
                            {filteredClients.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    Nenhum cliente encontrado
                                </div>
                            ) : (
                                filteredClients.map(client => (
                                    <button
                                        key={client.email}
                                        onClick={() => setSelectedClient(client.email)}
                                        className={`w-full p-4 text-left border-b border-gray-700 hover:bg-gray-800/50 transition-colors ${selectedClient === client.email ? 'bg-gray-800' : ''
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{client.nome}</p>
                                                <p className="text-xs text-gray-400 truncate">{client.email}</p>
                                            </div>
                                            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${client.status_cliente
                                                ? 'bg-green-600/20 text-green-400'
                                                : 'bg-red-600/20 text-red-400'
                                                }`}>
                                                {client.status_cliente ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Course Access */}
                <div className="lg:col-span-2">
                    {!selectedClient ? (
                        <div className="bg-[#1a1f2e] rounded-xl border border-gray-700 p-12 text-center">
                            <Lock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">Selecione um cliente para gerenciar seus acessos</p>
                        </div>
                    ) : (
                        <div className="bg-[#1a1f2e] rounded-xl border border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-700">
                                <h2 className="text-lg font-medium text-white mb-1">
                                    Cursos Disponíveis
                                </h2>
                                <p className="text-sm text-gray-400">
                                    Marque os cursos que {clients.find(c => c.email === selectedClient)?.nome} pode acessar
                                </p>
                            </div>

                            <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                                {courses.map(course => {
                                    const hasAccess = clientAccess.has(course.id);
                                    const access = clientAccess.get(course.id);

                                    return (
                                        <div key={course.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={hasAccess}
                                                    onChange={() => handleToggleCourse(course.id)}
                                                    className="mt-1 h-5 w-5 rounded border-gray-600 text-primary focus:ring-primary focus:ring-offset-gray-900"
                                                />
                                                <div className="flex-1">
                                                    <label className="text-white font-medium cursor-pointer">
                                                        {course.title}
                                                    </label>

                                                    {hasAccess && (
                                                        <div className="mt-3 flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-gray-400" />
                                                            <input
                                                                type="date"
                                                                value={access?.expires_at?.split('T')[0] || ''}
                                                                onChange={(e) => handleSetExpiration(course.id, e.target.value)}
                                                                className="px-3 py-1.5 bg-[#0f1419] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                                placeholder="Sem expiração"
                                                            />
                                                            <span className="text-xs text-gray-500">
                                                                {access?.expires_at ? 'Expira em' : 'Acesso permanente'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-6 border-t border-gray-700 flex justify-end">
                                <Button onClick={handleSave} isLoading={saving}>
                                    Salvar Acessos
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseAccess;
