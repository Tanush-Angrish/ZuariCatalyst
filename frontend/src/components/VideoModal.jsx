import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

export default function VideoModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-modal-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 transition-all hover:scale-110 active:scale-95 shadow-lg group"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Video Container */}
        <div className="relative w-full overflow-hidden bg-black aspect-video">
          <iframe
            src="https://player.cloudinary.com/embed/?cloud_name=dqxr3cbmz&public_id=Catalyst_Demo_4mins_1_x2bexg&autoplay=true"
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            frameBorder="0"
          ></iframe>
        </div>

        {/* Info Footer */}
        <div className="px-6 py-4 bg-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Catalyst Platform Demo</h3>
            <p className="text-sm text-gray-500">Learn how to maximize your impact with Idea Catalyst</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
              4:00 MINS
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
