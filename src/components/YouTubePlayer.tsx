import React from 'react';

interface YouTubePlayerProps {
  embedUrl: string;
  title: string;
  description?: string;
  onClose?: () => void;
  className?: string;
}

/**
 * Responsive YouTube embed player component
 * Ensures videos play within the website without redirecting to YouTube
 */
export default function YouTubePlayer({ 
  embedUrl, 
  title, 
  description, 
  onClose, 
  className = "" 
}: YouTubePlayerProps) {
  return (
    <div className={`bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video Container */}
      <div className="relative aspect-video">
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      
      {/* Video Info and Controls */}
      <div className="bg-gray-900 p-4">
        <h4 className="text-white font-semibold mb-2">{title}</h4>
        {description && (
          <p className="text-gray-300 text-sm mb-4">{description}</p>
        )}
        
        {/* Control Buttons */}
        <div className="flex flex-wrap gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded font-medium transition-colors"
            >
              ✕ Close Video
            </button>
          )}
          
          <button
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded font-medium transition-colors"
            title="Bookmark this video"
          >
            📍 Bookmark
          </button>
          
          <button
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded font-medium transition-colors"
            title="Share this video"
          >
            📤 Share
          </button>
        </div>
      </div>
    </div>
  );
}