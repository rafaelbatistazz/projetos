import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import {
    LogOut,
    Menu,
    X,
    ChevronDown,
    ChevronRight,
    PlayCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import Button from '../components/ui/Button';

type Course = Database['public']['Tables']['courses']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];

interface CourseStructure extends Course {
    modules: (Module & {
        lessons: Lesson[];
    })[];
}

const MemberLayout = () => {
    const { logout, userEmail } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [courses, setCourses] = useState<CourseStructure[]>([]);
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
    const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        // Fetch all content hierarchy
        // Note: This might be heavy for a large app, but for MVP it's fine.
        // We can optimize by fetching only courses first, then modules on expand.
        try {
            const { data: coursesData, error: coursesError } = await supabase
                .from('courses')
                .select('*')
                .order('order_position');

            if (coursesError) throw coursesError;

            const structure: CourseStructure[] = [];

            for (const course of coursesData || []) {
                const { data: modulesData, error: modulesError } = await supabase
                    .from('modules')
                    .select('*')
                    .eq('course_id', course.id)
                    .order('order_position');

                if (modulesError) throw modulesError;

                const modulesWithLessons = [];
                for (const module of modulesData || []) {
                    const { data: lessonsData, error: lessonsError } = await supabase
                        .from('lessons')
                        .select('*')
                        .eq('module_id', module.id)
                        .order('order_position');

                    if (lessonsError) throw lessonsError;

                    modulesWithLessons.push({
                        ...module,
                        lessons: lessonsData || [],
                    });
                }

                structure.push({
                    ...course,
                    modules: modulesWithLessons,
                });
            }

            setCourses(structure);

            // Auto-expand first course and module
            if (structure.length > 0) {
                setExpandedCourses({ [structure[0].id]: true });
                if (structure[0].modules.length > 0) {
                    setExpandedModules({ [structure[0].modules[0].id]: true });
                }
            }

        } catch (error) {
            console.error('Error fetching content:', error);
        }
    };

    const toggleCourse = (courseId: string) => {
        setExpandedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }));
    };

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-20 sticky top-0">
                <div className="flex items-center">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                    >
                        {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                    <div className="ml-4 lg:ml-0 flex items-center">
                        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">A</span>
                        </div>
                        <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:block">Advanx Academy</span>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500 hidden sm:block">{userEmail}</span>
                    <Button variant="ghost" onClick={handleLogout} className="text-gray-500 hover:text-red-600">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className={cn(
                    "fixed inset-y-0 left-0 z-10 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:static lg:transform-none mt-16 lg:mt-0 overflow-y-auto pb-20",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="p-4 space-y-4">
                        {courses.map(course => (
                            <div key={course.id} className="space-y-2">
                                <button
                                    onClick={() => toggleCourse(course.id)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <span className="truncate">{course.title}</span>
                                    {expandedCourses[course.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>

                                {expandedCourses[course.id] && (
                                    <div className="pl-2 space-y-2">
                                        {course.modules.map(module => (
                                            <div key={module.id} className="space-y-1">
                                                <button
                                                    onClick={() => toggleModule(module.id)}
                                                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                                >
                                                    <span className="truncate font-medium">{module.title}</span>
                                                    {expandedModules[module.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                                </button>

                                                {expandedModules[module.id] && (
                                                    <div className="pl-4 space-y-1">
                                                        {module.lessons.map(lesson => {
                                                            const isActive = location.pathname === `/lesson/${lesson.id}`;
                                                            return (
                                                                <Link
                                                                    key={lesson.id}
                                                                    to={`/lesson/${lesson.id}`}
                                                                    onClick={() => setIsSidebarOpen(false)}
                                                                    className={cn(
                                                                        "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                                                        isActive
                                                                            ? "bg-primary/10 text-primary"
                                                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                                                    )}
                                                                >
                                                                    <PlayCircle className={cn(
                                                                        "mr-2 h-4 w-4 flex-shrink-0",
                                                                        isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-500"
                                                                    )} />
                                                                    <span className="truncate">{lesson.title}</span>
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
                    <Outlet context={{ courses }} />
                </main>
            </div>
        </div>
    );
};

export default MemberLayout;
