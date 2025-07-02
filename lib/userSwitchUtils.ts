/**
 * ユーザー切り替えユーティリティ
 * 
 * ユーザーがログアウト・ログイン時にストアのデータをクリアする機能
 * v1.7.0: 効果音システム追加、アカウント切り替え時のデータ分離を実現
 */

/**
 * 全ストアのユーザーデータをクリアする
 * @param userId クリアするユーザーID（nullの場合は全てクリア）
 */
export const clearAllUserData = async (userId: string | null = null) => {
  try {
    // 🔥 動的インポートで各ストアをクリア（循環参照を避ける）
    
    // タスクストアのクリア
    const { useEnhancedTaskStore } = await import('@/store/enhancedTaskStore');
    const taskStore = useEnhancedTaskStore.getState();
    taskStore.clearTasks();
    
    // ポイントストアは自動的にユーザー変更を検出するため、手動クリア不要
    
    // ゲームセンターストアのクリア
    const { useGameCenterStore } = await import('@/store/gameCenterStore');
    const gameStore = useGameCenterStore.getState();
    // ゲームストアには明示的なクリア機能がないため、新しいユーザーの場合は自動的に空になる
    
    // ショップストアのクリア
    const { useShopStore } = await import('@/store/shopStore');
    const shopStore = useShopStore.getState();
    // ショップストアも自動的にユーザー変更を検出するため、手動クリア不要
    
    // テーマストアは既にユーザー切り替え処理が実装済み
    
  } catch (error) {
    console.error('❌ ストアクリア処理中にエラーが発生:', error);
  }
};

/**
 * 新しいユーザーのデータを初期化する
 * @param userId 初期化するユーザーID
 */
export const initializeNewUserData = async (userId: string) => {
  console.log('新しいユーザーのデータ初期化開始:', userId);
  
  try {
    // テーマストアの新ユーザー初期化は既に switchUser で処理済み
    console.log('✅ テーマの初期化完了');
    
    // 他のストアも必要に応じて初期化処理を追加
    // （現在は各ストアが自動的にユーザー変更を検出するため不要）
    
    console.log('✅ 新ユーザーの初期化が完了しました');
    
  } catch (error) {
    console.error('❌ 新ユーザー初期化中にエラーが発生:', error);
  }
};

/**
 * ユーザー切り替え時の完全な処理
 * @param oldUserId 前のユーザーID
 * @param newUserId 新しいユーザーID
 */
export const handleUserSwitch = async (oldUserId: string | null, newUserId: string | null) => {
  console.log('ユーザー切り替え処理開始:', { old: oldUserId, new: newUserId });
  
  // 1. 前のユーザーのデータをクリア
  if (oldUserId) {
    await clearAllUserData(oldUserId);
  }
  
  // 2. 新しいユーザーのデータを初期化
  if (newUserId) {
    await initializeNewUserData(newUserId);
  } else {
    // ログアウト時は全てをクリア
    await clearAllUserData(null);
  }
  
  console.log('✅ ユーザー切り替え処理が完了しました');
};