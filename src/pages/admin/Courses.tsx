import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
import { GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

type Course = Database['public']['Tables']['courses']['Row'];

// Sortable Row Component
const SortableRow = ({ course, handleOpenModal, handleDelete, toggleStatus }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: course.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr ref={setNodeRef} style={style} className="hover:bg-gray-800/50 transition-colors">
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                <div className="flex items-center gap-3">
                    <button {...attributes} {...listeners} className="cursor-grab text-gray-500 hover:text-white">
                        <GripVertical className="h-5 w-5" />
                    </button>
                    {course.order_position}
                </div>
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-white">
                {course.title}
            </td>
            <td className="px-3 py-4 text-sm text-gray-300 max-w-xs truncate">
                {course.description}
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                <button
                    onClick={() => toggleStatus(course)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${course.status_curso
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-red-900/30 text-red-400'
                        }`}
                >
                    {course.status_curso ? 'Ativo' : 'Inativo'}
                </button>
            </td>
            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <button
                    onClick={() => handleOpenModal(course)}
                    className="text-primary hover:text-primary/80 mr-4 transition-colors"
                >
                    <Pencil className="h-4 w-4" />
                </button>
                <button
                    onClick={() => handleDelete(course.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </td>
        </tr>
    );
};

const Courses = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        thumbnail_url: '',
        order_position: 0,
        status_curso: true,
    });
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
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .order('order_position', { ascending: true });

            if (error) throw error;
            setCourses(data || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            toast.error('Erro ao carregar cursos');
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setCourses((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over?.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update order in DB
                updateOrder(newItems);

                return newItems;
            });
        }
    };

    const updateOrder = async (items: Course[]) => {
        try {
            const updates = items.map((item, index) => ({
                id: item.id,
                order_position: index,
            }));

            // Supabase upsert for bulk update is tricky without all fields.
            // Simple loop for now (MVP) or create an RPC. Loop is fine for small lists.
            for (const item of updates) {
                await supabase
                    .from('courses')
                    .update({ order_position: item.order_position })
                    .eq('id', item.id);
            }

            toast.success('Ordem atualizada!');
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Erro ao salvar ordem.');
        }
    };

    const handleOpenModal = (course?: Course) => {
        if (course) {
            setEditingCourse(course);
            setFormData({
                title: course.title,
                description: course.description || '',
                thumbnail_url: course.thumbnail_url || '',
                order_position: course.order_position,
                status_curso: course.status_curso ?? true,
            });
        } else {
            setEditingCourse(null);
            setFormData({
                title: '',
                description: '',
                thumbnail_url: '',
                status_curso: true,
                order_position: courses.length + 1,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setFormData({
            title: '',
            description: '',
            thumbnail_url: '',
            order_position: 0,
            status_curso: true,
        });
        setIsModalOpen(false);
        setEditingCourse(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingCourse) {
                const { error } = await supabase
                    .from('courses')
                    .update({
                        title: formData.title,
                        description: formData.description || null,
                        thumbnail_url: formData.thumbnail_url || null,
                        order_position: formData.order_position,
                        status_curso: formData.status_curso,
                    } as any)
                    .eq('id', editingCourse.id);

                if (error) throw error;
                toast.success('Curso atualizado com sucesso');
            } else {
                const { error } = await supabase
                    .from('courses')
                    .insert([{
                        title: formData.title,
                        description: formData.description || null,
                        thumbnail_url: formData.thumbnail_url || null,
                        order_position: formData.order_position,
                        status_curso: formData.status_curso,
                    }] as any);

                if (error) throw error;
                toast.success('Curso criado com sucesso');
            }

            fetchCourses();
            handleCloseModal();

        } catch (error: any) {
            console.error('Error saving course:', error);
            toast.error(`Erro ao salvar curso: ${error.message || error.error_description || 'Erro desconhecido'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este curso?')) return;

        try {
            const { error } = await supabase
                .from('courses')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Curso excluído com sucesso');
            fetchCourses();
        } catch (error) {
            toast.error('Erro ao excluir curso');
            console.error(error);
        }
    };

    const toggleStatus = async (course: Course) => {
        try {
            const { error } = await supabase
                .from('courses')
                .update({ status_curso: !course.status_curso })
                .eq('id', course.id);

            if (error) throw error;
            toast.success(`Curso ${!course.status_curso ? 'ativado' : 'desativado'} com sucesso`);
            fetchCourses();
        } catch (error) {
            console.error('Error toggling status:', error);
            toast.error('Erro ao alterar status do curso');
        }
    };

    return (
        <div>
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-bold text-white">Cursos</h1>
                    <p className="mt-2 text-sm text-gray-400">
                        Gerencie os cursos disponíveis na plataforma.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Curso
                    </Button>
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
                                            Descrição
                                        </th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Ações</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700 bg-[#0f1419]">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-8 text-gray-400">Carregando...</td>
                                        </tr>
                                    ) : courses.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-8 text-gray-400">Nenhum curso encontrado.</td>
                                        </tr>
                                    ) : (
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <SortableContext
                                                items={courses}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {courses.map((course) => (
                                                    <SortableRow
                                                        key={course.id}
                                                        course={course}
                                                        handleOpenModal={handleOpenModal}
                                                        handleDelete={handleDelete}
                                                        toggleStatus={toggleStatus}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </DndContext>
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
                title={editingCourse ? 'Editar Curso' : 'Novo Curso'}
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
                    <p className="mt-2 text-xs text-gray-400">
                        <strong>Dica:</strong> Para melhor visualização na área de membros, use imagens verticais com proporção 2:3 (ex: 1080x1620px).
                    </p>

                    <Input
                        label="URL da Thumbnail (Opcional)"
                        value={formData.thumbnail_url}
                        onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    />

                    {/* Status Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div>
                            <label className="text-sm font-medium text-gray-300">Status do Curso</label>
                            <p className="text-xs text-gray-500 mt-1">
                                Cursos inativos não aparecem para os alunos
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, status_curso: !formData.status_curso })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.status_curso ? 'bg-green-600' : 'bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.status_curso ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
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
        </div >
    );
};

export default Courses;
