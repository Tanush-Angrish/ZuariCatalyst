import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProjectModal from '../../components/ProjectModal';
import { Badge } from '../../components/ui/Badge';
import {
  FolderKanban, Calendar, Sparkles, Clock, Building,
  CheckCircle2, AlertCircle, Loader2, Search, Filter
} from 'lucide-react';
import { api } from '../../services/api';

const STATUS_COLORS = {
  Initiated:   'bg-blue-100 text-blue-700 border-blue-200',
  'In Progress': 'bg-amber-100 text-amber-700 border-amber-200',
  'On Hold':   'bg-gray-100 text-gray-600 border-gray-200',
  Completed:   'bg-green-100 text-green-700 border-green-200',
};

const STATUS_ICONS = {
  Initiated:    <Clock size={11} />,
  'In Progress': <AlertCircle size={11} />,
  'On Hold':    <AlertCircle size={11} />,
  Completed:    <CheckCircle2 size={11} />,
};

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Project Card ──────────────────────────────────────────────────────────
function ProjectCard({ project, onClick }) {
  const completedSteps = (project.steps || []).filter(s => s.status === 'Completed').length;
  const totalSteps = (project.steps || []).length;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col group outline-none focus-visible:ring-2 focus-visible:ring-blue-600 overflow-hidden"
    >
      {/* Top accent */}
      <div className={`h-1 w-full ${
        project.status === 'Completed' ? 'bg-green-400' :
        project.status === 'In Progress' ? 'bg-amber-400' :
        project.status === 'On Hold' ? 'bg-gray-300' : 'bg-blue-400'
      }`} />

      <div className="p-5 flex-1 flex flex-col gap-3">
        {/* Project ID + status */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-bold font-mono text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full tracking-widest">
            {project.projectId}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${STATUS_COLORS[project.status] || STATUS_COLORS.Initiated}`}>
            {STATUS_ICONS[project.status]}
            {project.status}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
          {project.title}
        </h3>

        {/* AI Summary */}
        {project.aiSummary && (
          <div className="flex items-start gap-1.5 text-xs text-gray-500 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-2.5">
            <Sparkles size={10} className="text-blue-400 mt-0.5 shrink-0" />
            <span className="italic line-clamp-2">"{project.aiSummary}"</span>
          </div>
        )}

        {/* Step progress */}
        {totalSteps > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Action Steps</span>
              <span>{completedSteps}/{totalSteps} done</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between gap-2 bg-gray-50/50">
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <Building size={9} />
          <span className="truncate">{project.orgId}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          {project.deadline ? (
            <><Calendar size={9} />Due {fmtDate(project.deadline)}</>
          ) : (
            <><Clock size={9} />Started {fmtDate(project.createdAt)}</>
          )}
        </div>
      </div>
    </div>
  );
}


export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getProjects({
        userId: user.id,
        role: user.role,
        organization: user.organization || ''
      });
      setProjects(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleProjectUpdated = (updated) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
    if (selectedProject?.id === updated.id) {
      setSelectedProject(prev => ({ ...prev, ...updated }));
    }
  };

  const statuses = ['All', 'Initiated', 'In Progress', 'On Hold', 'Completed'];

  const filtered = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.projectId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0057a8] to-[#003f7a] p-8 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest bg-white/20 text-white px-3 py-1 rounded-full border border-white/10">
              Project Lifecycle
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Projects</h1>
          <p className="text-blue-100 max-w-2xl text-sm">
            Track approved ideas from initiation to completion. Manage action steps, collaborate via chat, and use AI for intelligent planning.
          </p>
          <div className="flex items-center gap-4 mt-4 text-white/60 text-xs">
            <span><strong className="text-white">{projects.length}</strong> total projects</span>
            <span><strong className="text-white">{projects.filter(p => p.status === 'In Progress').length}</strong> in progress</span>
            <span><strong className="text-white">{projects.filter(p => p.status === 'Completed').length}</strong> completed</span>
          </div>
        </div>
        <FolderKanban className="w-48 h-48 absolute -right-8 -bottom-8 text-white/5" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                statusFilter === s
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="animate-spin mr-2" size={24} />
          <span>Loading projects...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-16 text-center bg-white">
          <FolderKanban className="mx-auto h-14 w-14 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
          </h3>
          <p className="text-sm text-gray-400">
            {projects.length === 0
              ? 'Projects are created automatically when ideas are approved.'
              : 'Try changing your search or status filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 animate-fade-in-up">
          {filtered.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => setSelectedProject(project)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          currentUser={user}
          onClose={() => setSelectedProject(null)}
          onProjectUpdated={handleProjectUpdated}
        />
      )}
    </div>
  );
}
