"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  alt?: string;
  className?: string;
}

export function ImageGallery({ images, alt = "Gallery image", className }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, goToPrevious, goToNext]);

  if (!images || images.length === 0) {
    return null;
  }

  // Render based on number of images
  const renderGrid = () => {
    if (images.length === 1) {
      return (
        <div
          className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl"
          onClick={() => openLightbox(0)}
        >
          <img
            src={images[0]}
            alt={alt}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      );
    }

    if (images.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-2">
          {images.map((src, i) => (
            <div
              key={i}
              className="relative aspect-video cursor-pointer overflow-hidden rounded-xl"
              onClick={() => openLightbox(i)}
            >
              <img
                src={src}
                alt={`${alt} ${i + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      );
    }

    if (images.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-2">
          <div
            className="relative row-span-2 aspect-square cursor-pointer overflow-hidden rounded-xl"
            onClick={() => openLightbox(0)}
          >
            <img
              src={images[0]}
              alt={`${alt} 1`}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
          {images.slice(1).map((src, i) => (
            <div
              key={i + 1}
              className="relative aspect-video cursor-pointer overflow-hidden rounded-xl"
              onClick={() => openLightbox(i + 1)}
            >
              <img
                src={src}
                alt={`${alt} ${i + 2}`}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      );
    }

    // 4+ images: Bento grid layout
    const displayImages = images.slice(0, 5);
    const remainingCount = images.length - 5;

    return (
      <div className="grid grid-cols-4 grid-rows-2 gap-2">
        {/* Hero image - spans 2 cols and 2 rows */}
        <div
          className="relative col-span-2 row-span-2 cursor-pointer overflow-hidden rounded-xl"
          onClick={() => openLightbox(0)}
        >
          <img
            src={displayImages[0]}
            alt={`${alt} 1`}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* Top right images */}
        {displayImages.slice(1, 3).map((src, i) => (
          <div
            key={i + 1}
            className="relative cursor-pointer overflow-hidden rounded-xl"
            onClick={() => openLightbox(i + 1)}
          >
            <img
              src={src}
              alt={`${alt} ${i + 2}`}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        ))}

        {/* Bottom right images */}
        {displayImages.slice(3, 5).map((src, i) => (
          <div
            key={i + 3}
            className={cn(
              "relative cursor-pointer overflow-hidden rounded-xl",
              i === 1 && remainingCount > 0 && "group"
            )}
            onClick={() => openLightbox(i + 3)}
          >
            <img
              src={src}
              alt={`${alt} ${i + 4}`}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
            {/* "+N more" overlay on the last image */}
            {i === 1 && remainingCount > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-semibold text-lg transition-colors group-hover:bg-black/70">
                +{remainingCount} more
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className={cn("w-full", className)}>{renderGrid()}</div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Main image */}
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[currentIndex]}
              alt={`${alt} ${currentIndex + 1}`}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            />
          </div>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
