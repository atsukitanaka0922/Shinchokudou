/**
 * ログインボーナス重複実行防止のためのシングルトン
 * 
 * アプリ全体でログインボーナスが1日1回だけ実行されることを保証
 */

class LoginBonusManager {
  private static instance: LoginBonusManager;
  private processedUsers: Set<string> = new Set();
  private processingUsers: Set<string> = new Set();
  private dailyReset: string = '';

  private constructor() {
    this.resetDailyFlags();
  }

  public static getInstance(): LoginBonusManager {
    if (!LoginBonusManager.instance) {
      LoginBonusManager.instance = new LoginBonusManager();
    }
    return LoginBonusManager.instance;
  }

  /**
   * 日付が変わった場合にフラグをリセット
   */
  private resetDailyFlags(): void {
    const today = new Date().toISOString().split('T')[0];
    if (this.dailyReset !== today) {
      console.log('新しい日になりました。ログインボーナスフラグをリセット:', today);
      this.processedUsers.clear();
      this.processingUsers.clear();
      this.dailyReset = today;
    }
  }

  /**
   * ユーザーが今日既にログインボーナスを受け取ったかチェック
   */
  public hasProcessedToday(userId: string): boolean {
    this.resetDailyFlags();
    return this.processedUsers.has(userId);
  }

  /**
   * ユーザーが現在ログインボーナス処理中かチェック
   */
  public isProcessing(userId: string): boolean {
    this.resetDailyFlags();
    return this.processingUsers.has(userId);
  }

  /**
   * ログインボーナス処理開始をマーク
   */
  public startProcessing(userId: string): boolean {
    this.resetDailyFlags();
    
    if (this.processedUsers.has(userId)) {
      console.log(`ユーザー ${userId} は今日既にログインボーナスを受け取っています`);
      return false;
    }
    
    if (this.processingUsers.has(userId)) {
      console.log(`ユーザー ${userId} のログインボーナス処理が既に実行中です`);
      return false;
    }
    
    this.processingUsers.add(userId);
    console.log(`ユーザー ${userId} のログインボーナス処理を開始`);
    return true;
  }

  /**
   * ログインボーナス処理完了をマーク
   */
  public completeProcessing(userId: string, success: boolean): void {
    this.processingUsers.delete(userId);
    
    if (success) {
      this.processedUsers.add(userId);
      console.log(`ユーザー ${userId} のログインボーナス処理が完了しました`);
    } else {
      console.log(`ユーザー ${userId} のログインボーナス処理が失敗しました`);
    }
  }

  /**
   * 強制的にユーザーの処理状態をリセット（デバッグ用）
   */
  public resetUser(userId: string): void {
    this.processedUsers.delete(userId);
    this.processingUsers.delete(userId);
    console.log(`ユーザー ${userId} のログインボーナス状態をリセットしました`);
  }

  /**
   * デバッグ情報を表示
   */
  public getDebugInfo(): object {
    return {
      dailyReset: this.dailyReset,
      processedUsers: Array.from(this.processedUsers),
      processingUsers: Array.from(this.processingUsers)
    };
  }
}

export const loginBonusManager = LoginBonusManager.getInstance();