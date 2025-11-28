
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Course = Database['public']['Tables']['courses']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];

// Sortable Row Component
const SortableRow = ({ module, courses, handleOpenModal, handleDelete }: { module: Module, courses: Course[], handleOpenModal: (module: Module) => void, handleDelete: (id: string) => void }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: module.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr ref={setNodeRef} style={style} className="hover:bg-gray-800/50 transition-colors">
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">
                <div className="flex items-center gap-3">
                    <button {...attributes} {...listeners} className="cursor-grab text-gray-500 hover:text-white">
                        <GripVertical className="h-5 w-5" />
                    </button>
                    {module.order_position}
                </div>
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-white">
                {module.title}
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                {courses.find((c: Course) => c.id === module.course_id)?.title || 'N/A'}
            </td>
            <td className="px-3 py-4 text-sm text-gray-300 max-w-xs truncate">
                {module.description}
            </td>
            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <button
                    onClick={() => handleOpenModal(module)}
                    className="text-primary hover:text-primary/80 mr-4 transition-colors"
                >
                    <Pencil className="h-4 w-4" />
                </button>
                <button
                    onClick={() => handleDelete(module.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </td>
        </tr>
    );
};

const Modules = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<Module | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        course_id: '',
        order_position: 0,
        thumbnail_url: '',
    });
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [saving, setSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch courses for the dropdown
            const { data: coursesData, error: coursesError } = await supabase
                .from('courses')
                .select('*')
                .order('title');

            if (coursesError) throw coursesError;
            setCourses(coursesData || []);

            // If a course is selected, fetch its modules
            if (selectedCourseId) {
                fetchModules(selectedCourseId);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Erro ao carregar dados');
            setLoading(false);
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

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setModules((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over?.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update order in DB
                updateOrder(newItems);

                return newItems;
            });
        }
    };

    const updateOrder = async (items: Module[]) => {
        try {
            const updates = items.map((item, index) => ({
                id: item.id,
                order_position: index,
            }));

            for (const item of updates) {
                await supabase
                    .from('modules')
                    .update({ order_position: item.order_position })
                    .eq('id', item.id);
            }

            toast.success('Ordem atualizada!');
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Erro ao salvar ordem.');
        }
    };

    const handleOpenModal = (module?: Module) => {
        if (module) {
            setEditingModule(module);
            setFormData({
                title: module.title,
                description: module.description || '',
                order_position: module.order_position,
                course_id: module.course_id,
                thumbnail_url: '',
            });
        } else {
            setEditingModule(null);
            setFormData({
                title: '',
                description: '',
                order_position: modules.length + 1,
                course_id: selectedCourseId,
                thumbnail_url: '',
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
        } catch (error: any) {
            console.error('Error saving module:', error);
            toast.error(`Erro ao salvar módulo: ${error.message || error.error_description || 'Erro desconhecido'} `);
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
                    <h1 className="text-2xl font-bold text-white">Módulos</h1>
                    <p className="mt-2 text-sm text-gray-400">
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
                <label htmlFor="course-select" className="block text-sm font-medium text-gray-300 mb-2">
                    Selecione o Curso
                </label>
                <select
                    id="course-select"
                    className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-[#1a1f2e] text-white"
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
                        <div className="overflow-hidden shadow-xl ring-1 ring-gray-700 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-[#1a1f2e]">
                                    <tr>
                                        <th scope="col" className="py-3 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400 sm:pl-6">
                                            Título
                                        </th>
                                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                                            Curso
                                        </th>
                                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                                            Descrição
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
                                            items={modules}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {modules.map((module) => (
                                                <SortableRow
                                                    key={module.id}
                                                    module={module}
                                                    courses={courses}
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
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Descrição
                        </label>
                        <textarea
                            className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 text-white bg-[#0f1419] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

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
