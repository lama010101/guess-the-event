
import React, { useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoViewerProps {
  src: string;
  alt?: string;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({ src, alt = "Historical photograph" }) => {
  const [zoomed, setZoomed] = useState(false);
  
  return (
    <div className={`relative rounded-lg overflow-hidden shadow-md ${zoomed ? 'fixed inset-0 z-50 bg-black flex items-center justify-center' : 'w-full h-full'}`}>
      <img 
        src={src} 
        alt={alt} 
        className={`object-contain ${zoomed ? 'max-h-screen max-w-full' : 'w-full h-full'}`}
      />
      
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute bottom-4 right-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90"
        onClick={() => setZoomed(!zoomed)}
      >
        {zoomed ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export default PhotoViewer;
