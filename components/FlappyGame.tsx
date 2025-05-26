/**
 * フラッピーバードゲームコンポーネント
 * 
 * フラッピーバードを模したHTML5キャンバスゲーム
 * タップまたはスペースキーで鳥を上昇させ、パイプの隙間を通り抜ける
 * v1.5.1: スマホでの動作速度問題を修正（フレームレート制御）
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameCenterStore } from '@/store/gameCenterStore';
import { useDevice } from '@/hooks/useDevice';

/**
 * ゲームオブジェクトの型定義
 */
interface Bird {
  x: number;
  y: number;
  velocityY: number;
  rotation: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
}

/**
 * フラッピーバードゲームコンポーネント
 */
export default function FlappyGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);
  
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'gameOver'>('waiting');
  const [score, setScore] = useState(0);
  const [canRetry, setCanRetry] = useState(true); // 🔥 追加: リトライ可能フラグ
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 600 }); // 🔥 追加: キャンバスサイズ状態
  
  const { endGame, startGame, getBestScore, canPlayGame } = useGameCenterStore();
  const isMobile = useDevice();
  
  // 🔥 修正: キャンバスサイズを状態として管理
  useEffect(() => {
    const updateCanvasSize = () => {
      const width = isMobile ? Math.min(320, window.innerWidth - 32) : 400;
      const height = isMobile ? Math.min(480, window.innerHeight - 200) : 600;
      setCanvasSize({ width, height });
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [isMobile]);
  
  const CANVAS_WIDTH = canvasSize.width;
  const CANVAS_HEIGHT = canvasSize.height;
  const BIRD_SIZE = isMobile ? 16 : 20; // 🔥 修正: スマホでは鳥のサイズを小さく
  const PIPE_WIDTH = isMobile ? 50 : 60; // 🔥 修正: スマホでパイプ幅を調整
  const PIPE_GAP = isMobile ? 120 : 150; // 🔥 修正: スマホでパイプの隙間を狭く
  const GRAVITY = 0.5;
  const FLAP_FORCE = -8;
  const PIPE_SPEED = isMobile ? 2.5 : 3; // 🔥 修正: スマホではゲーム速度を少し遅く
  const TARGET_FPS = 60;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;
  
  // ゲームオブジェクト（動的に初期化）
  const birdRef = useRef<Bird | null>(null);
  
  // 🔥 追加: 鳥オブジェクトの初期化
  useEffect(() => {
    if (!birdRef.current) {
      birdRef.current = {
        x: isMobile ? 60 : 80,
        y: CANVAS_HEIGHT / 2,
        velocityY: 0,
        rotation: 0
      };
    }
  }, [CANVAS_WIDTH, CANVAS_HEIGHT, isMobile]);
  
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const gameOverProcessedRef = useRef(false);

  /**
   * 鳥を描画
   */
  const drawBird = (ctx: CanvasRenderingContext2D) => {
    const bird = birdRef.current;
    
    ctx.save();
    ctx.translate(bird.x + BIRD_SIZE / 2, bird.y + BIRD_SIZE / 2);
    ctx.rotate(bird.rotation);
    
    // 鳥の体
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);
    
    // 目
    ctx.fillStyle = '#000';
    ctx.fillRect(-BIRD_SIZE / 4, -BIRD_SIZE / 4, 4, 4);
    
    // くちばし
    ctx.fillStyle = '#FF6347';
    ctx.fillRect(BIRD_SIZE / 2 - 2, -2, 6, 4);
    
    ctx.restore();
  };

  /**
   * パイプを描画
   */
  const drawPipes = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#228B22';
    
    pipesRef.current.forEach(pipe => {
      // 上のパイプ
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
      
      // 下のパイプ
      ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, CANVAS_HEIGHT - pipe.bottomY);
      
      // パイプの縁
      ctx.fillStyle = '#006400';
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, PIPE_WIDTH + 10, 30);
      ctx.fillRect(pipe.x - 5, pipe.bottomY, PIPE_WIDTH + 10, 30);
      ctx.fillStyle = '#228B22';
    });
  };

  /**
   * 背景を描画
   */
  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // 空のグラデーション
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 雲
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 3; i++) {
      const x = (i * 150) + 50;
      const y = 50 + (i * 30);
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
      ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  /**
   * 当たり判定
   */
  const checkCollision = (): boolean => {
    const bird = birdRef.current;
    
    // 画面上下の境界
    if (bird.y <= 0 || bird.y + BIRD_SIZE >= CANVAS_HEIGHT) {
      return true;
    }
    
    // パイプとの衝突判定
    for (const pipe of pipesRef.current) {
      if (bird.x + BIRD_SIZE > pipe.x && 
          bird.x < pipe.x + PIPE_WIDTH) {
        if (bird.y < pipe.topHeight || 
            bird.y + BIRD_SIZE > pipe.bottomY) {
          return true;
        }
      }
    }
    
    return false;
  };

  /**
   * ゲームロジック更新
   */
  const updateGame = useCallback(() => {
    const bird = birdRef.current;
    if (!bird) return; // 🔥 追加: null チェック
    
    // 鳥の物理演算
    bird.velocityY += GRAVITY;
    bird.y += bird.velocityY;
    
    // 鳥の回転（速度に応じて）
    bird.rotation = Math.min(Math.max(bird.velocityY * 0.1, -0.5), 0.5);
    
    // パイプの更新
    pipesRef.current = pipesRef.current.filter(pipe => {
      pipe.x -= PIPE_SPEED;
      
      // スコア更新
      if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
        pipe.passed = true;
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }
      
      return pipe.x + PIPE_WIDTH > 0;
    });
    
    // 新しいパイプを生成
    if (pipesRef.current.length === 0 || 
        pipesRef.current[pipesRef.current.length - 1].x < CANVAS_WIDTH - 200) {
      const topHeight = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 100) + 50;
      pipesRef.current.push({
        x: CANVAS_WIDTH,
        topHeight,
        bottomY: topHeight + PIPE_GAP,
        passed: false
      });
    }
    
    // 当たり判定
    if (checkCollision()) {
      setGameState('gameOver');
      setCanRetry(false); // 🔥 追加: ゲームオーバー時にリトライを一時的に無効化
      
      // 🔥 追加: 3秒後にリトライを有効化
      setTimeout(() => {
        setCanRetry(true);
      }, 3000);
    }
  }, [CANVAS_WIDTH, CANVAS_HEIGHT]); // 🔥 修正: 依存関係を追加

  /**
   * ゲーム描画
   */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 背景描画
    drawBackground(ctx);
    
    // ゲームオブジェクト描画
    drawPipes(ctx);
    drawBird(ctx);
    
    // スコア表示
    ctx.fillStyle = '#000';
    ctx.font = isMobile ? 'bold 20px Arial' : 'bold 24px Arial'; // 🔥 修正: スマホでは文字サイズを小さく
    ctx.textAlign = 'center';
    ctx.fillText(scoreRef.current.toString(), CANVAS_WIDTH / 2, isMobile ? 40 : 50);
    
    // ゲーム状態別の表示
    if (gameState === 'waiting') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#FFF';
      ctx.font = isMobile ? 'bold 16px Arial' : 'bold 20px Arial'; // 🔥 修正: スマホ対応
      ctx.fillText('フラッピーバード', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - (isMobile ? 30 : 40));
      ctx.font = isMobile ? '12px Arial' : '16px Arial'; // 🔥 修正: スマホ対応
      ctx.fillText(isMobile ? 'タップでスタート' : 'タップまたはスペースキーでスタート', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillText('パイプの隙間を通り抜けよう！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + (isMobile ? 20 : 30));
    }
    
    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#FFF';
      ctx.font = isMobile ? 'bold 18px Arial' : 'bold 24px Arial'; // 🔥 修正: スマホ対応
      ctx.fillText('ゲームオーバー', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - (isMobile ? 40 : 50));
      ctx.font = isMobile ? '14px Arial' : '18px Arial'; // 🔥 修正: スマホ対応
      ctx.fillText(`スコア: ${scoreRef.current}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - (isMobile ? 20 : 20));
      
      ctx.font = isMobile ? '12px Arial' : '16px Arial';
      if (canPlayGame() && canRetry) { // 🔥 修正: canRetryも条件に追加
        ctx.fillText(isMobile ? 'タップでリトライ (5pt)' : 'タップでリトライ (5ポイント)', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + (isMobile ? 15 : 20));
      } else if (!canPlayGame()) {
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('ポイント不足', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + (isMobile ? 15 : 20));
      } else if (!canRetry) { // 🔥 追加: リトライ待機中の表示
        ctx.fillStyle = '#ffaa00';
        ctx.fillText('リトライまで待機中...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + (isMobile ? 15 : 20));
      }
    }
    
    ctx.textAlign = 'left';
  }, [gameState, canPlayGame]);

  /**
   * 羽ばたき処理
   */
  const flap = useCallback(() => {
    if (gameState === 'waiting') {
      setGameState('playing');
      return;
    }
    
    if (gameState === 'playing') {
      birdRef.current && (birdRef.current.velocityY = FLAP_FORCE); // 🔥 修正: null チェック
    }
    
    if (gameState === 'gameOver' && canRetry) { // 🔥 修正: canRetry条件を追加
      handleRetry();
    }
  }, [gameState, canRetry]); // 🔥 修正: 依存関係にcanRetryを追加

  /**
   * ゲームリセット（初期化）
   */
  const resetGameState = () => {
    // 鳥リセット
    birdRef.current = {
      x: isMobile ? 60 : 80,
      y: CANVAS_HEIGHT / 2,
      velocityY: 0,
      rotation: 0
    };
    
    // ゲーム状態リセット
    pipesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    gameOverProcessedRef.current = false;
    lastFrameTimeRef.current = 0;
    setCanRetry(true); // 🔥 追加: リトライフラグをリセット
    setGameState('waiting');
  };
    
    // ゲーム状態リセット
    pipesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    gameOverProcessedRef.current = false;
    lastFrameTimeRef.current = 0; // 🔥 追加: フレームタイムリセット
    setGameState('waiting');
  };

  /**
   * リトライ処理（新規ゲーム開始として処理）
   */
  const handleRetry = async () => {
    console.log("フラッピーバード: リトライ処理開始");
    
    // ポイントチェック
    if (!canPlayGame()) {
      console.log("フラッピーバード: ポイント不足でリトライ不可");
      return;
    }
    
    try {
      const success = await startGame('flappy');
      
      if (success) {
        console.log("フラッピーバード: リトライ成功、ポイント消費完了");
        resetGameState();
        setGameState('playing');
      } else {
        console.log("フラッピーバード: リトライ失敗");
      }
    } catch (error) {
      console.error("フラッピーバード: リトライエラー", error);
    }
  };

  /**
   * 🔥 修正: フレームレート制御付きゲームループ
   */
  const gameLoop = useCallback((currentTime: number = 0) => {
    // フレームレート制御
    if (currentTime - lastFrameTimeRef.current >= FRAME_INTERVAL) {
      if (gameState === 'playing') {
        updateGame();
      }
      draw();
      lastFrameTimeRef.current = currentTime;
    }
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, updateGame, draw]);

  /**
   * 🔥 修正: タッチイベントの改善（重複防止）
   */
  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // デフォルトのタッチ動作を防止
    flap();
  }, [flap]);

  /**
   * キーボードイベント
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        flap();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [flap]);

  /**
   * ゲームループ開始
   */
  useEffect(() => {
    lastFrameTimeRef.current = performance.now(); // 🔥 修正: 初期時間設定
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  /**
   * ゲーム終了時の処理
   */
  useEffect(() => {
    if (gameState === 'gameOver' && !gameOverProcessedRef.current) {
      gameOverProcessedRef.current = true;
      const finalScore = scoreRef.current;
      
      console.log(`フラッピーバード ゲーム終了: スコア ${finalScore}`);
      endGame(finalScore);
    }
  }, [gameState, endGame]);

  return (
    <motion.div 
      className="flex flex-col items-center p-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-4 text-center">
        <h3 className="text-lg font-bold mb-2">🐦 フラッピーバード</h3>
        <p className="text-sm text-gray-600 mb-2">
          {isMobile ? 'タップで羽ばたき！パイプの隙間を通り抜けよう！' : 'タップまたはスペースキーで羽ばたき！パイプの隙間を通り抜けよう！'}
        </p>
        <div className="flex justify-center space-x-4 text-sm">
          <span>現在: {score}点</span>
          <span>最高: {getBestScore('flappy')}点</span>
        </div>
      </div>
      
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={flap}
          onTouchStart={handleTouch}
          className="block cursor-pointer max-w-full max-h-full" // 🔥 修正: max-w-full, max-h-fullを追加
          style={{ touchAction: 'none' }}
        />
      </div>
      
      <div className="mt-4 text-center">
        <button
          onClick={flap}
          className={`px-4 py-2 rounded-lg mr-2 ${
            gameState === 'gameOver' && (!canPlayGame() || !canRetry) // 🔥 修正: canRetryも条件に追加
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
          disabled={gameState === 'gameOver' && (!canPlayGame() || !canRetry)} // 🔥 修正: canRetryも条件に追加
        >
          {gameState === 'waiting' ? 'スタート' : 
           gameState === 'playing' ? '羽ばたき' : 
           !canRetry ? '待機中...' : // 🔥 追加: 待機中の表示
           canPlayGame() ? 'リトライ (5pt)' : 'ポイント不足'}
        </button>
        <button
          onClick={resetGameState}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          リセット
        </button>
      </div>
      
      {gameState === 'gameOver' && !canPlayGame() && (
        <div className="mt-2 text-xs text-red-600 text-center">
          リトライにはポイントが不足しています。<br/>
          タスクを完了してポイントを獲得してください。
        </div>
      )}
      
      {/* 🔥 追加: 待機中の説明 */}
      {gameState === 'gameOver' && canPlayGame() && !canRetry && (
        <div className="mt-2 text-xs text-orange-600 text-center">
          連打防止のため、少しお待ちください...<br/>
          まもなくリトライできます。
        </div>
      )}
    </motion.div>
  );
}