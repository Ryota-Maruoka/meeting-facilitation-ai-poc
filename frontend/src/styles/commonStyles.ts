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
    padding: 15px 0;
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

  /* ========================================
     会議画面共通スタイル
     ======================================== */

  /* 会議情報セクション */
  .meeting-info-section {
    padding: 16px 0;
    border-bottom: 1px solid #e6e8ee;
    background: #fafbfc;
  }

  .meeting-info {
    display: flex;
    gap: 24px;
    font-size: 14px;
    flex-wrap: wrap;
  }

  .meeting-info-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #374151;
  }

  /* アジェンダ進捗バー */
  .agenda-progress-section {
    padding: 20px 0;
    background: #fff;
    border-bottom: 1px solid #e6e8ee;
  }

  .agenda-progress-title {
    font-size: 14px;
    font-weight: 600;
    color: #424242;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .agenda-progress-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .agenda-progress-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .agenda-progress-label {
    font-size: 13px;
    color: #616161;
    min-width: 140px;
  }

  .agenda-progress-bar {
    flex: 1;
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
  }

  .agenda-progress-fill {
    height: 100%;
    background: #2196F3;
    transition: width 0.3s ease;
  }

  .agenda-progress-time {
    font-size: 12px;
    color: #757575;
    min-width: 60px;
    text-align: right;
  }

  /* 3カラムレイアウト */
  .three-column-layout {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    padding: 8px 0;
  }

  .column-section {
    background: #fff;
    border: 1px solid #e6e8ee;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    height: 500px;
  }

  .alert-parking-column {
    padding: 0;
  }

  .alert-section-inner,
  .parking-section-inner {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 16px;
    border-bottom: 1px solid #e6e8ee;
  }

  .parking-section-inner {
    border-bottom: none;
  }

  .section-header {
    font-weight: 600;
    font-size: 15px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #212121;
    padding-bottom: 12px;
    border-bottom: 1px solid #e0e0e0;
  }

  .section-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;
  }

  .section-content::-webkit-scrollbar {
    width: 6px;
  }

  .section-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  .section-content::-webkit-scrollbar-thumb {
    background: #bdbdbd;
    border-radius: 3px;
  }

  .section-content::-webkit-scrollbar-thumb:hover {
    background: #9e9e9e;
  }

  /* 文字起こし */
  .transcript-item {
    margin-bottom: 12px;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 6px;
    border-left: 3px solid #2196F3;
  }

  .transcript-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .speaker {
    font-weight: 600;
    font-size: 13px;
    color: #212121;
  }

  .timestamp {
    font-size: 11px;
    color: #757575;
  }

  .transcript-text {
    font-size: 13px;
    line-height: 1.5;
    color: #424242;
  }

  /* 要約 */
  .summary-text {
    font-size: 13px;
    line-height: 1.7;
    color: #424242;
  }

  /* アラート */
  .alert-item {
    background: #fff4e5;
    border: 1px solid #ffe69c;
    border-radius: 6px;
    padding: 10px;
    margin-bottom: 10px;
  }

  .alert-timestamp {
    font-size: 11px;
    color: #9a6700;
    margin-bottom: 4px;
  }

  .alert-message {
    font-size: 12px;
    color: #9a6700;
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .alert-actions {
    display: flex;
    gap: 6px;
  }

  .alert-btn {
    flex: 1;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid;
    text-align: center;
  }

  .alert-btn-ignore {
    background: #fff;
    color: #616161;
    border-color: #d9dbe3;
  }

  .alert-btn-ignore:hover {
    background: #f5f5f5;
  }

  .alert-btn-parking {
    background: #2196F3;
    color: #fff;
    border-color: #2196F3;
  }

  .alert-btn-parking:hover {
    background: #1976D2;
  }

  /* 保留事項 */
  .parking-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .parking-item {
    padding: 10px 12px;
    background: #fff3e0;
    border-radius: 6px;
    font-size: 13px;
    color: #e65100;
    border-left: 3px solid #ff9800;
  }

  .parking-item-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .parking-item-title {
    font-weight: 500;
    color: #333;
  }

  .parking-item-actions {
    display: flex;
    align-items: center;
  }

  .parking-item-checkbox {
    background: none;
    border: none;
    color: #666;
    font-size: 11px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 2px;
    transition: background-color 0.2s;
  }

  .parking-item-checkbox:hover {
    background: rgba(0,0,0,0.05);
  }

  .empty-state {
    text-align: center;
    color: #9e9e9e;
    font-size: 13px;
    padding: 40px 20px;
  }

  /* フッターアクション */
  .footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 8px 0;
    border-top: 1px solid #e6e8ee;
    background: #fafbfc;
  }

  /* レスポンシブ - 会議画面 */
  @media (max-width: 1024px) {
    .three-column-layout {
      grid-template-columns: 1fr;
    }
    .column-section {
      height: 300px;
    }
  }

  /* ========================================
     サマリー画面スタイル
     ======================================== */

  .details-section {
    padding: 24px 0;
    border-bottom: 1px solid #e6e8ee;
    background: #fafbfc;
  }

  .details-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #111;
  }

  .details-meta {
    display: flex;
    gap: 24px;
    font-size: 14px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .details-meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #374151;
  }

  .details-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .section {
    background: #fff;
    border: 1px solid #e6e8ee;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .section-title {
    font-weight: 700;
    font-size: 18px;
    margin-bottom: 16px;
    color: #111;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .key-points {
    list-style: none;
    padding: 0;
  }

  .key-point-item {
    padding: 8px 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .key-point-item:last-child {
    border-bottom: none;
  }

  .decision-item,
  .unresolved-item,
  .action-item {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 14px;
    margin-bottom: 12px;
  }

  .decision-item {
    border-left: 4px solid #146c43;
  }

  .unresolved-item {
    border-left: 4px solid #9a6700;
  }

  .action-item {
    border-left: 4px solid #667eea;
  }

  .item-title {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 6px;
    color: #111;
  }

  .item-meta {
    font-size: 12px;
    color: #6b7280;
    margin-top: 6px;
  }

  /* ========================================
     新規会議作成画面スタイル
     ======================================== */

  .form-section {
    margin-bottom: 24px;
  }

  .form-section.short {
    max-width: 400px;
  }

  .form-section.medium {
    max-width: 600px;
  }

  .participant-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }

  .participant-input-row {
    display: flex;
    gap: 12px;
    align-items: stretch;
  }

  .participant-input-row .input {
    flex: 1;
    min-width: 0;
  }

  .participant-input-row .btn {
    flex-shrink: 0;
    min-width: 100px;
    white-space: nowrap;
  }

  .agenda-item {
    border: 1px solid #e6e8ee;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    background: #fafbfc;
  }

  .agenda-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .agenda-title {
    font-weight: 600;
    font-size: 14px;
  }

  .agenda-row {
    display: grid;
    grid-template-columns: 2fr 140px;
    gap: 12px;
    margin-bottom: 12px;
  }

  .action-buttons {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding-top: 24px;
    border-top: 1px solid #e6e8ee;
  }

  .action-buttons-right {
    display: flex;
    gap: 12px;
  }

  @media (max-width: 768px) {
    .agenda-row {
      grid-template-columns: 1fr;
    }
    .action-buttons {
      flex-direction: column;
    }
    .action-buttons .btn {
      width: 100%;
    }
    .participant-input-row {
      flex-direction: column;
    }
    .participant-input-row .btn {
      width: 100%;
    }
  }

  /* ========================================
     議事録履歴一覧画面スタイル
     ======================================== */

  /* 会議履歴一覧画面専用のページレイアウト */
  .meeting-history-page {
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .meeting-history-page .page-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .meeting-history-page .meeting-header {
    flex-shrink: 0;
  }

  .meeting-history-page .body-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  /* データグリッドスタイル */
  .data-grid {
    width: 100%;
    border-collapse: collapse;
    background: #fff;
  }
  .data-grid thead {
    background: #FAFAFA;
    border-bottom: 2px solid #E0E0E0;
  }
  .data-grid th {
    color: #616161;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 12px;
    padding: 16px 12px;
    text-align: left;
    letter-spacing: 0.5px;
  }
  .data-grid tbody tr {
    border-bottom: 1px solid #EEEEEE;
    transition: background-color 0.2s ease;
  }
  .data-grid tbody tr:hover {
    background: #F5F5F5;
  }
  .data-grid td {
    padding: 16px 12px;
    color: #424242;
    font-size: 14px;
  }

  /* 検索セクションのスタイル */
  .search-section {
    padding: 10px 5px;
    border-bottom: 1px solid #E0E0E0;
    background: #FAFAFA;
    flex-shrink: 0;
  }
  .search-fields {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    align-items: flex-end;
  }
  .search-field {
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .search-field-label {
    font-size: 12px;
    font-weight: 500;
    color: #424242;
  }
  .search-field.with-icon {
    position: relative;
  }
  .search-field.with-icon input {
    padding-right: 40px;
  }
  .search-field .calendar-icon {
    position: absolute;
    right: 12px;
    bottom: 10px;
    cursor: pointer;
    color: #757575;
    transition: color 0.2s ease;
  }
  .search-field .calendar-icon:hover {
    color: #2196F3;
  }
  .search-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
  }
  .title-link {
    color: #2196F3;
    text-decoration: none;
    cursor: pointer;
    font-weight: 600;
    transition: color 0.2s ease;
  }
  .title-link:hover {
    color: #1976D2;
    text-decoration: underline;
  }
  .ops {
    display: flex;
    gap: 12px;
    color: #757575;
  }
  .ops .icon {
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
    font-size: 20px;
  }
  .ops .icon:hover {
    transform: scale(1.15);
    color: #424242;
  }
  .new-meeting-row {
    display: flex;
    justify-content: flex-end;
    padding: 8px 0;
    border-bottom: 1px solid #E0E0E0;
    flex-shrink: 0;
  }

  /* カレンダーポップアップ(範囲選択版) */
  .calendar-popup {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 8px;
    background: #fff;
    border: 1px solid #E0E0E0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 16px;
    z-index: 100;
    min-width: 320px;
  }
  .calendar-popup-header {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #424242;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .calendar-instruction {
    font-size: 12px;
    color: #757575;
    margin-bottom: 12px;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 4px;
  }
  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-top: 8px;
  }
  .calendar-day-header {
    text-align: center;
    font-size: 11px;
    color: #757575;
    font-weight: 600;
    padding: 8px 4px;
  }
  .calendar-day {
    text-align: center;
    padding: 8px 4px;
    font-size: 13px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }
  .calendar-day:hover {
    background: #e3f2fd;
  }
  .calendar-day.selected {
    background: #2196F3;
    color: #fff;
    font-weight: 600;
  }
  .calendar-day.in-range {
    background: #e3f2fd;
    color: #1565C0;
  }
  .calendar-day.empty {
    cursor: default;
    opacity: 0.3;
  }
  .calendar-day.empty:hover {
    background: transparent;
  }
  .calendar-selected-range {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 4px;
    font-size: 13px;
  }
  .calendar-selected-range span {
    color: #424242;
  }

  /* フッタースタイル */
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-top: 1px solid #E0E0E0;
    background: #FAFAFA;
    flex-wrap: wrap;
    gap: 12px;
    flex-shrink: 0;
  }
  .page-info {
    color: #757575;
    font-size: 13px;
  }
  .pager {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .page-link {
    border: 1px solid #E0E0E0;
    padding: 6px 10px;
    border-radius: 4px;
    cursor: pointer;
    background: #fff;
    transition: all 0.2s ease;
    min-width: 36px;
    text-align: center;
    font-size: 14px;
  }
  .page-link:hover:not(:disabled) {
    background: #F5F5F5;
    border-color: #2196F3;
  }
  .page-link.active {
    background: #2196F3;
    color: #fff;
    border-color: #2196F3;
  }
  .page-link:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
  .page-size {
    border: 1px solid #E0E0E0;
    border-radius: 4px;
    padding: 6px 10px;
    background: #fff;
    font-size: 13px;
  }

  /* レスポンシブ - 一覧画面 */
  @media (max-width: 768px) {
    .search-fields {
      flex-direction: column;
    }
    .footer {
      flex-direction: column;
    }
  }

  /* ========================================
     サマリー画面追加スタイル
     ======================================== */

  .body-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .details-section {
    padding: 5px;
    margin-bottom: 5px;
  }

  .three-column-layout {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 5px;
    margin-bottom: 5px;
  }

  .column-section {
    background: white;
    border: 1px solid #e6e8ee;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    height: 550px;
  }

  .column-content {
    flex: 1;
    overflow-y: auto;
    margin-top: 16px;
  }

  .loading-box {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #6b7280;
  }

  .spinner {
    border: 3px solid #f3f4f6;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    animation: spin 1s linear infinite;
    margin-right: 12px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .footer-actions {
    display: flex;
    justify-content: space-between;
    padding-top: 5px;
    border-top: 1px solid #e6e8ee;
    flex-wrap: wrap;
    gap: 12px;
  }

  /* ========================================
     会議履歴プレビューパネルスタイル
     ======================================== */

  .meeting-history-container {
    display: flex;
    gap: 16px;
    align-items: stretch;
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .preview-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 98;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .table-wrap {
    flex: 1;
    background: #fff;
    border-radius: 8px;
    overflow-y: auto;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: flex 0.3s ease;
    position: relative;
    z-index: 99;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .table-wrap.with-preview {
    flex: 0 0 calc(50% - 8px);
  }

  .table-wrap table {
    flex-shrink: 0;
  }

  .clickable-row {
    cursor: pointer;
  }

  .selected-row {
    /* 選択時の背景色を削除 */
  }

  .preview-panel {
    flex: 0 0 calc(50% - 8px);
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease;
    position: relative;
    z-index: 99;
    overflow: hidden;
    min-height: 0;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .preview-header {
    padding: 8px 24px;
    border-bottom: 2px solid #E0E0E0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    flex-shrink: 0;
  }

  .preview-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .preview-close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 3px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease;
    margin-left: 12px;
  }

  .preview-close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .preview-body {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
  }

  .preview-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #757575;
  }

  .preview-loading .spinner {
    margin-bottom: 16px;
  }

  .preview-error {
    text-align: center;
    color: #F44336;
    padding: 40px 20px;
  }

  .preview-meta {
    display: flex;
    gap: 20px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #EEEEEE;
  }

  .preview-meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #616161;
  }

  .preview-section {
    margin-bottom: 28px;
  }

  .preview-section:last-child {
    margin-bottom: 0;
  }

  .preview-section-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #212121;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .preview-count {
    font-size: 12px;
    font-weight: 400;
    color: #757575;
    margin-left: auto;
  }

  .preview-summary {
    font-size: 14px;
    line-height: 1.6;
    color: #424242;
    background: #F5F5F5;
    padding: 16px;
    border-radius: 6px;
    max-height: 100px;
    overflow-y: auto;
    white-space: pre-wrap;
  }

  .preview-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .preview-list li {
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .preview-list li:last-child {
    margin-bottom: 0;
  }

  .preview-decisions li {
    background: #E8F5E9;
    border-left: 4px solid #4CAF50;
    color: #1B5E20;
  }

  .preview-actions li {
    background: #E3F2FD;
    border-left: 4px solid #2196F3;
    color: #0D47A1;
  }

  .preview-empty {
    font-size: 13px;
    color: #9E9E9E;
    text-align: center;
    padding: 24px 12px;
    background: #FAFAFA;
    border-radius: 6px;
  }

  .action-title {
    font-weight: 500;
    margin-bottom: 6px;
  }

  .action-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #616161;
  }

  .action-owner,
  .action-due {
    display: inline-flex;
    align-items: center;
  }

  .preview-footer {
    border-top: 1px solid #E0E0E0;
    background: #FAFAFA;
    flex-shrink: 0;
  }

  .preview-footer .btn {
    width: 100%;
    justify-content: center;
  }

  /* レスポンシブ - プレビューパネル */
  @media (max-width: 1024px) {
    .meeting-history-container {
      flex-direction: column;
    }

    .table-wrap,
    .table-wrap.with-preview {
      flex: 1;
      width: 100%;
    }

    .preview-panel {
      flex: 1;
      width: 100%;
      max-height: 600px;
    }
  }

  @media (max-width: 768px) {
    .preview-panel {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      max-height: 100vh;
      border-radius: 0;
      z-index: 1000;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }
  }
`;
