/**
 * VisionPro Image Processing Engine
 * All processing done via Canvas API with real pixel-manipulation algorithms.
 */

/** Apply Grayscale using luminosity method */
export function applyGrayscale(imageData: ImageData): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const luma = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
    data[i] = data[i + 1] = data[i + 2] = luma;
  }
  return imageData;
}

/** Apply Sepia tone */
export function applySepia(imageData: ImageData): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    data[i]     = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
  }
  return imageData;
}

/** Invert colors */
export function applyInvert(imageData: ImageData): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  return imageData;
}

/** Apply a 2D convolution kernel */
function applyConvolution(imageData: ImageData, kernel: number[], kernelSize: number): ImageData {
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data.length);
  const half = Math.floor(kernelSize / 2);
  const kernelSum = kernel.reduce((a, b) => a + b, 0) || 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx - half));
          const py = Math.min(height - 1, Math.max(0, y + ky - half));
          const idx = (py * width + px) * 4;
          const kVal = kernel[ky * kernelSize + kx];
          r += data[idx]     * kVal;
          g += data[idx + 1] * kVal;
          b += data[idx + 2] * kVal;
        }
      }
      const outIdx = (y * width + x) * 4;
      output[outIdx]     = Math.min(255, Math.max(0, r / kernelSum));
      output[outIdx + 1] = Math.min(255, Math.max(0, g / kernelSum));
      output[outIdx + 2] = Math.min(255, Math.max(0, b / kernelSum));
      output[outIdx + 3] = data[outIdx + 3];
    }
  }

  return new ImageData(output, width, height);
}

/** Box Blur (approximates Gaussian) for given radius */
export function applyGaussianBlur(imageData: ImageData, radius: number = 3): ImageData {
  const size = Math.max(3, Math.min(15, radius * 2 + 1));
  const kernel = new Array(size * size).fill(1);
  return applyConvolution(imageData, kernel, size);
}

/** Unsharp Mask sharpening */
export function applySharpen(imageData: ImageData): ImageData {
  const kernel = [
     0, -1,  0,
    -1,  5, -1,
     0, -1,  0,
  ];
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const idx = (py * width + px) * 4;
          const kVal = kernel[(ky + 1) * 3 + (kx + 1)];
          r += data[idx]     * kVal;
          g += data[idx + 1] * kVal;
          b += data[idx + 2] * kVal;
        }
      }
      const outIdx = (y * width + x) * 4;
      output[outIdx]     = Math.min(255, Math.max(0, r));
      output[outIdx + 1] = Math.min(255, Math.max(0, g));
      output[outIdx + 2] = Math.min(255, Math.max(0, b));
      output[outIdx + 3] = data[outIdx + 3];
    }
  }
  return new ImageData(output, width, height);
}

/** Sobel Edge Detection */
export function applyEdgeDetection(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  // First grayscale
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
  }

  const output = new Uint8ClampedArray(data.length);
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const val = gray[(y + ky) * width + (x + kx)];
          const ki = (ky + 1) * 3 + (kx + 1);
          gx += val * sobelX[ki];
          gy += val * sobelY[ki];
        }
      }
      const magnitude = Math.min(255, Math.sqrt(gx * gx + gy * gy));
      const outIdx = (y * width + x) * 4;
      output[outIdx] = output[outIdx + 1] = output[outIdx + 2] = magnitude;
      output[outIdx + 3] = 255;
    }
  }
  return new ImageData(output, width, height);
}

/** Emboss effect */
export function applyEmboss(imageData: ImageData): ImageData {
  const kernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 128, g = 128, b = 128;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const idx = (py * width + px) * 4;
          const kVal = kernel[(ky + 1) * 3 + (kx + 1)];
          r += data[idx]     * kVal;
          g += data[idx + 1] * kVal;
          b += data[idx + 2] * kVal;
        }
      }
      const outIdx = (y * width + x) * 4;
      output[outIdx]     = Math.min(255, Math.max(0, r));
      output[outIdx + 1] = Math.min(255, Math.max(0, g));
      output[outIdx + 2] = Math.min(255, Math.max(0, b));
      output[outIdx + 3] = data[outIdx + 3];
    }
  }
  return new ImageData(output, width, height);
}

