/**
 * 共通スタイル定義
 *
 * アプリケーション全体で使用する共通のスタイルを定義
 * Material Design風のデザインシステムを採用
 */

export const commonStyles = `
  /* リセット・ベーススタイル */
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ページ全体のスタイル */
  .page {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
    background: #f5f5f5;
    padding: 0;
    color: #212121;
    min-height: 100vh;
  }

  /* ページコンテナ */
  .page-container {
    margin: 0;
    padding: 0;
  }

  /* ヘッダースタイル（共通） */
  .meeting-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 0;
  }

  .meeting-title {
    font-size: 20px;
    font-weight: 700;
    padding: 0 15%;
  }

  /* ボディコンテンツ（ヘッダー以外すべて） */
  .body-content {
    padding: 0 15%;
  }

  /* コンテナ */
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  /* カードコンポーネント */
  .card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  .card-header {
    padding: 16px 24px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
  }

  .card-body {
    padding: 24px;
  }

  .card-footer {
    padding: 16px 24px;
    border-top: 1px solid #e0e0e0;
    background: #fafafa;
  }

  /* タイトル */
  .title {
    font-weight: 600;
    font-size: 20px;
    color: #212121;
  }

  .title-large {
    font-weight: 600;
    font-size: 24px;
    color: #212121;
  }

  /* ボタン */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: none;
    background: #fff;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.2s ease;
    text-decoration: none;
    color: #616161;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    line-height: 1.5;
    min-height: 36px;
  }

  .btn:hover:not(:disabled) {
    background: #f5f5f5;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  }

  .btn:active:not(:disabled) {
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #2196F3;
    color: #fff;
  }

  .btn-primary:hover:not(:disabled) {
    background: #1976D2;
  }

  .btn-success {
    background: #4CAF50;
    color: #fff;
  }

  .btn-success:hover:not(:disabled) {
    background: #388E3C;
  }

  .btn-danger {
    background: #F44336;
    color: #fff;
  }

  .btn-danger:hover:not(:disabled) {
    background: #D32F2F;
  }

  .btn-warning {
    background: #FF9800;
    color: #fff;
  }

  .btn-warning:hover:not(:disabled) {
    background: #F57C00;
  }

  .btn-large {
    padding: 10px 24px;
    font-size: 15px;
    min-height: 42px;
  }

  .btn-icon {
    font-size: 18px;
    line-height: 1;
  }

  /* フォーム要素 */
  .form-group {
    margin-bottom: 16px;
  }

  .form-label {
    display: block;
    font-weight: 500;
    font-size: 14px;
    margin-bottom: 8px;
    color: #424242;
  }

  .form-label-required::after {
    content: " *";
    color: #F44336;
  }

  .input,
  .textarea,
  .select {
    width: 100%;
    border: 1px solid #BDBDBD;
    border-radius: 4px;
    padding: 10px 12px;
    background: #fff;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.2s ease;
    line-height: 1.5;
  }

  .input:focus,
  .textarea:focus,
  .select:focus {
    outline: none;
    border-color: #2196F3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }

  .input:disabled,
  .textarea:disabled,
  .select:disabled {
    background: #F5F5F5;
    cursor: not-allowed;
    color: #9E9E9E;
  }

  .textarea {
    min-height: 100px;
    resize: vertical;
  }

  .input-error {
    border-color: #F44336;
  }

  .input-error:focus {
    border-color: #F44336;
    box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
  }

  .error-message {
    color: #F44336;
    font-size: 12px;
    margin-top: 4px;
  }

  /* バッジ */
  .badge {
    font-size: 12px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 12px;
    display: inline-block;
    white-space: nowrap;
    line-height: 1.3;
  }

  .badge-success {
    background: #E8F5E9;
    color: #2E7D32;
  }

  .badge-warning {
    background: #FFF3E0;
    color: #E65100;
  }

  .badge-danger {
    background: #FFEBEE;
    color: #C62828;
  }

  .badge-info {
    background: #E3F2FD;
    color: #1565C0;
  }

  .badge-default {
    background: #F5F5F5;
    color: #616161;
  }

  /* タグ */
  .tag {
    font-size: 12px;
    background: #E3F2FD;
    color: #1565C0;
    padding: 4px 10px;
    border-radius: 12px;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    line-height: 1.3;
  }

  .tag-removable {
    cursor: pointer;
    padding-right: 6px;
  }

  .tag-close {
    font-size: 16px;
    line-height: 1;
    opacity: 0.7;
    transition: opacity 0.2s ease;
    cursor: pointer;
  }

  .tag-close:hover {
    opacity: 1;
  }

  /* テーブル */
  .table-wrap {
    overflow-x: auto;
    border-radius: 4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: #fff;
  }

  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #E0E0E0;
  }

  th {
    color: #616161;
    font-weight: 600;
    font-size: 13px;
    background: #FAFAFA;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  td {
    font-size: 14px;
    color: #212121;
  }

  tbody tr {
    transition: background 0.15s ease;
  }

  tbody tr:hover {
    background: #F5F5F5;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  /* ユーティリティクラス */
  .flex {
    display: flex;
  }

  .flex-col {
    display: flex;
    flex-direction: column;
  }

  .flex-wrap {
    flex-wrap: wrap;
  }

  .items-center {
    align-items: center;
  }

  .justify-center {
    justify-content: center;
  }

  .justify-between {
    justify-content: space-between;
  }

  .gap-2 {
    gap: 8px;
  }

  .gap-3 {
    gap: 12px;
  }

  .gap-4 {
    gap: 16px;
  }

  .mb-2 {
    margin-bottom: 8px;
  }

  .mb-3 {
    margin-bottom: 12px;
  }

  .mb-4 {
    margin-bottom: 16px;
  }

  .mt-2 {
    margin-top: 8px;
  }

  .mt-3 {
    margin-top: 12px;
  }

  .mt-4 {
    margin-top: 16px;
  }

  .text-center {
    text-align: center;
  }

  .text-secondary {
    color: #757575;
  }

  .text-danger {
    color: #F44336;
  }

  .text-success {
    color: #4CAF50;
  }

  /* レスポンシブ */
  @media (max-width: 768px) {
    .page {
      padding: 0;
    }

    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .btn-group {
      width: 100%;
      flex-direction: column;
    }

    .btn-group .btn {
      width: 100%;
    }
  }

  /* ローディング */
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: #757575;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #E0E0E0;
    border-top-color: #2196F3;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* アラート */
  .alert {
    padding: 12px 16px;
    border-radius: 4px;
    margin-bottom: 16px;
    font-size: 14px;
    border-left: 4px solid;
  }

  .alert-success {
    background: #E8F5E9;
    color: #2E7D32;
    border-left-color: #4CAF50;
  }

  .alert-error {
    background: #FFEBEE;
    color: #C62828;
    border-left-color: #F44336;
  }

  .alert-warning {
    background: #FFF3E0;
    color: #E65100;
    border-left-color: #FF9800;
  }

  .alert-info {
    background: #E3F2FD;
    color: #1565C0;
    border-left-color: #2196F3;
  }

  /* リンク */
  .link {
    color: #2196F3;
    text-decoration: none;
    cursor: pointer;
    transition: color 0.2s ease;
    font-weight: 500;
  }

  .link:hover {
    color: #1976D2;
    text-decoration: underline;
  }

  /* モーダル（共通） */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    max-width: 400px;
    width: 90%;
    padding: 24px;
  }

  .modal-header {
    font-size: 18px;
    font-weight: 600;
    color: #212121;
    margin-bottom: 16px;
  }

  .modal-body {
    color: #616161;
    margin-bottom: 24px;
    line-height: 1.5;
  }

  .modal-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  /* ドロップダウン */
  .dropdown {
    position: relative;
    display: inline-block;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background: #fff;
    border: 1px solid #E0E0E0;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    min-width: 160px;
    z-index: 1000;
  }

  .dropdown-item {
    display: block;
    width: 100%;
    padding: 10px 16px;
    text-align: left;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    color: #212121;
    transition: background 0.15s ease;
  }

  .dropdown-item:hover {
    background: #F5F5F5;
  }

  .dropdown-divider {
    height: 1px;
    background: #E0E0E0;
    margin: 4px 0;
  }

  /* Material Icons用のフォント設定 */
  .material-icons {
    font-family: 'Material Icons';
    font-weight: normal;
    font-style: normal;
    font-size: 24px;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    vertical-align: middle;
  }

  /* アイコンサイズバリエーション */
  .icon-sm {
    font-size: 18px;
  }

  .icon-md {
    font-size: 24px;
  }

  .icon-lg {
    font-size: 32px;
  }
`;
