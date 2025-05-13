/**
 * ゲームマネージャーコンポーネント
 * 
 * 開いているゲームを管理し、適切なゲームコンポーネントを表示する
 */

import React from 'react';
import { useGameStore } from '@/store/gameStore';
import DinoRunGame from './DinoRunGame';
import FlappyBirdGame from './FlappyBirdGame';

/**
 * ゲームマネージャーコンポーネント
 */
const GameManager = () => {
  const { isGameOpen, currentGame } = useGameStore();
  
  // ゲームが開かれていない場合は何も表示しない
  if (!isGameOpen || !currentGame) {
    return null;
  }
  
  // 現在のゲームによってコンポーネントを切り替え
  switch (currentGame) {
    case 'dinosaur':
      return <DinoRunGame />;
    case 'flappy':
      return <FlappyBirdGame />;
    default:
      return null;
  }
};

export default GameManager;