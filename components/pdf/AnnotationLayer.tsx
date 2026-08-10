'use client';

import { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback, PointerEvent as ReactPointerEvent } from 'react';
import { ToolMode, AnnotationPoint, Stroke } from '@/types';
import { getAnnotationsByPage, createAnnotation, deleteAllAnnotations } from '@/lib/database';

interface AnnotationLayerProps {
  width: number;
  height: number;
  toolMode: ToolMode;
  paperId?: string;
  pageNumber?: number;
  onAnnotationChange?: (annotations: any[]) => void;
}

export interface AnnotationLayerRef {
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const AnnotationLayer = forwardRef<AnnotationLayerRef, AnnotationLayerProps>(({
  width,
  height,
  toolMode,
  paperId,
  pageNumber,
  onAnnotationChange,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<AnnotationPoint[]>([]);
  const [inputType, setInputType] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Undo/Redo用の履歴管理
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [undoneStrokes, setUndoneStrokes] = useState<Stroke[]>([]);

  // Supabaseからアノテーションを読み込む
  useEffect(() => {
    const loadAnnotations = async () => {
      if (!paperId || !pageNumber) {
        setStrokes([]);
        return;
      }

      setIsLoading(true);
      const annotations = await getAnnotationsByPage(paperId, pageNumber);

      // アノテーションをStroke形式に変換
      const loadedStrokes: Stroke[] = annotations.map((annotation) => ({
        tool: annotation.tool as ToolMode,
        points: annotation.points as AnnotationPoint[],
        color: annotation.color,
        width: annotation.width,
      }));

      setStrokes(loadedStrokes);
      setUndoneStrokes([]);
      setIsLoading(false);
    };

    loadAnnotations();
  }, [paperId, pageNumber]);

  // 全てのストロークを再描画する関数
  const redrawAllStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Canvasをクリア
    context.clearRect(0, 0, width, height);

    // 各ストロークを描画
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      context.beginPath();
      const firstPoint = stroke.points[0];
      context.moveTo(firstPoint.x * width, firstPoint.y * height);

      for (let i = 1; i < stroke.points.length; i++) {
        const point = stroke.points[i];
        context.lineTo(point.x * width, point.y * height);
      }

      // ツールモードに応じたスタイル設定
      switch (stroke.tool) {
        case 'pen':
          context.strokeStyle = stroke.color || '#000000';
          context.lineWidth = stroke.width || 2;
          context.globalAlpha = 1.0;
          break;
        case 'marker':
          context.strokeStyle = stroke.color || '#FFFF00';
          context.lineWidth = stroke.width || 10;
          context.globalAlpha = 0.4;
          break;
        case 'eraser':
          context.strokeStyle = '#FFFFFF';
          context.lineWidth = stroke.width || 20;
          context.globalAlpha = 1.0;
          break;
      }

      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.stroke();
    });

    // globalAlphaをリセット
    context.globalAlpha = 1.0;
  }, [width, height, strokes]);

  // Canvas初期化とストローク再描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Canvasのサイズ設定（Retina対応）
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    context.scale(dpr, dpr);

    // 全てのストロークを再描画
    redrawAllStrokes();
  }, [width, height, strokes, redrawAllStrokes]);

  // Undo/Redo関数を親コンポーネントに公開
  useImperativeHandle(ref, () => ({
    undo: () => {
      if (strokes.length > 0) {
        const lastStroke = strokes[strokes.length - 1];
        setStrokes((prev) => prev.slice(0, -1));
        setUndoneStrokes((prev) => [...prev, lastStroke]);
      }
    },
    redo: () => {
      if (undoneStrokes.length > 0) {
        const strokeToRedo = undoneStrokes[undoneStrokes.length - 1];
        setUndoneStrokes((prev) => prev.slice(0, -1));
        setStrokes((prev) => [...prev, strokeToRedo]);
      }
    },
    canUndo: () => strokes.length > 0,
    canRedo: () => undoneStrokes.length > 0,
  }), [strokes, undoneStrokes]);

  // Pointer Downイベント
  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 入力デバイスの種類を判定
    const deviceType = e.pointerType; // 'pen', 'touch', 'mouse'
    setInputType(deviceType);

    console.log('Pointer Type:', deviceType);
    console.log('Pressure:', e.pressure);
    console.log('Tool Mode:', toolMode);

    // Apple Pencil（pen）の場合のみ描画を開始
    // または、toolModeが'view'でない場合のみ描画
    if (deviceType === 'pen' || (deviceType !== 'touch' && toolMode !== 'view')) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const point: AnnotationPoint = {
        x: x / width, // 相対座標に変換（0〜1）
        y: y / height,
        pressure: e.pressure,
      };

      setIsDrawing(true);
      setCurrentStroke([point]);
    }
  };

  // Pointer Moveイベント
  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const point: AnnotationPoint = {
      x: x / width,
      y: y / height,
      pressure: e.pressure,
    };

    setCurrentStroke((prev) => [...prev, point]);

    // リアルタイム描画
    const context = canvas.getContext('2d');
    if (!context) return;

    if (currentStroke.length > 0) {
      const prevPoint = currentStroke[currentStroke.length - 1];
      const prevX = prevPoint.x * width;
      const prevY = prevPoint.y * height;
      const currX = x;
      const currY = y;

      context.beginPath();
      context.moveTo(prevX, prevY);
      context.lineTo(currX, currY);

      // ツールモードに応じたスタイル設定
      switch (toolMode) {
        case 'pen':
          context.strokeStyle = '#000000';
          context.lineWidth = 2 * (e.pressure || 0.5);
          context.globalAlpha = 1.0;
          break;
        case 'marker':
          context.strokeStyle = '#FFFF00';
          context.lineWidth = 10;
          context.globalAlpha = 0.4;
          break;
        case 'eraser':
          context.strokeStyle = '#FFFFFF';
          context.lineWidth = 20;
          context.globalAlpha = 1.0;
          break;
        default:
          context.strokeStyle = '#000000';
          context.lineWidth = 2;
          context.globalAlpha = 1.0;
      }

      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.stroke();
    }
  };

  // Pointer Upイベント
  const handlePointerUp = async () => {
    if (isDrawing && currentStroke.length > 0) {
      // 新しいストロークを履歴に追加
      const newStroke: Stroke = {
        tool: toolMode,
        points: currentStroke,
      };

      setStrokes((prev) => [...prev, newStroke]);

      // 新しい描画が行われたので、Redoスタックをクリア
      setUndoneStrokes([]);

      // Supabaseに保存
      if (paperId && pageNumber) {
        await createAnnotation({
          paper_id: paperId,
          page: pageNumber,
          tool: toolMode,
          color: toolMode === 'pen' ? '#000000' : toolMode === 'marker' ? '#FFFF00' : '#FFFFFF',
          width: toolMode === 'pen' ? 2 : toolMode === 'marker' ? 10 : 20,
          points: currentStroke,
        });
      }

      // コールバックを呼び出す
      if (onAnnotationChange) {
        onAnnotationChange([...strokes, newStroke]);
      }
    }

    setIsDrawing(false);
    setCurrentStroke([]);
  };

  // Pointer Cancelイベント
  const handlePointerCancel = () => {
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0"
      style={{
        touchAction: 'none', // タッチイベントのデフォルト動作を無効化
        cursor: toolMode === 'view' ? 'default' : 'crosshair',
        pointerEvents: toolMode === 'view' ? 'none' : 'auto', // 閲覧モードではCanvasを透過
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    />
  );
});

AnnotationLayer.displayName = 'AnnotationLayer';

export default AnnotationLayer;