/** Brightness & Contrast adjustment */
export function applyBrightnessContrast(
  imageData: ImageData,
  brightness: number = 0,  // -100 to 100
  contrast: number = 0     // -100 to 100
): ImageData {
  const data = imageData.data;
  const b = brightness / 100;
  const c = contrast / 100;
  const factor = (259 * (c * 255 + 255)) / (255 * (259 - c * 255));

  for (let i = 0; i < data.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) {
      let val = data[i + ch] / 255;
      // Apply brightness
      val += b;
      // Apply contrast
      val = factor * (val - 0.5) + 0.5;
      data[i + ch] = Math.min(255, Math.max(0, val * 255));
    }
  }
  return imageData;
}

/** Cartoon Effect — quantize colors + edge overlay */
export function applyCartoon(imageData: ImageData): ImageData {
  const { width, height } = imageData;
  const data = imageData.data;

  // Step 1: Quantize colors into levels
  const levels = 6;
  const quantized = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) {
      quantized[i + ch] = Math.round(data[i + ch] / (255 / levels)) * (255 / levels);
    }
    quantized[i + 3] = data[i + 3];
  }

  // Step 2: Compute edges on grayscale
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
  }

  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  const edges = new Uint8ClampedArray(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const val = gray[(y + ky) * width + (x + kx)];
          const ki = (ky + 1) * 3 + (kx + 1);
          gx += val * sobelX[ki];
          gy += val * sobelY[ki];
        }
      }
      edges[y * width + x] = Math.sqrt(gx * gx + gy * gy) > 60 ? 0 : 255;
    }
  }

  // Step 3: Overlay edges on quantized
  const output = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const edgeVal = edges[y * width + x];
      output[idx]     = quantized[idx]     * (edgeVal / 255);
      output[idx + 1] = quantized[idx + 1] * (edgeVal / 255);
      output[idx + 2] = quantized[idx + 2] * (edgeVal / 255);
      output[idx + 3] = quantized[idx + 3];
    }
  }
  return new ImageData(output, width, height);
}

/** Pixelate (mosaic) effect */
export function applyPixelate(imageData: ImageData, blockSize: number = 10): ImageData {
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      let r = 0, g = 0, b = 0, count = 0;
      // Sample block average
      for (let by = 0; by < blockSize && y + by < height; by++) {
        for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
          const idx = ((y + by) * width + (x + bx)) * 4;
          r += data[idx]; g += data[idx + 1]; b += data[idx + 2];
          count++;
        }
      }
      r /= count; g /= count; b /= count;
      // Fill block with average
      for (let by = 0; by < blockSize && y + by < height; by++) {
        for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
          const idx = ((y + by) * width + (x + bx)) * 4;
          output[idx] = r; output[idx + 1] = g; output[idx + 2] = b;
          output[idx + 3] = data[idx + 3];
        }
      }
    }
  }
  return new ImageData(output, width, height);
}

/** Rotate image on a canvas and return data URL */
export function applyRotation(src: HTMLImageElement, angleDeg: number): string {
  const rad = (angleDeg * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const newW = Math.ceil(src.width * cos + src.height * sin);
  const newH = Math.ceil(src.width * sin + src.height * cos);

  const canvas = document.createElement('canvas');
  canvas.width = newW;
  canvas.height = newH;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(newW / 2, newH / 2);
  ctx.rotate(rad);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return canvas.toDataURL('image/png');
}

/** Resize image to given dimensions */
export function applyResize(src: HTMLImageElement, width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, width, height);
  return canvas.toDataURL('image/png');
}
