// PROD:/frontend/src/components/features/Profile/AvatarField.jsx
import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
// Buttons removed for this field (single Save handled by parent)
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabaseClient';

/**
 * AvatarField — two modes: File (default) and URL.
 * - File: choose image, crop 1:1 with pan/zoom, render to 512x512 JPEG, upload to Supabase Storage
 * - URL: validate https?:// and successful image load; live preview
 *
 * Props:
 *  - value: string (current avatar_url)
 *  - onChange: (url: string) => void
 *  - initialValue?: string
 *  - telegramHint?: boolean
 *  - userId: string
 */
export const AvatarField = forwardRef(function AvatarField(
  { value, onChange, initialValue = '', telegramHint = false, userId },
  ref
) {
  const toast = useToast();

  const [mode, setMode] = useState('file'); // 'file' | 'url'

  // URL mode state
  const [urlInput, setUrlInput] = useState(value || '');
  const [urlValid, setUrlValid] = useState(true);
  const [urlPreviewOk, setUrlPreviewOk] = useState(!!value);

  // File mode state
  const [file, setFile] = useState(null); // draft file (not uploaded yet)
  const [objectUrl, setObjectUrl] = useState('');
  const imgRef = useRef(null);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [deleteMarked, setDeleteMarked] = useState(false);

  const containerSize = 220; // ~200–240px as per spec
  const containerRef = useRef(null);

  // crop transform
  const [scale, setScale] = useState(1); // multiplier over minScale
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // px in container coords
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const offsetStartRef = useRef({ x: 0, y: 0 });

  // Compute minimal scale to cover container (cover fit)
  const minScale = useMemo(() => {
    const { w, h } = imgNatural;
    if (!w || !h) return 1;
    return Math.max(containerSize / w, containerSize / h);
  }, [imgNatural]);

  const totalScale = minScale * scale;
  // Base size at minimal cover; preview scales isotropically via transform scale()
  const baseW = useMemo(() => (imgNatural.w ? imgNatural.w * minScale : 0), [imgNatural.w, minScale]);
  const baseH = useMemo(() => (imgNatural.h ? imgNatural.h * minScale : 0), [imgNatural.h, minScale]);
  const dispW = useMemo(() => baseW * scale, [baseW, scale]);
  const dispH = useMemo(() => baseH * scale, [baseH, scale]);
  // Keep previous "displayed" for canvas math compatibility
  const displayed = useMemo(() => ({ w: imgNatural.w * totalScale, h: imgNatural.h * totalScale }), [imgNatural.w, imgNatural.h, totalScale]);

  // Clamp offset so image always covers square (no empty borders)
  const clampOffset = (x, y) => {
    const maxX = Math.max(0, (dispW - containerSize) / 2);
    const maxY = Math.max(0, (dispH - containerSize) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  };

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  // Init URL state from prop
  useEffect(() => {
    setUrlInput(value || '');
    setUrlPreviewOk(!!value);
  }, [value]);

  // When a file is chosen, create object URL and read natural size
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const url = URL.createObjectURL(f);
    setFile(f);
    setObjectUrl(url);
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const onImageLoad = (e) => {
    const img = e.currentTarget;
    setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Drag handlers (mouse + touch)
  const onPointerDown = (e) => {
    e.preventDefault();
    const point = getPoint(e);
    dragStartRef.current = point;
    offsetStartRef.current = { ...offset };
    setIsDragging(true);
  };
  const onPointerMove = (e) => {
    if (!isDragging) return;
    const point = getPoint(e);
    const dx = point.x - dragStartRef.current.x;
    const dy = point.y - dragStartRef.current.y;
    const next = clampOffset(offsetStartRef.current.x + dx, offsetStartRef.current.y + dy);
    setOffset(next);
  };
  const onPointerUp = () => setIsDragging(false);

  // Wheel zoom (desktop convenience)
  const onWheel = (e) => {
    if (!imgNatural.w) return;
    e.preventDefault();
    const delta = -e.deltaY / 500; // gentle zoom
    const next = Math.min(3, Math.max(1, scale + delta));
    setScale(next);
    setOffset((prev) => clampOffset(prev.x, prev.y));
  };

  // URL validation with image load
  useEffect(() => {
    if (!urlInput) {
      setUrlValid(true);
      setUrlPreviewOk(false);
      return;
    }
    const isHttp = /^https?:\/\//i.test(urlInput.trim());
    if (!isHttp) {
      setUrlValid(false);
      setUrlPreviewOk(false);
      return;
    }
    setUrlValid(true);
    const img = new Image();
    img.onload = () => setUrlPreviewOk(true);
    img.onerror = () => setUrlPreviewOk(false);
    img.src = urlInput.trim();
  }, [urlInput]);

  const renderToCanvasBlob = async () => {
    const imgEl = imgRef.current;
    if (!imgEl) return null;

    // Ensure image is fully loaded before rendering
    if (!imgEl.complete || imgEl.naturalWidth === 0 || imgEl.naturalHeight === 0) {
      try { await imgEl.decode?.(); } catch (_) { /* ignore */ }
    }
    const naturalW = imgEl.naturalWidth || imgNatural.w;
    const naturalH = imgEl.naturalHeight || imgNatural.h;
    if (!naturalW || !naturalH) return null;

    const canvas = document.createElement('canvas');
    const target = 512;
    canvas.width = target;
    canvas.height = target;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const scaleFactor = totalScale; // natural -> displayed scale
    const dispW = displayed.w;
    const dispH = displayed.h;

    const containerCenter = containerSize / 2;
    const imgLeft = containerCenter - dispW / 2 + offset.x;
    const imgTop = containerCenter - dispH / 2 + offset.y;

    // Source rect in natural units
    let sx = -imgLeft / scaleFactor;
    let sy = -imgTop / scaleFactor;
    let sSize = containerSize / scaleFactor;

    // Clamp to image bounds
    sSize = Math.max(1, Math.min(sSize, Math.min(naturalW, naturalH)));
    sx = Math.max(0, Math.min(naturalW - sSize, sx));
    sy = Math.max(0, Math.min(naturalH - sSize, sy));

    return new Promise((resolve) => {
      const done = (blob) => {
        if (blob) return resolve(blob);
        // Fallback: toDataURL path
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          resolve(dataURLToBlob(dataUrl));
        } catch (_) {
          resolve(null);
        }
      };
      ctx.drawImage(imgEl, sx, sy, sSize, sSize, 0, 0, target, target);
      if (canvas.toBlob) {
        canvas.toBlob(done, 'image/jpeg', 0.85);
      } else {
        done(null);
      }
    });
  };

  // Imperative API for parent submit flow
  useImperativeHandle(ref, () => ({
    hasDraft() {
      const urlDraft = mode === 'url' && urlInput && urlValid && urlPreviewOk && urlInput.trim() !== (value || '');
      return !!file || !!urlDraft;
    },
    async applyDraft() {
      try {
        if (deleteMarked) return null;
        // URL draft
        const isUrlDraft = mode === 'url' && urlInput && urlValid && urlPreviewOk;
        if (isUrlDraft) {
          const url = urlInput.trim();
          onChange?.(url);
          return url;
        }
        // File draft → crop+upload
        if (!file) return null;
        if (!userId) throw new Error('Пользователь не определён');
        const blob = await renderToCanvasBlob();
        if (!blob) throw new Error('Нет данных для загрузки');
        const path = `users/${userId}/avatar_${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });
        if (upErr) {
          toast.error('Хранилище недоступно: avatars (проверьте bucket/policies)');
          return null;
        }
        const { data } = await supabase.storage.from('avatars').getPublicUrl(path);
        const publicUrl = data?.publicUrl;
        if (!publicUrl) {
          toast.error('Хранилище недоступно: avatars (public URL не получен)');
          return null;
        }
        onChange?.(publicUrl);
        return publicUrl;
      } catch (e) {
        console.error('Avatar applyDraft error:', e);
        toast.error('Не удалось подготовить аватар');
        return null;
      }
    },
    clearDraft() {
      setFile(null);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setObjectUrl('');
      setUrlInput(initialValue || '');
      setUrlPreviewOk(!!initialValue);
      setScale(1);
      setOffset({ x: 0, y: 0 });
    },
    isDeleteMarked() { return !!deleteMarked; },
    clearDeleteMark() { setDeleteMarked(false); },
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-white/90 text-sm font-medium">Аватар</label>
        <div className="flex items-center gap-3">
          {(initialValue || value) && !deleteMarked && (
            <button type="button" onClick={() => setDeleteMarked(true)} className="text-secondary text-xs underline">
              Удалить
            </button>
          )}
          {deleteMarked && (
            <span className="text-secondary text-xs">Будет удалён при сохранении</span>
          )}
        </div>
        <div className="inline-flex rounded-lg border border-[var(--glass-border)] overflow-hidden">
          <button
            type="button"
            className={`px-3 py-1.5 text-sm transition-colors ${mode === 'file' ? 'bg-[var(--panel-bg-strong)] text-white' : 'bg-[var(--panel-bg)] text-white/80'}`}
            onClick={() => setMode('file')}
          >
            Файл
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-sm transition-colors ${mode === 'url' ? 'bg-[var(--panel-bg-strong)] text-white' : 'bg-[var(--panel-bg)] text-white/80'}`}
            onClick={() => setMode('url')}
          >
            URL
          </button>
        </div>
      </div>

      {mode === 'file' ? (
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-white/80 file:mr-3 file:rounded-lg file:border file:border-[var(--glass-border)] file:bg-[var(--panel-bg)] file:px-3 file:py-2 file:text-white/90"
          />

          {objectUrl && (
            <div className="flex items-start gap-4 flex-wrap">
              {/* Cropper */}
              <div
                ref={containerRef}
                className="relative rounded-xl border border-[var(--glass-border)] bg-[var(--panel-bg)] overflow-hidden touch-pan-y"
                style={{ width: containerSize, height: containerSize }}
                onMouseDown={onPointerDown}
                onMouseMove={onPointerMove}
                onMouseUp={onPointerUp}
                onMouseLeave={onPointerUp}
                onTouchStart={onPointerDown}
                onTouchMove={onPointerMove}
                onTouchEnd={onPointerUp}
                onWheel={onWheel}
              >
                {/* Image with transform */}
                <img
                  ref={imgRef}
                  src={objectUrl}
                  alt="Предпросмотр"
                  onLoad={onImageLoad}
                  draggable={false}
                  className="select-none pointer-events-none"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: `${baseW}px`,
                    height: `${baseH}px`,
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
                  }}
                />
                {/* Square overlay hint (subtle) */}
                <div className="absolute inset-0 ring-1 ring-[var(--glass-border)] pointer-events-none" />
              </div>

              {/* Controls */}
              <div className="flex-1 min-w-[200px] max-w-[360px] space-y-3">
                <div className="space-y-2">
                  <label className="text-secondary text-sm">Масштаб</label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={scale}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setScale(v);
                      setOffset((prev) => clampOffset(prev.x, prev.y));
                    }}
                    className="w-full"
                  />
                </div>
                { (file || (mode==='url' && urlInput)) && (
                  <button type="button" className="text-secondary text-xs underline" onClick={() => {
                    // cancel local changes
                    setFile(null);
                    if (objectUrl) URL.revokeObjectURL(objectUrl);
                    setObjectUrl('');
                    setUrlInput(initialValue || '');
                    setUrlPreviewOk(!!initialValue);
                    setScale(1);
                    setOffset({ x: 0, y: 0 });
                  }}>
                    Отменить изменения
                  </button>
                )}
                <p className="text-secondary text-xs">Финальный размер: 512×512 JPEG</p>
              </div>
            </div>
          )}

          {/* Current value preview */}
          {value && (
            <div className="flex items-center gap-3">
              <img src={value} alt="Текущий аватар" className="w-12 h-12 rounded-lg object-cover" />
              <span className="text-secondary text-sm">Текущий аватар из профиля</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="url"
            placeholder="https://..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            aria-invalid={!urlValid || (urlInput && !urlPreviewOk)}
            className={`w-full rounded-lg p-3 bg-[var(--panel-bg)] border ${(!urlValid || (urlInput && !urlPreviewOk)) ? 'border-[var(--glass-hover-border)]' : 'border-[var(--glass-border)]'} text-white focus:outline-none focus:ring-2 focus:ring-[var(--glass-border)]`}
          />
          {(mode==='url' && urlInput) && (
            <button type="button" className="text-secondary text-xs underline" onClick={() => {
              setUrlInput(initialValue || '');
              setUrlPreviewOk(!!initialValue);
            }}>
              Отменить изменения
            </button>
          )}
          {urlInput && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-[var(--glass-border)] bg-[var(--panel-bg)]">
                {urlPreviewOk ? (
                  <img src={urlInput} alt="Превью" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-secondary text-xs">нет превью</div>
                )}
              </div>
              <span className={`text-sm ${urlPreviewOk ? 'text-secondary' : 'text-white/70'}`}>
                {urlPreviewOk ? 'Предпросмотр' : 'URL невалиден или изображение недоступно'}
              </span>
            </div>
          )}
        </div>
      )}

      {telegramHint && (
        <p className="text-secondary text-xs">
          Если вы входили через Telegram, фото уже подставлено автоматически — менять не обязательно.
        </p>
      )}
    </div>
  );
});

function getPoint(e) {
  if (e.touches && e.touches[0]) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

function dataURLToBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

export default AvatarField;
