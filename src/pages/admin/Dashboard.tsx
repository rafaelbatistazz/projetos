import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BookOpen, Layers, PlayCircle, Users } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                    <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                        <dd>
                            <div className="text-lg font-medium text-gray-900">{value}</div>
                        </dd>
                    </dl>
                </div>
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        courses: 0,
        modules: 0,
        lessons: 0,
        clients: 0, // Renamed 'users' to 'clients' to match the fetched data
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [courses, modules, lessons] = await Promise.all([
                    supabase.from('courses').select('*', { count: 'exact', head: true }),
                    supabase.from('modules').select('*', { count: 'exact', head: true }),
                    supabase.from('lessons').select('*', { count: 'exact', head: true }),
                ]);
                const { count: clientesCount } = await supabase
                    .from('clientes')
                    .select('*', { count: 'exact', head: true });

                setStats({
                    courses: courses.count || 0,
                    modules: modules.count || 0,
                    lessons: lessons.count || 0,
                    clients: clientesCount || 0,
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return <div>Carregando...</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total de Cursos"
                    value={stats.courses}
                    icon={BookOpen}
                    color="text-blue-600"
                />
                <StatCard
                    title="Total de Módulos"
                    value={stats.modules}
                    icon={Layers}
                    color="text-indigo-600"
                />
                <StatCard
                    title="Total de Aulas"
                    value={stats.lessons}
                    icon={PlayCircle}
                    color="text-green-600"
                />
                <StatCard
                    title="Clientes Cadastrados"
                    value={stats.clients}
                    icon={Users}
                    color="text-purple-600"
                />
            </div>

            <div className="mt-8 bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Bem-vindo ao Painel Administrativo</h2>
                <p className="text-gray-600">
                    Utilize o menu lateral para gerenciar cursos, módulos, aulas e usuários.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
