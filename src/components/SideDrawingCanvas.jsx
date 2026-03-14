import React, { useRef, useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, Popover } from '@mui/material';
import { Trash2, Palette, Pencil } from 'lucide-react';

const COLORS = [
  '#EF4444', // red-500 (default)
  '#0891B2', // cyan-600
  '#F97316', // orange-500
  '#EAB308', // yellow-500
  '#22C55E', // green-500
  '#3B82F6', // blue-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#000000', // black
];

const PENCIL_CURSOR = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>') 2 20, auto`;

function SideDrawingCanvas() {
  const canvasRef = useRef(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#EF4444');
  const [hasContent, setHasContent] = useState(false);
  const [colorAnchor, setColorAnchor] = useState(null);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const isOverUIRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    if (isDrawingMode) {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      document.body.classList.add('drawing-mode');
    } else {
      document.body.classList.remove('drawing-mode');
    }
    return () => {
      document.body.classList.remove('drawing-mode');
    };
  }, [isDrawingMode]);

  const getCanvasCoords = (clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const getCtx = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    return ctx;
  };

  const handleMouseDown = (e) => {
    if (isOverUIRef.current) return;
    
    const coords = getCanvasCoords(e.clientX, e.clientY);
    lastPosRef.current = coords;
    setIsDrawing(true);
    
    const ctx = getCtx();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineTo(coords.x + 1, coords.y + 1);
    ctx.stroke();
    setHasContent(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const ctx = getCtx();
    const coords = getCanvasCoords(e.clientX, e.clientY);

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPosRef.current = coords;
    setHasContent(true);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  useEffect(() => {
    if (!isDrawingMode) return;

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawingMode, isDrawing, color]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
  };

  const handleUIMouseEnter = () => {
    isOverUIRef.current = true;
  };

  const handleUIMouseLeave = () => {
    isOverUIRef.current = false;
  };

  return (
    <>
      {isDrawingMode && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9998,
            pointerEvents: 'none',
            cursor: isDrawing ? PENCIL_CURSOR : 'crosshair',
            opacity: 0.5
          }}
        />
      )}
      <Box
        onMouseEnter={handleUIMouseEnter}
        onMouseLeave={handleUIMouseLeave}
        sx={{
          position: 'fixed',
          top: 120,
          right: 16,
          zIndex: 9999,
          display: 'flex',
          gap: 1,
          bgcolor: 'rgba(255,255,255,0.9)',
          borderRadius: 2,
          p: 0.5,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      >
        <Tooltip title={isDrawingMode ? "关闭绘画模式" : "开启绘画模式"}>
          <IconButton
            size="small"
            onClick={() => {
              setIsDrawingMode(!isDrawingMode);
              if (isDrawingMode) {
                clearCanvas();
              }
            }}
            sx={{ 
              color: isDrawingMode ? '#0891B2' : '#666',
              bgcolor: isDrawingMode ? 'rgba(8, 145, 178, 0.1)' : 'transparent',
              '&:hover': { bgcolor: isDrawingMode ? 'rgba(8, 145, 178, 0.2)' : 'rgba(0,0,0,0.05)' }
            }}
          >
            <Pencil size={20} />
          </IconButton>
        </Tooltip>
        {isDrawingMode && (
          <>
            <Tooltip title="选择颜色">
              <IconButton
                size="small"
                onClick={(e) => setColorAnchor(e.currentTarget)}
                sx={{ 
                  color: color,
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
                }}
              >
                <Palette size={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="清除画布">
              <span>
                <IconButton
                  size="small"
                  onClick={clearCanvas}
                  disabled={!hasContent}
                  sx={{ 
                    color: '#EF4444',
                    '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' },
                    '&:disabled': { color: '#ccc' }
                  }}
                >
                  <Trash2 size={20} />
                </IconButton>
              </span>
            </Tooltip>
          </>
        )}
      </Box>
      {isDrawingMode && (
        <Popover
          open={Boolean(colorAnchor)}
          anchorEl={colorAnchor}
          onClose={() => setColorAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: 1 }}
        >
          <Box sx={{ p: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', maxWidth: 160 }}>
            {COLORS.map((c) => (
              <Box
                key={c}
                onClick={() => {
                  setColor(c);
                  setColorAnchor(null);
                }}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: c,
                  cursor: 'pointer',
                  border: color === c ? '3px solid #EF4444' : '2px solid transparent',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'transform 0.1s',
                  '&:hover': { transform: 'scale(1.1)' }
                }}
              />
            ))}
          </Box>
        </Popover>
      )}
    </>
  );
}

export default SideDrawingCanvas;
