import React, { useState, useRef } from 'react';

export default function OcrOverlay({ imageSrc, words = [], blocks = [], onSelect }) {
  const imgRef = useRef(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [hoverId, setHoverId] = useState(null);

  const handleLoad = (e) => {
    const img = e.target;
    setNaturalSize({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height });
  };

  // choose to render blocks if present, otherwise words
  const shapes = (blocks && blocks.length > 0) ? blocks.map((b, i) => ({
    id: `block-${i}`,
    left: b.bbox.left,
    top: b.bbox.top,
    width: b.bbox.width,
    height: b.bbox.height,
    text: b.text,
    conf: b.confidence
  })) : (words || []).map((w, i) => ({
    id: `word-${i}`,
    left: w.left,
    top: w.top,
    width: w.width,
    height: w.height,
    text: w.text,
    conf: w.conf
  }));

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <img ref={imgRef} src={imageSrc} alt="preview" style={{ width: '100%', display: 'block' }} onLoad={handleLoad} />
      {naturalSize.w > 0 && shapes.length > 0 && (
        <svg
          viewBox={`0 0 ${naturalSize.w} ${naturalSize.h}`}
          preserveAspectRatio="xMinYMin meet"
          style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          {shapes.map(s => (
            <rect
              key={s.id}
              x={s.left}
              y={s.top}
              width={s.width}
              height={s.height}
              fill="none"
              stroke={hoverId === s.id ? 'rgba(255,0,0,0.9)' : 'rgba(0,150,255,0.9)'}
              strokeWidth={hoverId === s.id ? 3 : 2}
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              onMouseEnter={() => setHoverId(s.id)}
              onMouseLeave={() => setHoverId(null)}
              onClick={() => onSelect && onSelect(s)}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
