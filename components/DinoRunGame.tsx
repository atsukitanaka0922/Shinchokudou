/**
 * ディノラン - Chrome Dinosaur Game風のゲーム
 * 
 * シンプルなエンドレスランゲームを実装
 * スペースキーでジャンプ、障害物を避けながらスコアを稼ぐ
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

// ゲーム設定
const GAME_SETTINGS = {
  GRAVITY: 0.5,
  JUMP_VELOCITY: -12,
  GROUND_Y: 200,
  DINO_WIDTH: 40,
  DINO_HEIGHT: 40,
  OBSTACLE_WIDTH: 20,
  OBSTACLE_HEIGHT: 40,
  GAME_SPEED: 4,
  CLOUD_SPEED: 1,
  SPAWN_RATE: 0.015 // 障害物の出現確率
};

// 恐竜の状態
interface DinoState {
  x: number;
  y: number;
  velocityY: number;
  isJumping: boolean;
  isRunning: boolean;
}

// 障害物の定義
interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'cactus' | 'bird';
}

// 雲の定義
interface Cloud {
  id: number;
  x: number;
  y: number;
}

/**
 * ディノランゲームコンポーネント
 */
const DinoRunGame = () => {
  const { recordScore, closeGame } = useGameStore();
  
  // ゲーム状態
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('dinoRunHighScore') || '0');
  });
  
  // ゲームオブジェクト
  const [dino, setDino] = useState<DinoState>({
    x: 50,
    y: GAME_SETTINGS.GROUND_Y,
    velocityY: 0,
    isJumping: false,
    isRunning: false
  });
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [clouds, setClouds] = useState<Cloud[]>([]);
  
  // ゲームループRef
  const gameLoopRef = useRef<number>();
  const obstacleIdRef = useRef(0);
  const cloudIdRef = useRef(0);
  const frameCountRef = useRef(0);
  
  /**
   * ゲーム開始
   */
  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setDino({
      x: 50,
      y: GAME_SETTINGS.GROUND_Y,
      velocityY: 0,
      isJumping: false,
      isRunning: true
    });
    setObstacles([]);
    setClouds([
      { id: cloudIdRef.current++, x: 200, y: 50 },
      { id: cloudIdRef.current++, x: 400, y: 80 },
      { id: cloudIdRef.current++, x: 600, y: 60 }
    ]);
    frameCountRef.current = 0;
  }, []);
  
  /**
   * ジャンプ処理
   */
  const jump = useCallback(() => {
    if (gameState === 'playing' && !dino.isJumping) {
      setDino(prev => ({
        ...prev,
        velocityY: GAME_SETTINGS.JUMP_VELOCITY,
        isJumping: true
      }));
    }
  }, [gameState, dino.isJumping]);
  
  /**
   * 衝突検出
   */
  const checkCollision = useCallback((dinoState: DinoState, obstacle: Obstacle): boolean => {
    return (
      dinoState.x < obstacle.x + obstacle.width &&
      dinoState.x + GAME_SETTINGS.DINO_WIDTH > obstacle.x &&
      dinoState.y < obstacle.y + obstacle.height &&
      dinoState.y + GAME_SETTINGS.DINO_HEIGHT > obstacle.y
    );
  }, []);
  
  /**
   * ゲーム終了処理
   */
  const gameOver = useCallback(() => {
    setGameState('gameOver');
    setDino(prev => ({ ...prev, isRunning: false }));
    
    // ハイスコア更新
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('dinoRunHighScore', score.toString());
    }
    
    // ゲームストアにスコアを記録
    recordScore('dinosaur', score);
  }, [score, highScore, recordScore]);
  
  /**
   * ゲームループ
   */
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;
    
    frameCountRef.current++;
    
    // 恐竜の物理演算
    setDino(prev => {
      const newY = prev.y + prev.velocityY;
      const newVelocityY = prev.velocityY + GAME_SETTINGS.GRAVITY;
      
      // 地面に着地
      if (newY >= GAME_SETTINGS.GROUND_Y) {
        return {
          ...prev,
          y: GAME_SETTINGS.GROUND_Y,
          velocityY: 0,
          isJumping: false
        };
      }
      
      return {
        ...prev,
        y: newY,
        velocityY: newVelocityY
      };
    });
    
    // 障害物の移動と生成
    setObstacles(prev => {
      let newObstacles = prev.map(obstacle => ({
        ...obstacle,
        x: obstacle.x - GAME_SETTINGS.GAME_SPEED
      })).filter(obstacle => obstacle.x > -GAME_SETTINGS.OBSTACLE_WIDTH);
      
      // 新しい障害物を生成
      if (Math.random() < GAME_SETTINGS.SPAWN_RATE && frameCountRef.current % 120 === 0) {
        const obstacleType = Math.random() < 0.7 ? 'cactus' : 'bird';
        const obstacleY = obstacleType === 'cactus' 
          ? GAME_SETTINGS.GROUND_Y - GAME_SETTINGS.OBSTACLE_HEIGHT
          : GAME_SETTINGS.GROUND_Y - GAME_SETTINGS.OBSTACLE_HEIGHT - 20;
        
        newObstacles.push({
          id: obstacleIdRef.current++,
          x: 800,
          y: obstacleY,
          width: GAME_SETTINGS.OBSTACLE_WIDTH,
          height: GAME_SETTINGS.OBSTACLE_HEIGHT,
          type: obstacleType
        });
      }
      
      return newObstacles;
    });
    
    // 雲の移動
    setClouds(prev => prev.map(cloud => ({
      ...cloud,
      x: cloud.x - GAME_SETTINGS.CLOUD_SPEED
    })).filter(cloud => cloud.x > -100).concat(
      // 新しい雲を生成
      Math.random() < 0.002 ? [{
        id: cloudIdRef.current++,
        x: 800,
        y: 30 + Math.random() * 80
      }] : []
    ));
    
    // スコア更新
    setScore(prev => prev + 1);
    
    // 衝突検出
    setObstacles(currentObstacles => {
      for (const obstacle of currentObstacles) {
        if (checkCollision(dino, obstacle)) {
          gameOver();
          return currentObstacles;
        }
      }
      return currentObstacles;
    });
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, dino, checkCollision, gameOver]);
  
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
    <div className="relative w-full h-full bg-gray-200 overflow-hidden">
      {/* 背景要素 */}
      <div className="absolute inset-0">
        {/* 雲 */}
        {clouds.map(cloud => (
          <div
            key={cloud.id}
            className="absolute text-white opacity-70"
            style={{ left: cloud.x, top: cloud.y }}
          >
            ☁️
          </div>
        ))}
        
        {/* 地面線 */}
        <div 
          className="absolute w-full h-0.5 bg-gray-600"
          style={{ top: GAME_SETTINGS.GROUND_Y + GAME_SETTINGS.DINO_HEIGHT }}
        />
      </div>
      
      {/* 恐竜 */}
      <motion.div
        className={`absolute flex items-center justify-center text-4xl select-none ${dino.isRunning ? 'animate-bounce' : ''}`}
        style={{
          left: dino.x,
          top: dino.y,
          width: GAME_SETTINGS.DINO_WIDTH,
          height: GAME_SETTINGS.DINO_HEIGHT
        }}
        animate={{
          rotateZ: dino.isJumping ? -15 : 0
        }}
      >
        🦕
      </motion.div>
      
      {/* 障害物 */}
      {obstacles.map(obstacle => (
        <div
          key={obstacle.id}
          className="absolute flex items-center justify-center text-2xl"
          style={{
            left: obstacle.x,
            top: obstacle.y,
            width: obstacle.width,
            height: obstacle.height
          }}
        >
          {obstacle.type === 'cactus' ? '🌵' : '🦅'}
        </div>
      ))}
      
      {/* UI情報 */}
      <div className="absolute top-4 right-4 text-right">
        <div className="text-2xl font-mono">{Math.floor(score)}</div>
        <div className="text-sm text-gray-600">HI: {highScore}</div>
      </div>
    </div>
  );
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-gray-100 w-full max-w-4xl h-96 relative rounded-lg overflow-hidden">
        {/* ゲーム画面 */}
        {gameState === 'playing' && renderGame()}
        
        {/* スタート画面 */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="text-center">
              <div className="text-6xl mb-4">🦕</div>
              <h2 className="text-2xl font-bold mb-4">ディノラン</h2>
              <p className="text-gray-600 mb-6">スペースキーでジャンプ！</p>
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
            className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">💥</div>
              <h2 className="text-2xl font-bold mb-2">ゲームオーバー</h2>
              <p className="text-xl mb-2">スコア: {Math.floor(score)}</p>
              {score > highScore && (
                <p className="text-green-600 font-bold mb-4">新記録！</p>
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

export default DinoRunGame;