import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { toast } from 'sonner';
import { Save, Image as ImageIcon } from 'lucide-react';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        banner_url: '',
        banner_title: '',
        banner_subtitle: ''
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('site_config')
                .select('*');

            if (error) throw error;

            if (data) {
                const newConfig = { ...config };
                data.forEach((item: any) => {
                    if (item.key === 'banner_url') newConfig.banner_url = item.value;
                    if (item.key === 'banner_title') newConfig.banner_title = item.value;
                    if (item.key === 'banner_subtitle') newConfig.banner_subtitle = item.value;
                });
                setConfig(newConfig);
            }
        } catch (error) {
            console.error('Error fetching config:', error);
            toast.error('Erro ao carregar configurações');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Update each config using the RPC we created
            await Promise.all([
                supabase.rpc('update_site_config', { config_key: 'banner_url', config_value: config.banner_url }),
                supabase.rpc('update_site_config', { config_key: 'banner_title', config_value: config.banner_title }),
                supabase.rpc('update_site_config', { config_key: 'banner_subtitle', config_value: config.banner_subtitle }),
            ]);

            toast.success('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Error saving config:', error);
            toast.error('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-white">Carregando...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-8">Configurações do Site</h1>

            <div className="bg-[#1a1f2e] rounded-xl shadow-lg border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-lg font-medium text-white flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-primary" />
                        Banner da Área de Membros
                    </h2>
                    <p className="mt-1 text-sm text-gray-400">
                        Personalize a imagem e os textos que aparecem no topo da área do aluno.
                    </p>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-6">
                    <Input
                        label="URL da Imagem do Banner"
                        value={config.banner_url}
                        onChange={(e) => setConfig({ ...config, banner_url: e.target.value })}
                        placeholder="https://..."
                    />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Input
                            label="Título Principal"
                            value={config.banner_title}
                            onChange={(e) => setConfig({ ...config, banner_title: e.target.value })}
                            placeholder="Ex: Bem vindo à Advanx Academy"
                        />

                        <Input
                            label="Subtítulo"
                            value={config.banner_subtitle}
                            onChange={(e) => setConfig({ ...config, banner_subtitle: e.target.value })}
                            placeholder="Ex: Domine novas habilidades..."
                        />
                    </div>

                    {/* Preview */}
                    <div className="mt-8">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Pré-visualização</label>
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-700 group">
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-10" />
                            {config.banner_url ? (
                                <img
                                    src={config.banner_url}
                                    alt="Banner Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
                                    Sem imagem
                                </div>
                            )}
                            <div className="absolute inset-0 z-20 flex items-center px-8">
                                <div className="max-w-lg">
                                    <h3 className="text-2xl font-bold text-white mb-2">{config.banner_title || 'Título do Banner'}</h3>
                                    <p className="text-sm text-gray-300">{config.banner_subtitle || 'Subtítulo do banner aparecerá aqui.'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" isLoading={saving}>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
