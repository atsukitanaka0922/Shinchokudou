/**
 * ディノランゲームコンポーネント
 * 
 * Chromeの恐竜ゲームを模したHTML5キャンバスゲーム
 * スペースキーまたはタップでジャンプして障害物を避ける
 * v1.5.1: スマホでの動作速度問題を修正（フレームレート制御）
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameCenterStore } from '@/store/gameCenterStore';
import { useDevice } from '@/hooks/useDevice';

/**
 * ゲームオブジェクトの型定義
 */
interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY?: number;
}

interface Obstacle extends GameObject {
  passed: boolean;
}

/**
 * ディノランゲームコンポーネント
 */
export default function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);
  
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'gameOver'>('waiting');
  const [score, setScore] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 200 }); // 🔥 追加: キャンバスサイズ状態
  
  const { endGame, startGame, getBestScore, canPlayGame } = useGameCenterStore();
  const isMobile = useDevice();
  
  // 🔥 修正: キャンバスサイズを状態として管理
  useEffect(() => {
    const updateCanvasSize = () => {
      const width = isMobile ? Math.min(350, window.innerWidth - 32) : 600;
      const height = isMobile ? 150 : 200;
      setCanvasSize({ width, height });
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [isMobile]);
  
  const CANVAS_WIDTH = canvasSize.width;
  const CANVAS_HEIGHT = canvasSize.height;
  const GROUND_HEIGHT = 20;
  const GRAVITY = 0.6;
  const JUMP_FORCE = -12;
  const GAME_SPEED = isMobile ? 3 : 4; // 🔥 修正: スマホではゲーム速度を少し遅く
  const TARGET_FPS = 60;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;
  
  // ゲームオブジェクト（動的に初期化）
  const dinoRef = useRef<GameObject | null>(null);
  
  // 🔥 追加: 恐竜オブジェクトの初期化
  useEffect(() => {
    if (!dinoRef.current || dinoRef.current.width !== (isMobile ? 25 : 30)) {
      dinoRef.current = {
        x: 50,
        y: CANVAS_HEIGHT - GROUND_HEIGHT - (isMobile ? 35 : 40),
        width: isMobile ? 25 : 30,
        height: isMobile ? 35 : 40,
        velocityY: 0
      };
    }
  }, [CANVAS_WIDTH, CANVAS_HEIGHT, isMobile]);
  
  const obstaclesRef = useRef<Obstacle[]>([]);
  const scoreRef = useRef(0);
  const gameSpeedRef = useRef(GAME_SPEED);
  const gameOverProcessedRef = useRef(false);

  /**
   * キャンバスに矩形を描画
   */
  const drawRect = (ctx: CanvasRenderingContext2D, obj: GameObject, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
  };

  /**
   * 恐竜を描画
   */
  const drawDino = (ctx: CanvasRenderingContext2D) => {
    const dino = dinoRef.current;
    
    // 恐竜の体
    drawRect(ctx, dino, '#535353');
    
    // 目
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(dino.x + 20, dino.y + 5, 3, 3);
    
    // 足（ジャンプ中は位置調整）
    if (!isJumping) {
      ctx.fillStyle = '#535353';
      ctx.fillRect(dino.x + 5, dino.y + 35, 4, 8);
      ctx.fillRect(dino.x + 15, dino.y + 35, 4, 8);
    }
  };

  /**
   * 障害物を描画
   */
  const drawObstacles = (ctx: CanvasRenderingContext2D) => {
    obstaclesRef.current.forEach(obstacle => {
      drawRect(ctx, obstacle, '#535353');
    });
  };

  /**
   * 地面を描画
   */
  const drawGround = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#535353';
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
    
    // 地面のライン
    ctx.strokeStyle = '#535353';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - GROUND_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);
    ctx.stroke();
  };

  /**
   * 当たり判定
   */
  const checkCollision = (obj1: GameObject, obj2: GameObject): boolean => {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
  };

  /**
   * ゲームロジック更新
   */
  const updateGame = useCallback(() => {
    const dino = dinoRef.current;
    if (!dino) return; // 🔥 追加: null チェック
    
    // 恐竜の物理演算
    if (dino.velocityY !== undefined) {
      dino.velocityY += GRAVITY;
      dino.y += dino.velocityY;
      
      // 地面との衝突判定
      const groundY = CANVAS_HEIGHT - GROUND_HEIGHT - dino.height;
      if (dino.y >= groundY) {
        dino.y = groundY;
        dino.velocityY = 0;
        setIsJumping(false);
      }
    }
    
    // 障害物の更新
    obstaclesRef.current = obstaclesRef.current.filter(obstacle => {
      obstacle.x -= gameSpeedRef.current;
      
      // スコア更新
      if (!obstacle.passed && obstacle.x + obstacle.width < dino.x) {
        obstacle.passed = true;
        scoreRef.current += 10;
        setScore(scoreRef.current);
      }
      
      return obstacle.x + obstacle.width > 0;
    });
    
    // 新しい障害物を生成
    if (obstaclesRef.current.length === 0 || 
        obstaclesRef.current[obstaclesRef.current.length - 1].x < CANVAS_WIDTH - 200) {
      if (Math.random() < 0.02) { // 2%の確率で生成
        obstaclesRef.current.push({
          x: CANVAS_WIDTH,
          y: CANVAS_HEIGHT - GROUND_HEIGHT - 30,
          width: 15,
          height: 30,
          passed: false
        });
      }
    }
    
    // 当たり判定
    for (const obstacle of obstaclesRef.current) {
      if (checkCollision(dino, obstacle)) {
        setGameState('gameOver');
        return;
      }
    }
    
    // ゲームスピード上昇
    gameSpeedRef.current += 0.001;
  }, [CANVAS_WIDTH, CANVAS_HEIGHT]); // 🔥 修正: 依存関係を追加

  /**
   * ゲーム描画
   */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 画面クリア
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 描画
    drawGround(ctx);
    drawDino(ctx);
    drawObstacles(ctx);
    
    // スコア表示
    ctx.fillStyle = '#535353';
    ctx.font = isMobile ? '14px monospace' : '16px monospace'; // 🔥 修正: スマホでは文字サイズを小さく
    ctx.fillText(`スコア: ${scoreRef.current}`, 10, isMobile ? 25 : 30);
    
    if (gameState === 'waiting') {
      ctx.fillStyle = '#535353';
      ctx.font = isMobile ? '16px monospace' : '20px monospace'; // 🔥 修正: スマホ対応
      ctx.textAlign = 'center';
      ctx.fillText('スペースキーでスタート', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.textAlign = 'left';
    }
    
    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = isMobile ? '18px monospace' : '24px monospace'; // 🔥 修正: スマホ対応
      ctx.textAlign = 'center';
      ctx.fillText('ゲームオーバー', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - (isMobile ? 30 : 40));
      ctx.font = isMobile ? '12px monospace' : '16px monospace'; // 🔥 修正: スマホ対応
      ctx.fillText(`最終スコア: ${scoreRef.current}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - (isMobile ? 15 : 10));
      
      if (canPlayGame()) {
        ctx.fillText(isMobile ? 'タップでリトライ (5pt)' : 'スペースキーでリトライ (5ポイント)', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + (isMobile ? 15 : 20));
      } else {
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('ポイント不足', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + (isMobile ? 15 : 20));
      }
      
      ctx.textAlign = 'left';
    }
  }, [gameState, canPlayGame]);

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
   * ジャンプ処理
   */
  const jump = useCallback(() => {
    if (gameState === 'waiting') {
      setGameState('playing');
      return;
    }
    
    if (gameState === 'playing' && !isJumping) {
      const dino = dinoRef.current;
      if (dino.velocityY !== undefined && dino.velocityY === 0) {
        dino.velocityY = JUMP_FORCE;
        setIsJumping(true);
      }
    }
    
    if (gameState === 'gameOver') {
      handleRetry();
    }
  }, [gameState, isJumping]);

  /**
   * ゲームリセット（初期化）
   */
  /**
   * ゲームリセット（初期化）
   */
  const resetGameState = () => {
    // 恐竜リセット
    dinoRef.current = {
      x: 50,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - (isMobile ? 35 : 40),
      width: isMobile ? 25 : 30,
      height: isMobile ? 35 : 40,
      velocityY: 0
    };
    
    // ゲーム状態リセット
    obstaclesRef.current = [];
    scoreRef.current = 0;
    gameSpeedRef.current = GAME_SPEED;
    setScore(0);
    setIsJumping(false);
    gameOverProcessedRef.current = false;
    lastFrameTimeRef.current = 0;
    setGameState('waiting');
  };
    
    // ゲーム状態リセット
    obstaclesRef.current = [];
    scoreRef.current = 0;
    gameSpeedRef.current = GAME_SPEED;
    setScore(0);
    setIsJumping(false);
    gameOverProcessedRef.current = false;
    lastFrameTimeRef.current = 0; // 🔥 追加: フレームタイムリセット
    setGameState('waiting');
  };

  /**
   * リトライ処理（新規ゲーム開始として処理）
   */
  const handleRetry = async () => {
    console.log("ディノラン: リトライ処理開始");
    
    // ポイントチェック
    if (!canPlayGame()) {
      console.log("ディノラン: ポイント不足でリトライ不可");
      return;
    }
    
    try {
      const success = await startGame('dino');
      
      if (success) {
        console.log("ディノラン: リトライ成功、ポイント消費完了");
        resetGameState();
        setGameState('playing');
      } else {
        console.log("ディノラン: リトライ失敗");
      }
    } catch (error) {
      console.error("ディノラン: リトライエラー", error);
    }
  };

  /**
   * 🔥 修正: タッチイベントの改善（重複防止）
   */
  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // デフォルトのタッチ動作を防止
    jump();
  }, [jump]);

  /**
   * キーボードイベント
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [jump]);

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
      
      console.log(`ディノラン ゲーム終了: スコア ${finalScore}`);
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
        <h3 className="text-lg font-bold mb-2">🦕 ディノラン</h3>
        <p className="text-sm text-gray-600 mb-2">
          {isMobile ? 'タップでジャンプ！障害物を避けよう！' : 'スペースキーまたはタップでジャンプ！障害物を避けよう！'}
        </p>
        <div className="flex justify-center space-x-4 text-sm">
          <span>現在: {score}点</span>
          <span>最高: {getBestScore('dino')}点</span>
        </div>
      </div>
      
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={jump}
          onTouchStart={handleTouch}
          className="block cursor-pointer bg-white max-w-full" // 🔥 修正: max-w-fullを追加
          style={{ touchAction: 'none' }}
        />
      </div>
      
      <div className="mt-4 text-center">
        <button
          onClick={jump}
          className={`px-4 py-2 rounded-lg mr-2 ${
            gameState === 'gameOver' && !canPlayGame()
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          disabled={gameState === 'gameOver' && !canPlayGame()}
        >
          {gameState === 'waiting' ? 'スタート' : 
           gameState === 'playing' ? 'ジャンプ' : 
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
    </motion.div>
  );
}