import { useState, useCallback, useRef } from 'react';
import { FilterType, ProcessingParams, HistoryEntry } from '@/types/imageProcessing';
import {
  applyGrayscale,
  applySepia,
  applyInvert,
  applyGaussianBlur,
  applySharpen,
  applyEdgeDetection,
  applyEmboss,
  applyBrightnessContrast,
  applyCartoon,
  applyPixelate,
  applyRotation,
  applyResize,
} from '@/lib/imageProcessing';

interface UseImageProcessorReturn {
  originalImage: string | null;
  processedImage: string | null;
  isProcessing: boolean;
  processingTime: number | null;
  activeFilter: FilterType;
  activeParams: ProcessingParams;
  history: HistoryEntry[];
  historyIndex: number;
  uploadImage: (file: File) => void;
  applyFilter: (filter: FilterType, params?: ProcessingParams) => Promise<void>;
  undo: () => void;
  redo: () => void;
  downloadImage: () => void;
  resetToOriginal: () => void;
}

export function useImageProcessor(): UseImageProcessorReturn {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('none');
  const [activeParams, setActiveParams] = useState<ProcessingParams>({
    blurRadius: 3,
    brightness: 0,
    contrast: 0,
    rotateAngle: 0,
    resizeWidth: 800,
    resizeHeight: 600,
    keepAspectRatio: true,
    pixelateSize: 10,
  });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const originalImgRef = useRef<HTMLImageElement | null>(null);

  /** Load image into an HTMLImageElement */
  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });

  /** Process using Canvas pixel manipulation */
  const processWithCanvas = useCallback(
    async (filter: FilterType, params: ProcessingParams): Promise<string> => {
      if (!originalImage) return '';
      const img = originalImgRef.current ?? (await loadImage(originalImage));
      originalImgRef.current = img;

      // Rotation and resize are geometric transforms — handled separately
      if (filter === 'rotate') {
        return applyRotation(img, params.rotateAngle ?? 0);
      }
      if (filter === 'resize') {
        const w = params.resizeWidth ?? img.width;
        const h = params.resizeHeight ?? img.height;
        return applyResize(img, w, h);
      }

      // Pixel-manipulation filters
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      switch (filter) {
        case 'grayscale':
          imageData = applyGrayscale(imageData);
          break;
        case 'sepia':
          imageData = applySepia(imageData);
          break;
        case 'invert':
          imageData = applyInvert(imageData);
          break;
        case 'blur':
          imageData = applyGaussianBlur(imageData, params.blurRadius ?? 3);
          break;
        case 'sharpen':
          imageData = applySharpen(imageData);
          break;
        case 'edge-detection':
          imageData = applyEdgeDetection(imageData);
          break;
        case 'emboss':
          imageData = applyEmboss(imageData);
          break;
        case 'brightness-contrast':
          imageData = applyBrightnessContrast(imageData, params.brightness ?? 0, params.contrast ?? 0);
          break;
        case 'cartoon':
          imageData = applyCartoon(imageData);
          break;
        case 'pixelate':
          imageData = applyPixelate(imageData, params.pixelateSize ?? 10);
          break;
        case 'none':
        default:
          break;
      }

      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL('image/png');
    },
    [originalImage]
  );

  /** Upload and set original image */
  const uploadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setOriginalImage(dataUrl);
      setProcessedImage(dataUrl);
      setActiveFilter('none');
      setHistory([]);
      setHistoryIndex(-1);
      originalImgRef.current = null;
      setProcessingTime(null);

      // Pre-load image ref
      const img = new Image();
      img.onload = () => { originalImgRef.current = img; };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  /** Apply a filter with timing */
  const applyFilter = useCallback(
    async (filter: FilterType, params?: ProcessingParams) => {
      if (!originalImage) return;
      setIsProcessing(true);
      const merged = { ...activeParams, ...params };
      setActiveParams(merged);
      setActiveFilter(filter);

      const start = performance.now();
      try {
        const result = await processWithCanvas(filter, merged);
        const elapsed = performance.now() - start;
        setProcessingTime(Math.round(elapsed));
        setProcessedImage(result);

        // Add to history
        const entry: HistoryEntry = {
          id: crypto.randomUUID(),
          filterType: filter,
          params: merged,
          imageDataUrl: result,
          label: filter === 'none' ? 'Original' : filter.replace('-', ' '),
          timestamp: Date.now(),
        };

        setHistory((prev) => {
          const truncated = prev.slice(0, historyIndex + 1);
          return [...truncated, entry].slice(-20); // max 20 items
        });
        setHistoryIndex((prev) => Math.min(prev + 1, 19));
      } finally {
        setIsProcessing(false);
      }
    },
    [originalImage, activeParams, processWithCanvas, historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex <= 0) {
      setProcessedImage(originalImage);
      setActiveFilter('none');
      return;
    }
    const newIdx = historyIndex - 1;
    setHistoryIndex(newIdx);
    const entry = history[newIdx];
    if (entry) {
      setProcessedImage(entry.imageDataUrl);
      setActiveFilter(entry.filterType);
    }
  }, [history, historyIndex, originalImage]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    setHistoryIndex(newIdx);
    const entry = history[newIdx];
    if (entry) {
      setProcessedImage(entry.imageDataUrl);
      setActiveFilter(entry.filterType);
    }
  }, [history, historyIndex]);

  const downloadImage = useCallback(() => {
    if (!processedImage) return;
    const a = document.createElement('a');
    a.href = processedImage;
    a.download = `visionpro-${activeFilter}-${Date.now()}.png`;
    a.click();
  }, [processedImage, activeFilter]);

  const resetToOriginal = useCallback(() => {
    setProcessedImage(originalImage);
    setActiveFilter('none');
    setProcessingTime(null);
  }, [originalImage]);

  return {
    originalImage,
    processedImage,
    isProcessing,
    processingTime,
    activeFilter,
    activeParams,
    history,
    historyIndex,
    uploadImage,
    applyFilter,
    undo,
    redo,
    downloadImage,
    resetToOriginal,
  };
}
