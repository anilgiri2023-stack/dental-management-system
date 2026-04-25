import { useState } from 'react';
import { FileText, X, Loader2, Upload } from 'lucide-react';
import { uploadFetch, apiFetch } from '../utils/api';

// ─── Validation constants ───
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = '.pdf, .jpg, .jpeg, .png';

function validateFile(file) {
  if (!file) return 'Please select a file to upload.';
  console.log('📎 Selected file:', { name: file.name, size: file.size, type: file.type });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type: "${file.type}". Allowed: PDF, JPG, PNG.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return `File is too large (${sizeMB} MB). Maximum allowed: 5 MB.`;
  }
  return null; // valid
}

export default function ReportUploadModal({ isOpen, onClose, appointment, existingReport = null, onSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState(existingReport?.title || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !appointment) return null;

  const isEdit = !!existingReport;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    console.log('📎 File selected:', { name: selected.name, size: selected.size, type: selected.type });

    const validationError = validateFile(selected);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setError('');
    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate file for new uploads
    if (!isEdit && !file) {
      setError('Please select a file to upload.');
      return;
    }

    // Validate file if one is selected (for both new and edit)
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setUploading(true);
    console.log('📤 Starting upload...', { isEdit, file: file?.name, title, appointmentId: appointment.id });

    try {
      let report;

      if (isEdit) {
        if (file) {
          const editFormData = new FormData();
          editFormData.append('file', file);
          editFormData.append('report_id', existingReport.id);
          editFormData.append('patient_id', appointment.user_id);
          editFormData.append('title', title || 'Medical Report');

          console.log('📤 Uploading edited report with new file...');
          report = await uploadFetch('/edit-report', editFormData);
          console.log('✅ Edit upload response:', report);
        } else {
          console.log('📤 Updating report title only...');
          report = await apiFetch(`/reports/${existingReport.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              title: title || 'Medical Report',
            }),
          });
          console.log('✅ Title update response:', report);
        }
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('patient_id', appointment.user_id);
        formData.append('appointment_id', appointment.id);
        formData.append('title', title || 'Medical Report');

        // ─── Debug: log exact payload being sent ───
        console.log('📤 Uploading new report — FormData payload:', {
          patient_id: appointment.user_id,
          appointment_id: appointment.id,
          title: title || 'Medical Report',
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
        });

        // Validate required IDs
        if (!appointment.user_id) {
          setError('Patient ID (user_id) is missing from this appointment. Cannot upload.');
          setUploading(false);
          return;
        }
        if (!appointment.id) {
          setError('Appointment ID is missing. Cannot upload.');
          setUploading(false);
          return;
        }

        report = await uploadFetch('/upload-report', formData);
        console.log('✅ Upload response:', report);
      }

      onSuccess(isEdit ? 'Report updated successfully!' : 'Report uploaded successfully!');
      onClose();
    } catch (err) {
      console.error('❌ Upload error:', err);
      console.error('❌ Error message:', err.message);
      // Show exact error message, never generic
      setError(err.message || 'Upload failed. Check console for details.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {isEdit ? 'Edit Report' : 'Upload Report'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
            <input 
              type="text" 
              readOnly 
              value={`${appointment.name} (${appointment.email || 'No email'})`} 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Title (Optional)</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. X-Ray Results" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File (PDF, JPG, PNG) {isEdit && <span className="text-gray-400 font-normal">- Leave empty to keep existing</span>}
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-primary/50 transition-colors bg-gray-50">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none">
                    <span>Upload a file</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only" 
                      accept={ALLOWED_EXTENSIONS}
                      onChange={handleFileChange} 
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  {file ? `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)` : (existingReport ? 'Current file preserved' : 'PDF, PNG, JPG up to 5MB')}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={uploading} 
              className={`flex-1 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {isEdit ? 'Updating...' : 'Uploading...'}</>
              ) : (
                isEdit ? 'Save Changes' : 'Upload'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
