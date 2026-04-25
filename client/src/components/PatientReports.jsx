import { FileText, Download } from 'lucide-react';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export default function PatientReports({ reports }) {
  if (!reports || reports.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <FileText className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No Reports Yet</h3>
        <p className="text-gray-500 text-sm">Your doctor hasn't uploaded any reports yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {reports.map(r => {
        // The backend now provides full public URLs for all files
        const downloadUrl = r.file_url;

        return (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {r.title || 'Medical Report'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">By Dr. {r.doctor_name || 'Doctor'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {dayjs.utc(r.uploadedAt || r.created_at).local().format("MMM DD, YYYY • hh:mm A")}
                  </p>

                </div>
              </div>
              <a 
                href={downloadUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                download 
                className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all shrink-0"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
