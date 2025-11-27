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
type Lesson = Database['public']['Tables']['lessons']['Row'];

const Lessons = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);

    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedModuleId, setSelectedModuleId] = useState<string>('');

    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        youtube_video_id: '',
        support_text: '',
        duration: '',
        order_position: 0,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourseId) {
            fetchModules(selectedCourseId);
            setSelectedModuleId('');
            setLessons([]);
        } else {
            setModules([]);
            setLessons([]);
        }
    }, [selectedCourseId]);

    useEffect(() => {
        if (selectedModuleId) {
            fetchLessons(selectedModuleId);
        } else {
            setLessons([]);
        }
    }, [selectedModuleId]);

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
        try {
            const { data, error } = await supabase
                .from('modules')
                .select('*')
                .eq('course_id', courseId)
                .order('order_position');
            if (error) throw error;
            setModules(data || []);
            if (data && data.length > 0) {
                setSelectedModuleId(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching modules:', error);
            toast.error('Erro ao carregar módulos');
        }
    };

    const fetchLessons = async (moduleId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('lessons')
                .select('*')
                .eq('module_id', moduleId)
                .order('order_position');

            if (error) throw error;
            setLessons(data || []);
        } catch (error) {
            console.error('Error fetching lessons:', error);
            toast.error('Erro ao carregar aulas');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (lesson?: Lesson) => {
        if (lesson) {
            setEditingLesson(lesson);
            setFormData({
                title: lesson.title,
                youtube_video_id: lesson.youtube_video_id,
                support_text: lesson.support_text || '',
                duration: lesson.duration || '',
                order_position: lesson.order_position,
            });
        } else {
            setEditingLesson(null);
            setFormData({
                title: '',
                youtube_video_id: '',
                support_text: '',
                duration: '',
                order_position: lessons.length + 1,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLesson(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedModuleId) {
            toast.error('Selecione um módulo primeiro');
            return;
        }
        setSaving(true);

        try {
            if (editingLesson) {
                const { error } = await supabase
                    .from('lessons')
                    .update({
                        title: formData.title,
                        youtube_video_id: formData.youtube_video_id,
                        support_text: formData.support_text || null,
                        duration: formData.duration || null,
                        order_position: formData.order_position,
                    } as any)
                    .eq('id', editingLesson.id);

                if (error) throw error;
                toast.success('Aula atualizada com sucesso');
            } else {
                const { error } = await supabase
                    .from('lessons')
                    .insert([{
                        module_id: selectedModuleId,
                        title: formData.title,
                        youtube_video_id: formData.youtube_video_id,
                        support_text: formData.support_text || null,
                        duration: formData.duration || null,
                        order_position: formData.order_position,
                    }] as any);

                if (error) throw error;
                toast.success('Aula criada com sucesso');
            }

            fetchLessons(selectedModuleId);
            handleCloseModal();
        } catch (error) {
            toast.error('Erro ao salvar aula');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta aula?')) return;

        try {
            const { error } = await supabase
                .from('lessons')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Aula excluída com sucesso');
            if (selectedModuleId) fetchLessons(selectedModuleId);
        } catch (error) {
            toast.error('Erro ao excluir aula');
            console.error(error);
        }
    };

    return (
        <div>
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-xl font-semibold text-gray-900">Aulas</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Gerencie as aulas de cada módulo.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <Button onClick={() => handleOpenModal()} disabled={!selectedModuleId}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Aula
                    </Button>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="course-select" className="block text-sm font-medium text-gray-700 mb-2">
                        Curso
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

                <div>
                    <label htmlFor="module-select" className="block text-sm font-medium text-gray-700 mb-2">
                        Módulo
                    </label>
                    <select
                        id="module-select"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                        value={selectedModuleId}
                        onChange={(e) => setSelectedModuleId(e.target.value)}
                        disabled={!selectedCourseId}
                    >
                        <option value="" disabled>Selecione um módulo...</option>
                        {modules.map((module) => (
                            <option key={module.id} value={module.id}>
                                {module.title}
                            </option>
                        ))}
                    </select>
                </div>
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
                                            Vídeo ID
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Duração
                                        </th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Ações</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-4">Carregando...</td>
                                        </tr>
                                    ) : lessons.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-4 text-gray-500">
                                                {selectedModuleId ? 'Nenhuma aula encontrada.' : 'Selecione um módulo para ver as aulas.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        lessons.map((lesson) => (
                                            <tr key={lesson.id}>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {lesson.order_position}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                                                    {lesson.title}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono">
                                                    {lesson.youtube_video_id}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {lesson.duration || '-'}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <button
                                                        onClick={() => handleOpenModal(lesson)}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(lesson.id)}
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
                title={editingLesson ? 'Editar Aula' : 'Nova Aula'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Título"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />

                    <Input
                        label="ID do Vídeo (YouTube)"
                        value={formData.youtube_video_id}
                        onChange={(e) => setFormData({ ...formData, youtube_video_id: e.target.value })}
                        required
                        placeholder="Ex: dQw4w9WgXcQ"
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Texto de Apoio
                        </label>
                        <textarea
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            rows={3}
                            value={formData.support_text}
                            onChange={(e) => setFormData({ ...formData, support_text: e.target.value })}
                        />
                    </div>

                    <Input
                        label="Duração (Ex: 15:30)"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    />

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

export default Lessons;
