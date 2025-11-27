import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

type Course = Database['public']['Tables']['courses']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];

const Modules = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<Module | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        order_position: 0,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourseId) {
            fetchModules(selectedCourseId);
        } else {
            setModules([]);
        }
    }, [selectedCourseId]);

    const fetchCourses = async () => {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .order('title');
            if (error) throw error;
            setCourses(data || []);
            if (data && data.length > 0 && !selectedCourseId) {
                setSelectedCourseId(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            toast.error('Erro ao carregar cursos');
        }
    };

    const fetchModules = async (courseId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('modules')
                .select('*')
                .eq('course_id', courseId)
                .order('order_position', { ascending: true });

            if (error) throw error;
            setModules(data || []);
        } catch (error) {
            console.error('Error fetching modules:', error);
            toast.error('Erro ao carregar módulos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (module?: Module) => {
        if (module) {
            setEditingModule(module);
            setFormData({
                title: module.title,
                description: module.description || '',
                order_position: module.order_position,
            });
        } else {
            setEditingModule(null);
            setFormData({
                title: '',
                description: '',
                order_position: modules.length + 1,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingModule(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourseId) {
            toast.error('Selecione um curso primeiro');
            return;
        }
        setSaving(true);

        try {
            if (editingModule) {
                const { error } = await supabase
                    .from('modules')
                    .update({
                        title: formData.title,
                        description: formData.description || null,
                        order_position: formData.order_position,
                    } as any)
                    .eq('id', editingModule.id);

                if (error) throw error;
                toast.success('Módulo atualizado com sucesso');
            } else {
                const { error } = await supabase
                    .from('modules')
                    .insert([{
                        course_id: selectedCourseId,
                        title: formData.title,
                        description: formData.description || null,
                        order_position: formData.order_position,
                    }] as any);

                if (error) throw error;
                toast.success('Módulo criado com sucesso');
            }

            fetchModules(selectedCourseId);
            handleCloseModal();
        } catch (error) {
            toast.error('Erro ao salvar módulo');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este módulo?')) return;

        try {
            const { error } = await supabase
                .from('modules')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Módulo excluído com sucesso');
            if (selectedCourseId) fetchModules(selectedCourseId);
        } catch (error) {
            toast.error('Erro ao excluir módulo');
            console.error(error);
        }
    };

    return (
        <div>
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-xl font-semibold text-gray-900">Módulos</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Gerencie os módulos de cada curso.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <Button onClick={() => handleOpenModal()} disabled={!selectedCourseId}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Módulo
                    </Button>
                </div>
            </div>

            <div className="mt-6">
                <label htmlFor="course-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Selecione o Curso
                </label>
                <select
                    id="course-select"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                >
                    <option value="" disabled>Selecione um curso...</option>
                    {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                            {course.title}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Ordem
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Título
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Descrição
                                        </th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Ações</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-4">Carregando...</td>
                                        </tr>
                                    ) : modules.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-4 text-gray-500">
                                                {selectedCourseId ? 'Nenhum módulo encontrado.' : 'Selecione um curso para ver os módulos.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        modules.map((module) => (
                                            <tr key={module.id}>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {module.order_position}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                                                    {module.title}
                                                </td>
                                                <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                    {module.description}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <button
                                                        onClick={() => handleOpenModal(module)}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(module.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingModule ? 'Editar Módulo' : 'Novo Módulo'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Título"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descrição
                        </label>
                        <textarea
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <Input
                        label="Ordem de Exibição"
                        type="number"
                        value={formData.order_position}
                        onChange={(e) => setFormData({ ...formData, order_position: parseInt(e.target.value) || 0 })}
                    />

                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <Button type="submit" isLoading={saving} className="w-full sm:col-start-2">
                            Salvar
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCloseModal}
                            className="mt-3 w-full sm:mt-0 sm:col-start-1"
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Modules;
