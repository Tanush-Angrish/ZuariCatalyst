import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Camera, User, Mail, Building, Hash, Phone, Briefcase, Shield, Loader2, CheckCircle } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

// ─── Avatar Component ─────────────────────────────────────────────────────────
function Avatar({ user, size = 'lg', className = '' }) {
  const sizeMap = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-24 w-24 text-2xl',
    xl: 'h-32 w-32 text-3xl',
  };
  const sizeClass = sizeMap[size] || sizeMap.lg;
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (user?.profilePhotoUrl) {
    return (
      <img
        src={api.getFileUrl(user.profilePhotoUrl)}
        alt={user.name}
        className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-md ${className}`}
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-brand-blue to-blue-400 text-white flex items-center justify-center font-bold shrink-0 shadow-md ${className}`}>
      {initials}
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const roleDisplay = role === 'Superadmin' ? 'Central Team' : role;
  const colorMap = {
    'Superadmin': 'bg-purple-100 text-purple-800 border-purple-200',
    'Org Admin': 'bg-blue-100 text-blue-800 border-blue-200',
    'Management': 'bg-amber-100 text-amber-800 border-amber-200',
    'Employee': 'bg-green-100 text-green-800 border-green-200',
  };
  const colorClass = colorMap[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
      <Shield size={11} />
      {roleDisplay}
    </span>
  );
}

// ─── Read-Only Field ──────────────────────────────────────────────────────────
function InfoField({ icon: Icon, label, value, placeholder = 'Not set' }) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-gray-100 last:border-0">
      <div className="mt-0.5 p-2 rounded-lg bg-gray-50 text-gray-500 shrink-0">
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className={`text-sm font-medium ${value ? 'text-gray-900' : 'text-gray-400 italic'} truncate`}>
          {value || placeholder}
        </p>
      </div>
    </div>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef();

  const roles = Array.isArray(user?.roles) ? user.roles : [];

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    try {
      // Step 1: Upload & compress the photo
      const formData = new FormData();
      formData.append('photo', file);
      const { url } = await api.uploadProfilePhoto(formData);

      // Step 2: Save the URL to the user record
      await api.updateProfilePhoto(user.id, url);

      // Step 3: Refresh user context so photo appears everywhere instantly
      await refreshUser();

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-black">My Profile</h1>
        <p className="text-gray-500 mt-1">Your identity and account information.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Header / Avatar Section */}
        <div className="relative bg-gradient-to-br from-brand-blue/5 via-blue-50 to-purple-50 px-6 py-8 flex flex-col sm:flex-row items-center gap-6 border-b border-gray-100">
          {/* Avatar with upload overlay */}
          <div id="profile-photo-section" className="relative group shrink-0">
            {user.profilePhotoUrl ? (
              <img
                src={api.getFileUrl(user.profilePhotoUrl)}
                alt={user.name}
                className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-brand-blue to-blue-400 text-white flex items-center justify-center font-bold text-2xl border-4 border-white shadow-lg">
                {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            )}

            {/* Upload overlay */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Change photo"
            >
              {uploading
                ? <Loader2 size={20} className="animate-spin" />
                : <Camera size={20} />
              }
              <span className="text-[10px] mt-1 font-semibold">{uploading ? 'Uploading...' : 'Change'}</span>
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            {user.title && <p className="text-sm text-gray-500 mt-0.5">{user.title}</p>}
            <div className="flex flex-wrap gap-1.5 mt-2 justify-center sm:justify-start">
              {roles.map(r => <RoleBadge key={r} role={r} />)}
            </div>
          </div>

          {/* Upload status messages */}
          {uploadSuccess && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-200">
              <CheckCircle size={13} /> Photo updated!
            </div>
          )}
          {uploadError && (
            <div className="absolute top-3 right-3 bg-red-100 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-red-200 max-w-[200px] truncate">
              {uploadError}
            </div>
          )}
        </div>

        {/* Upload tip */}
        <div className="px-6 py-2.5 bg-blue-50/50 border-b border-blue-100 text-xs text-blue-600 flex items-center gap-2">
          <Camera size={12} className="shrink-0" />
          Hover over your photo and click to upload a new one.
        </div>

        {/* Info Fields */}
        <div className="px-6 py-2">
          <InfoField icon={User} label="Full Name" value={user.name} />
          <InfoField icon={Mail} label="Email Address" value={user.email} />
          <InfoField icon={Briefcase} label="Title / Designation" value={user.title} />
          <InfoField icon={Building} label="Organization / Unit" value={user.organization} />
          <InfoField icon={Hash} label="Employee ID" value={user.employeeId} />
          <InfoField icon={Phone} label="Mobile Number" value={user.mobileNumber} />
        </div>

        {/* Roles Section */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Shield size={12} /> Assigned Roles
          </p>
          <div className="flex flex-wrap gap-2">
            {roles.length > 0
              ? roles.map(r => <RoleBadge key={r} role={r} />)
              : <span className="text-sm text-gray-400 italic">No roles assigned</span>
            }
          </div>
          {roles.length > 1 && (
            <p className="text-xs text-gray-500 mt-2">
              You have multiple roles. Use the role toggle in the navbar to switch views.
            </p>
          )}
        </div>
      </div>

      {/* Note */}
      <p className="text-xs text-center text-gray-400">
        Profile details are managed by your administrator. Contact Central Team for any changes.
      </p>
    </div>
  );
}

// ─── Export Avatar for use in other components ────────────────────────────────
export { Avatar };
