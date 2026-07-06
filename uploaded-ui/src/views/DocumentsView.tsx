import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState } from '../types';
import { UploadCloud, CheckCircle2, AlertCircle, ArrowRight, Trash2, FileText, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';
import { cn } from '../lib/utils';

interface DocumentsViewProps {
  onNavigate: (view: ViewState) => void;
}

const DOC_TYPES = [
  'Salary Slip', 'Form 16', 'Bank Statement', 'Rent Receipt', 
  'Insurance', 'Loan Certificate', 'Investment', 'Other'
];

export default function DocumentsView({ onNavigate }: DocumentsViewProps) {
  const [activeType, setActiveType] = useState('Salary Slip');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mock documents
  const [documents, setDocuments] = useState([
    { id: '1', name: 'hdfc_statement_dec.csv', type: 'Bank Statement', size: '12 KB', date: 'Just now', status: 'extracted', confidence: 98, ext: 'csv' },
    { id: '2', name: 'salary_slip_nov.pdf', type: 'Salary Slip', size: '1.2 MB', date: '2 days ago', status: 'needs_verification', confidence: 64, ext: 'pdf' },
  ]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    simulateUpload();
  };

  const simulateUpload = () => {
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          setDocuments(prev => [
            { id: Date.now().toString(), name: 'new_document.pdf', type: activeType, size: '2.4 MB', date: 'Just now', status: 'extracted', confidence: 85, ext: 'pdf' },
            ...prev
          ]);
        }, 500);
      }
    }, 200);
  };

  const getIconForExt = (ext: string) => {
    if (ext === 'csv' || ext === 'xlsx') return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    if (ext === 'jpg' || ext === 'png') return <ImageIcon className="w-5 h-5 text-indigo-600" />;
    return <FileText className="w-5 h-5 text-red-600" />;
  };

  const deleteDoc = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-8 py-8 lg:px-12 max-w-5xl mx-auto w-full">
        
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-carbon mb-2">Documents</h1>
          <p className="text-stone">Upload and manage your financial documents securely.</p>
        </header>

        {/* Upload Zone */}
        <section className="mb-12">
          <div className="flex flex-wrap gap-2 mb-4">
            {DOC_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                  activeType === type 
                    ? "bg-carbon text-canvas border-carbon" 
                    : "bg-white text-stone border-stone/20 hover:border-stone/40"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "relative overflow-hidden rounded-3xl border-2 border-dashed p-12 flex flex-col items-center justify-center text-center transition-all bg-white",
              isDragging ? "border-saffron bg-saffron/5" : "border-stone/20 hover:border-saffron/30 hover:bg-saffron/5",
              isUploading && "pointer-events-none"
            )}
          >
            {isUploading && (
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${uploadProgress}%` }} 
                className="absolute left-0 bottom-0 h-1.5 bg-saffron"
              />
            )}
            <div className="w-16 h-16 rounded-full bg-saffron/10 text-saffron flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-carbon mb-1">
              {isUploading ? 'Processing...' : isDragging ? 'Drop to upload' : 'Drop file or click to browse'}
            </h3>
            <p className="text-sm text-stone max-w-sm">
              Supports PDF, CSV, XLSX, JPG, PNG up to 10MB. Data is encrypted and extracted locally.
            </p>
            <button 
              onClick={simulateUpload}
              className="mt-6 px-6 py-2.5 bg-carbon text-canvas rounded-xl font-medium hover:bg-carbon-light transition-colors"
            >
              Browse Files
            </button>
          </div>
        </section>

        {/* Documents List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-carbon">Your Documents</h2>
            <span className="text-sm font-medium text-stone">{documents.length} extracted</span>
          </div>

          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-stone/10 rounded-3xl bg-white">
              <div className="w-20 h-20 rounded-full bg-stone/5 flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-stone/40" />
              </div>
              <h3 className="text-lg font-medium text-carbon">No documents yet</h3>
              <p className="text-sm text-stone mt-1">Upload a document to see extracted insights.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {documents.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-2xl border border-stone/10 shadow-sm gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-stone/5 flex items-center justify-center shrink-0">
                        {getIconForExt(doc.ext)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-medium text-carbon truncate max-w-[200px] sm:max-w-xs">{doc.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-stone/10 text-stone">
                            {doc.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-stone">
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>{doc.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                      <div className="flex items-center gap-2">
                        {doc.status === 'extracted' ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Extracted ({doc.confidence}%)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-medium">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Verify ({doc.confidence}%)</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => deleteDoc(doc.id)}
                          className="p-2 text-stone hover:text-crimson hover:bg-crimson/5 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onNavigate('document-verify')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-stone/5 hover:bg-stone/10 text-carbon rounded-xl text-sm font-medium transition-colors"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
