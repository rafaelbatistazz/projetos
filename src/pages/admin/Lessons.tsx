import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

type Course = Database['public']['Tables']['courses']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];

// Sortable Row Component
const SortableRow = ({ lesson, modules, handleOpenModal, handleDelete }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: lesson.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr ref={setNodeRef} style={style} className="hover:bg-gray-700/50 transition-colors">
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">
                <div className="flex items-center gap-3">
                    <button {...attributes} {...listeners} className="cursor-grab text-gray-500 hover:text-white">
                        <GripVertical className="h-5 w-5" />
                    </button>
                    {lesson.title}
                </div>
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                {modules.find((m: any) => m.id === lesson.module_id)?.title || 'N/A'}
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                {lesson.duration || '-'}
            </td>
            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <button
                    onClick={() => handleOpenModal(lesson)}
                    className="text-primary hover:text-primary/80 mr-4 transition-colors"
                >
                    <Pencil className="h-4 w-4" />
                </button>
                <button
                    onClick={() => handleDelete(lesson.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </td>
        </tr>
    );
};

const Lessons = () => {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [modules, setModules] = useState<Module[]>([]);

    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        youtube_video_id: '',
        module_id: '',
        support_text: '',
        duration: '',
        order_position: 0,
        thumbnail_url: '',
    });
    const [saving, setSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchData();
    }, []);

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
    } catch (error: any) {
        console.error('Error saving lesson:', error);
        toast.error(`Erro ao salvar aula: ${error.message || error.error_description || 'Erro desconhecido'}`);
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
                <h1 className="text-2xl font-bold text-white">Aulas</h1>
                <p className="mt-2 text-sm text-gray-400">
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
                <label htmlFor="course-select" className="block text-sm font-medium text-gray-300 mb-2">
                    Curso
                </label>
                <select
                    id="course-select"
                    className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-[#1a1f2e] text-white"
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
                <label htmlFor="module-select" className="block text-sm font-medium text-gray-300 mb-2">
                    Módulo
                </label>
                <select
                    id="module-select"
                    className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-[#1a1f2e] text-white"
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
                    <div className="overflow-hidden shadow-xl ring-1 ring-gray-700 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-[#1a1f2e]">
                                <tr>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">
                                        Ordem
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">
                                        Título
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">
                                        Vídeo ID
                                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                                            Módulo
                                        </th>
                                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                                            Duração
                                        </th>
                                        <th scope="col" className="relative py-3 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Ações</span>
                                        </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700 bg-[#0f1419]">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={lessons}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {lessons.map((lesson) => (
                                            <SortableRow
                                                key={lesson.id}
                                                lesson={lesson}
                                                modules={modules}
                                                handleOpenModal={handleOpenModal}
                                                handleDelete={handleDelete}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
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
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Texto de Apoio
                    </label>
                    <textarea
                        className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 text-white bg-[#0f1419] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
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
