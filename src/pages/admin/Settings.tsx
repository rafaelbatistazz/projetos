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
        banner_subtitle: '',
        locked_course_message: '',
        locked_course_button_text: '',
        locked_course_button_url: '',
        social_instagram: '',
        social_facebook: '',
        social_linkedin: '',
        social_tiktok: ''
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
                    if (item.key === 'locked_course_message') newConfig.locked_course_message = item.value;
                    if (item.key === 'locked_course_button_text') newConfig.locked_course_button_text = item.value;
                    if (item.key === 'locked_course_button_url') newConfig.locked_course_button_url = item.value;
                    if (item.key === 'social_instagram') newConfig.social_instagram = item.value;
                    if (item.key === 'social_facebook') newConfig.social_facebook = item.value;
                    if (item.key === 'social_linkedin') newConfig.social_linkedin = item.value;
                    if (item.key === 'social_tiktok') newConfig.social_tiktok = item.value;
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
                supabase.rpc('update_site_config', { config_key: 'locked_course_message', config_value: config.locked_course_message }),
                supabase.rpc('update_site_config', { config_key: 'locked_course_button_text', config_value: config.locked_course_button_text }),
                supabase.rpc('update_site_config', { config_key: 'locked_course_button_url', config_value: config.locked_course_button_url }),
                supabase.rpc('update_site_config', { config_key: 'social_instagram', config_value: config.social_instagram }),
                supabase.rpc('update_site_config', { config_key: 'social_facebook', config_value: config.social_facebook }),
                supabase.rpc('update_site_config', { config_key: 'social_linkedin', config_value: config.social_linkedin }),
                supabase.rpc('update_site_config', { config_key: 'social_tiktok', config_value: config.social_tiktok }),
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

                <form onSubmit={handleSave} className="space-y-8">
                    <div className="p-6 space-y-6">
                        <div>
                            <Input
                                label="URL da Imagem do Banner"
                                value={config.banner_url}
                                onChange={(e) => setConfig({ ...config, banner_url: e.target.value })}
                                placeholder="https://..."
                            />
                            <p className="mt-2 text-sm text-gray-400">
                                💡 <strong>Dimensões recomendadas:</strong> 2070x500px (proporção 4:1) para melhor qualidade em todos os dispositivos
                            </p>
                        </div>

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
                    </div>

                    {/* Locked Course CTA Configuration */}
                    <div className="border-t border-gray-700">
                        <div className="p-6 border-b border-gray-700">
                            <h2 className="text-lg font-medium text-white flex items-center gap-2">
                                🔒 Cursos Bloqueados
                            </h2>
                            <p className="mt-1 text-sm text-gray-400">
                                Configure a mensagem e o botão que aparecem quando um cliente tenta acessar um curso bloqueado.
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Mensagem de Bloqueio
                                </label>
                                <textarea
                                    value={config.locked_course_message}
                                    onChange={(e) => setConfig({ ...config, locked_course_message: e.target.value })}
                                    placeholder="Ex: Este curso não está disponível no seu plano atual."
                                    className="w-full px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <Input
                                    label="Texto do Botão"
                                    value={config.locked_course_button_text}
                                    onChange={(e) => setConfig({ ...config, locked_course_button_text: e.target.value })}
                                    placeholder="Ex: Falar com Suporte"
                                />

                                <Input
                                    label="Link do Botão"
                                    value={config.locked_course_button_url}
                                    onChange={(e) => setConfig({ ...config, locked_course_button_url: e.target.value })}
                                    placeholder="Ex: https://wa.me/5511999999999"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Social Media Configuration */}
                    <div className="border-t border-gray-700">
                        <div className="p-6 border-b border-gray-700">
                            <h2 className="text-lg font-medium text-white flex items-center gap-2">
                                🌐 Redes Sociais
                            </h2>
                            <p className="mt-1 text-sm text-gray-400">
                                Configure os links das suas redes sociais para aparecerem no topo da área do aluno.
                            </p>
                        </div>

                        <div className="p-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <Input
                                label="Instagram"
                                value={config.social_instagram}
                                onChange={(e) => setConfig({ ...config, social_instagram: e.target.value })}
                                placeholder="https://instagram.com/seu_perfil"
                            />
                            <Input
                                label="Facebook"
                                value={config.social_facebook}
                                onChange={(e) => setConfig({ ...config, social_facebook: e.target.value })}
                                placeholder="https://facebook.com/sua_pagina"
                            />
                            <Input
                                label="LinkedIn"
                                value={config.social_linkedin}
                                onChange={(e) => setConfig({ ...config, social_linkedin: e.target.value })}
                                placeholder="https://linkedin.com/company/sua_empresa"
                            />
                            <Input
                                label="TikTok"
                                value={config.social_tiktok}
                                onChange={(e) => setConfig({ ...config, social_tiktok: e.target.value })}
                                placeholder="https://tiktok.com/@seu_perfil"
                            />
                        </div>

                        {/* Single Save Button at the end */}
                        <div className="flex justify-end pt-4 border-t border-gray-700 mt-6 mx-6 mb-6">
                            <Button type="submit" isLoading={saving}>
                                <Save className="h-4 w-4 mr-2" />
                                Salvar Todas as Configurações
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
