import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import { Plus, Trash2, Check, X as XIcon } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

type Client = Database['public']['Tables']['clientes']['Row'];

const Clients = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active');

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            toast.error('Erro ao carregar clientes');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setEmail('');
        setName('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase
                .from('clientes')
                .insert([{
                    email: email,
                    nome: name,
                    status_cliente: true, // Default to active
                }] as any);

            if (error) throw error;
            toast.success('Cliente adicionado com sucesso');
            fetchClients();
            handleCloseModal();
        } catch (error) {
            toast.error('Erro ao adicionar cliente');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (client: Client) => {
        try {
            const { error } = await supabase
                .from('clientes')
                .update({ status_cliente: !client.status_cliente } as any)
                .eq('id', client.id);

            if (error) throw error;
            toast.success(`Acesso ${!client.status_cliente ? 'ativado' : 'desativado'} com sucesso`);
            fetchClients();
        } catch (error) {
            toast.error('Erro ao atualizar status');
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return;

        try {
            const { error } = await supabase
                .from('clientes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Cliente excluído com sucesso');
            fetchClients();
        } catch (error) {
            toast.error('Erro ao excluir cliente');
            console.error(error);
        }
    };

    const filteredClients = clients.filter(client => {
        if (filterActive === 'all') return true;
        if (filterActive === 'active') return client.status_cliente;
        if (filterActive === 'inactive') return !client.status_cliente;
        return true;
    });

    return (
        <div>
            {/* ... (header remains same) ... */}
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-bold text-white">Clientes</h1>
                    <p className="mt-2 text-sm text-gray-400">
                        Gerencie os membros da plataforma.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <Button onClick={handleOpenModal}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Cliente
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="mt-8 flex gap-2">
                <button
                    onClick={() => setFilterActive('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filterActive === 'all'
                        ? 'bg-primary text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                >
                    Todos
                </button>
                <button
                    onClick={() => setFilterActive('active')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filterActive === 'active'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                >
                    Ativos
                </button>
                <button
                    onClick={() => setFilterActive('inactive')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filterActive === 'inactive'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                >
                    Inativos
                </button>
            </div>

            <div className="mt-4 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow-xl ring-1 ring-gray-700 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-[#1a1f2e]">
                                    <tr>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">
                                            Nome
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">
                                            Email
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">
                                            Status
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">
                                            Data de Cadastro
                                        </th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Ações</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700 bg-[#0f1419]">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-gray-400">Carregando...</td>
                                        </tr>
                                    ) : filteredClients.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-gray-400">Nenhum cliente encontrado.</td>
                                        </tr>
                                    ) : (
                                        filteredClients.map((client) => (
                                            <tr key={client.id} className="hover:bg-gray-800/50 transition-colors">
                                                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-white">
                                                    {client.nome || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                                                    {client.email}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${client.status_cliente ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                                                        }`}>
                                                        {client.status_cliente ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                                                    {new Date(client.created_at).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <button
                                                        onClick={() => handleToggleStatus(client)}
                                                        className={`mr-4 ${client.status_cliente ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                                                        title={client.status_cliente ? 'Desativar' : 'Ativar'}
                                                    >
                                                        {client.status_cliente ? <XIcon className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(client.id)}
                                                        className="text-red-400 hover:text-red-300"
                                                        title="Excluir"
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
                title="Novo Cliente"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome completo"
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="email@exemplo.com"
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

export default Clients;
