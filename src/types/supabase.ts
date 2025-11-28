export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            clientes: {
                Row: {
                    id: string
                    email: string
                    nome: string | null
                    status_cliente: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    nome?: string | null
                    status_cliente?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    nome?: string | null
                    status_cliente?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            courses: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    thumbnail_url: string | null
                    status_curso: boolean
                    order_position: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    thumbnail_url?: string | null
                    status_curso?: boolean
                    order_position?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    thumbnail_url?: string | null
                    status_curso?: boolean
                    order_position?: number
                    created_at?: string
                }
                Relationships: []
            }
            modules: {
                Row: {
                    id: string
                    course_id: string
                    title: string
                    description: string | null
                    order_position: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    course_id: string
                    title: string
                    description?: string | null
                    order_position?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    course_id?: string
                    title?: string
                    description?: string | null
                    order_position?: number
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "modules_course_id_fkey"
                        columns: ["course_id"]
                        referencedRelation: "courses"
                        referencedColumns: ["id"]
                    }
                ]
            }
            lessons: {
                Row: {
                    id: string
                    module_id: string
                    title: string
                    youtube_video_id: string
                    support_text: string | null
                    duration: string | null
                    order_position: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    module_id: string
                    title: string
                    youtube_video_id: string
                    support_text?: string | null
                    duration?: string | null
                    order_position?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    module_id?: string
                    title?: string
                    youtube_video_id?: string
                    support_text?: string | null
                    duration?: string | null
                    order_position?: number
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "lessons_module_id_fkey"
                        columns: ["module_id"]
                        referencedRelation: "modules"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            check_user_access: {
                Args: {
                    email_input: string
                }
                Returns: boolean
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
