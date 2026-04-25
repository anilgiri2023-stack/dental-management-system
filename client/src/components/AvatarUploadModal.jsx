import { useState, useRef } from 'react';
import { Camera, X, Loader2, Upload, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadFetch } from '../utils/api';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function validateFile(file) {
  if (!file) return 'Please select an image.';
  if (!ALLOWED_TYPES.includes(file.mimetype || file.type)) {
    return 'Only JPG, PNG, and WebP images are allowed.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return `Image is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Max: 2 MB.`;
  }
  return null;
}

/**
 * AvatarUploadModal
 * @param {boolean} isOpen - whether the modal is visible
 * @param {Function} onClose - called when user closes the modal (only if dismissible)
 * @param {boolean} required - if true, shows "Recommended" badge; modal is always dismissible
 * @param {string|null} currentAvatar - current avatar URL (if any)
 * @param {Function} onSuccess - called with new avatar_url after successful upload
 */
export default function AvatarUploadModal({ isOpen, onClose, required = false, currentAvatar = null, onSuccess }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const validationError = validateFile(selected);
    if (validationError) {
      setError(validationError);
      setFile(null);
      setPreview(null);
      return;
    }

    setError('');
    setFile(selected);
    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image to upload.');
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      console.log('Sending avatar to backend route...');
      const result = await uploadFetch('/avatar/upload', formData);
      
      console.log('✅ Avatar uploaded successfully:', result.avatar_url);
      onSuccess(result.avatar_url);
    } catch (err) {
      console.error('❌ Avatar upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const displayImage = preview || currentAvatar;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-gray-900">
              {currentAvatar ? 'Update Photo' : 'Profile Photo'}
            </h3>
            {required && !currentAvatar && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                Recommended
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {/* Avatar preview */}
          <div className="flex justify-center">
            <div
              className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-emerald-100 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {displayImage ? (
                <img
                  src={displayImage}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400">
            Click the circle to select a photo
          </p>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* File info */}
          {file && (
            <div className="text-center text-xs text-gray-500 bg-gray-50 rounded-lg py-2 px-3">
              {file.name} — {(file.size / (1024 * 1024)).toFixed(2)} MB
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm"
            >
              {required && !currentAvatar ? 'Skip for now' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className={`flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm ${
                (uploading || !file) ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="w-4 h-4" /> Upload</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
