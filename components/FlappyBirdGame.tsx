/**
 * フライングバード - Flappy Bird風のゲーム
 * 
 * 鳥を操縦してパイプを避けながらスコアを稼ぐゲーム
 * タップまたはスペースキーで鳥を浮上させる
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

// ゲーム設定
const GAME_SETTINGS = {
  GRAVITY: 0.4,
  JUMP_VELOCITY: -8,
  BIRD_WIDTH: 40,
  BIRD_HEIGHT: 30,
  PIPE_WIDTH: 60,
  PIPE_GAP: 150,
  PIPE_SPACING: 200,
  GAME_SPEED: 3,
  GAME_WIDTH: 800,
  GAME_HEIGHT: 600
};

// 鳥の状態
interface BirdState {
  x: number;
  y: number;
  velocityY: number;
  rotation: number;
}

// パイプの定義
interface Pipe {
  id: number;
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
}

/**
 * フライングバードゲームコンポーネント
 */
const FlappyBirdGame = () => {
  const { recordScore, closeGame } = useGameStore();
  
  // ゲーム状態
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('flappyBirdHighScore') || '0');
  });
  
  // ゲームオブジェクト
  const [bird, setBird] = useState<BirdState>({
    x: 100,
    y: GAME_SETTINGS.GAME_HEIGHT / 2,
    velocityY: 0,
    rotation: 0
  });
  
  const [pipes, setPipes] = useState<Pipe[]>([]);
  
  // ゲームループRef
  const gameLoopRef = useRef<number>();
  const pipeIdRef = useRef(0);
  const frameCountRef = useRef(0);
  
  /**
   * ゲーム開始
   */
  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setBird({
      x: 100,
      y: GAME_SETTINGS.GAME_HEIGHT / 2,
      velocityY: 0,
      rotation: 0
    });
    setPipes([]);
    frameCountRef.current = 0;
    pipeIdRef.current = 0;
  }, []);
  
  /**
   * 鳥をジャンプさせる
   */
  const jump = useCallback(() => {
    if (gameState === 'playing') {
      setBird(prev => ({
        ...prev,
        velocityY: GAME_SETTINGS.JUMP_VELOCITY,
        rotation: -20
      }));
    }
  }, [gameState]);
  
  /**
   * 衝突検出
   */
  const checkCollision = useCallback((birdState: BirdState, pipes: Pipe[]): boolean => {
    // 天井・地面との衝突
    if (birdState.y < 0 || birdState.y + GAME_SETTINGS.BIRD_HEIGHT > GAME_SETTINGS.GAME_HEIGHT) {
      return true;
    }
    
    // パイプとの衝突
    for (const pipe of pipes) {
      const birdLeft = birdState.x;
      const birdRight = birdState.x + GAME_SETTINGS.BIRD_WIDTH;
      const birdTop = birdState.y;
      const birdBottom = birdState.y + GAME_SETTINGS.BIRD_HEIGHT;
      
      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + GAME_SETTINGS.PIPE_WIDTH;
      
      // 鳥がパイプの範囲内にいるかチェック
      if (birdRight > pipeLeft && birdLeft < pipeRight) {
        // 上下のパイプとの衝突をチェック
        if (birdTop < pipe.topHeight || birdBottom > GAME_SETTINGS.GAME_HEIGHT - pipe.bottomHeight) {
          return true;
        }
      }
    }
    
    return false;
  }, []);
  
  /**
   * ゲーム終了処理
   */
  const gameOver = useCallback(() => {
    setGameState('gameOver');
    
    // ハイスコア更新
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('flappyBirdHighScore', score.toString());
    }
    
    // ゲームストアにスコアを記録
    recordScore('flappy', score);
  }, [score, highScore, recordScore]);
  
  /**
   * ゲームループ
   */
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;
    
    frameCountRef.current++;
    
    // 鳥の物理演算
    setBird(prev => {
      const newY = prev.y + prev.velocityY;
      const newVelocityY = prev.velocityY + GAME_SETTINGS.GRAVITY;
      const newRotation = Math.min(90, prev.rotation + 3);
      
      return {
        ...prev,
        y: newY,
        velocityY: newVelocityY,
        rotation: newRotation
      };
    });
    
    // パイプの移動と生成
    setPipes(prev => {
      let newPipes = prev.map(pipe => ({
        ...pipe,
        x: pipe.x - GAME_SETTINGS.GAME_SPEED
      })).filter(pipe => pipe.x > -GAME_SETTINGS.PIPE_WIDTH);
      
      // 新しいパイプを生成
      if (frameCountRef.current % (GAME_SETTINGS.PIPE_SPACING / GAME_SETTINGS.GAME_SPEED) === 0) {
        const pipeHeight = Math.random() * (GAME_SETTINGS.GAME_HEIGHT - GAME_SETTINGS.PIPE_GAP - 200) + 100;
        newPipes.push({
          id: pipeIdRef.current++,
          x: GAME_SETTINGS.GAME_WIDTH,
          topHeight: pipeHeight,
          bottomHeight: GAME_SETTINGS.GAME_HEIGHT - pipeHeight - GAME_SETTINGS.PIPE_GAP,
          passed: false
        });
      }
      
      return newPipes;
    });
    
    // スコア更新（パイプを通過した時）
    setPipes(currentPipes => {
      const updatedPipes = currentPipes.map(pipe => {
        if (!pipe.passed && pipe.x + GAME_SETTINGS.PIPE_WIDTH < bird.x) {
          setScore(prev => prev + 1);
          return { ...pipe, passed: true };
        }
        return pipe;
      });
      return updatedPipes;
    });
    
    // 衝突検出
    if (checkCollision(bird, pipes)) {
      gameOver();
      return;
    }
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, bird, pipes, checkCollision, gameOver]);
  
  // ゲームループの開始/停止
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    }
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);
  
  // キーボードイベント
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'menu' || gameState === 'gameOver') {
          startGame();
        } else if (gameState === 'playing') {
          jump();
        }
      } else if (e.key === 'Escape') {
        closeGame();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, startGame, jump, closeGame]);
  
  /**
   * UI渲染
   */
  const renderGame = () => (
    <div 
      className="relative w-full h-full bg-gradient-to-b from-blue-400 to-blue-200 overflow-hidden cursor-pointer"
      onClick={jump}
    >
      {/* パイプ */}
      {pipes.map(pipe => (
        <div key={pipe.id}>
          {/* 上のパイプ */}
          <div
            className="absolute bg-green-500 border-2 border-green-600"
            style={{
              left: pipe.x,
              top: 0,
              width: GAME_SETTINGS.PIPE_WIDTH,
              height: pipe.topHeight
            }}
          />
          {/* 下のパイプ */}
          <div
            className="absolute bg-green-500 border-2 border-green-600"
            style={{
              left: pipe.x,
              bottom: 0,
              width: GAME_SETTINGS.PIPE_WIDTH,
              height: pipe.bottomHeight
            }}
          />
        </div>
      ))}
      
      {/* 鳥 */}
      <motion.div
        className="absolute flex items-center justify-center text-4xl select-none"
        style={{
          left: bird.x,
          top: bird.y,
          width: GAME_SETTINGS.BIRD_WIDTH,
          height: GAME_SETTINGS.BIRD_HEIGHT
        }}
        animate={{
          rotateZ: bird.rotation
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      >
        🐦
      </motion.div>
      
      {/* UI情報 */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center">
        <div className="text-4xl font-bold text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
          {score}
        </div>
      </div>
      
      {/* ハイスコア表示 */}
      <div className="absolute top-4 right-4 text-white">
        <div className="text-sm">最高スコア</div>
        <div className="text-xl font-bold">{highScore}</div>
      </div>
    </div>
  );
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div 
        className="bg-blue-100 w-full max-w-4xl relative rounded-lg overflow-hidden"
        style={{ height: GAME_SETTINGS.GAME_HEIGHT }}
      >
        {/* ゲーム画面 */}
        {gameState === 'playing' && renderGame()}
        
        {/* スタート画面 */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-blue-400 to-blue-200">
            <div className="text-center">
              <div className="text-6xl mb-4">🐦</div>
              <h2 className="text-2xl font-bold text-white mb-4">フライングバード</h2>
              <p className="text-white mb-6">タップまたはスペースキーで鳥を飛ばそう！</p>
              <button
                onClick={startGame}
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
              >
                スタート
              </button>
            </div>
          </div>
        )}
        
        {/* ゲームオーバー画面 */}
        {gameState === 'gameOver' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-red-400 bg-opacity-90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center text-white">
              <div className="text-6xl mb-4">💥</div>
              <h2 className="text-2xl font-bold mb-2">ゲームオーバー</h2>
              <p className="text-xl mb-2">スコア: {score}</p>
              {score > highScore && (
                <p className="text-yellow-300 font-bold mb-4">最高記録！</p>
              )}
              <button
                onClick={startGame}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors mr-3"
              >
                再プレイ
              </button>
              <button
                onClick={closeGame}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
              >
                終了
              </button>
            </div>
          </motion.div>
        )}
        
        {/* 閉じるボタン */}
        <button
          onClick={closeGame}
          className="absolute top-4 left-4 bg-red-500 text-white w-10 h-10 rounded-full hover:bg-red-600 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default FlappyBirdGame;