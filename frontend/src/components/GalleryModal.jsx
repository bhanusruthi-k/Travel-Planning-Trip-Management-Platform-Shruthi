import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, Camera, Sparkles } from 'lucide-react';

const GalleryModal = ({ isOpen, onClose, destination, initialIndex = 0, photos = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartXRef = useRef(null);
  const touchEndXRef = useRef(null);

  // Sync initial index
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const totalPhotos = photos.length;

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? totalPhotos - 1 : prev - 1));
  }, [totalPhotos]);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === totalPhotos - 1 ? 0 : prev + 1));
  }, [totalPhotos]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling while modal is active
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    const threshold = 50; // Minimum swipe distance in px

    if (diff > threshold) {
      // Swiped Left -> Next Photo
      handleNext();
    } else if (diff < -threshold) {
      // Swiped Right -> Prev Photo
      handlePrev();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  if (!isOpen || totalPhotos === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];

  return (
    <div
      className="gallery-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Destination Photo Gallery Viewer"
    >
      <div
        className="gallery-modal-stage"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top Header Bar */}
        <div className="gallery-header-bar">
          <div className="gallery-location-info">
            <h3 className="gallery-dest-name">{destination?.name || 'Destination'}</h3>
            {destination?.country && (
              <span className="gallery-dest-country">
                <MapPin size={13} /> {destination.country}
              </span>
            )}
          </div>

          <div className="gallery-header-actions">
            <span className="gallery-counter-tag">
              <Camera size={14} /> {currentIndex + 1} / {totalPhotos}
            </span>
            <button
              className="gallery-close-btn"
              onClick={onClose}
              title="Close viewer (Esc)"
              aria-label="Close photo viewer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Central Display Area with Prev/Next Navigation */}
        <div className="gallery-viewport">
          <button
            className="gallery-nav-btn prev"
            onClick={handlePrev}
            title="Previous photo (←)"
            aria-label="Previous photo"
          >
            <ChevronLeft size={28} />
          </button>

          <div className="gallery-image-frame">
            <img
              src={currentPhoto.url}
              alt={currentPhoto.caption || `${destination?.name} photograph`}
              className="gallery-main-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=85';
              }}
            />
          </div>

          <button
            className="gallery-nav-btn next"
            onClick={handleNext}
            title="Next photo (→)"
            aria-label="Next photo"
          >
            <ChevronRight size={28} />
          </button>
        </div>

        {/* Photo Caption Strip & Destination Info */}
        <div className="gallery-caption-strip">
          <div className="gallery-meta-caption-group">
            <h4 className="gallery-caption-dest-title">{destination?.name}, {destination?.country}</h4>
            {currentPhoto.caption && (
              <p className="gallery-caption-text">{currentPhoto.caption}</p>
            )}
          </div>

          {/* Indicator Dots */}
          <div className="gallery-dot-indicators" role="tablist" aria-label="Photo pagination dots">
            {photos.map((_, dotIdx) => (
              <button
                key={dotIdx}
                className={`gallery-dot ${dotIdx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(dotIdx)}
                aria-label={`Jump to slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Interactive Thumbnail Strip */}
        <div className="gallery-thumbnail-strip" role="tablist">
          {photos.map((item, idx) => (
            <button
              key={idx}
              className={`gallery-thumb-btn ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
              title={`Jump to photo ${idx + 1}`}
              aria-label={`View photo ${idx + 1}`}
            >
              <img
                src={item.url}
                alt={`Thumbnail ${idx + 1}`}
                className="gallery-thumb-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=200&q=60';
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GalleryModal;
