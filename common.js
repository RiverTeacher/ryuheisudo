document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const currentPage = location.pathname.split('/').pop() || 'index.html';

  // =========================================
  // ホームボタン（トップページでは表示しない）
  // =========================================

  function setupHomeButton() {

    // -------------------------------------
    // HTML生成
    // -------------------------------------

    const button = document.createElement('div');

    button.className = 'common-home-button';

    button.innerHTML = `
      <div class="common-home-label">
        <span class="common-home-arrow">←</span>
        <span>トップへ</span>
      </div>
      <div class="common-home-progress"></div>
    `;

    document.body.appendChild(button);


    // -------------------------------------
    // CSS生成
    // -------------------------------------

    const style = document.createElement('style');

    style.textContent = `
      .common-home-button {
        position: fixed;
        top: 18px;
        left: 18px;
        z-index: 99999;

        min-width: 110px;
        padding: 9px 14px 8px;

        color: rgba(70, 95, 110, 0.85);
        background: rgba(255, 255, 255, 0.55);

        border: 1px solid rgba(150, 200, 220, 0.35);
        border-radius: 12px;

        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);

        box-shadow:
          0 4px 16px rgba(100, 170, 200, 0.10);

        font-family: 'Noto Sans JP', sans-serif;
        font-size: 13px;
        font-weight: 300;

        user-select: none;
        -webkit-user-select: none;

        cursor: pointer;

        overflow: hidden;

        transition:
          transform 0.2s ease,
          background 0.2s ease,
          box-shadow 0.2s ease;
      }

      .common-home-button:hover {
        background: rgba(255, 255, 255, 0.75);
        box-shadow:
          0 5px 20px rgba(100, 170, 200, 0.15);
      }

      .common-home-button:active {
        transform: scale(0.97);
      }

      .common-home-label {
        position: relative;
        z-index: 2;

        display: flex;
        align-items: center;
        justify-content: center;

        gap: 6px;

        white-space: nowrap;
      }

      .common-home-arrow {
        font-size: 16px;
        line-height: 1;
      }

      .common-home-progress {
        position: absolute;

        left: 0;
        bottom: 0;

        width: 0%;
        height: 3px;

        background: linear-gradient(
          90deg,
          rgba(100, 190, 225, 0.45),
          rgba(80, 170, 220, 0.9)
        );

        transition: width 0.05s linear;

        pointer-events: none;
      }

      .common-home-button.holding {
        background: rgba(240, 250, 255, 0.8);
      }

      @media (max-width: 480px) {
        .common-home-button {
          top: 12px;
          left: 12px;

          min-width: 100px;
          padding: 8px 12px 7px;

          font-size: 12px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .common-home-button {
          transition: none;
        }
      }
    `;

    document.head.appendChild(style);


    // -------------------------------------
    // 長押し処理
    // -------------------------------------

    const HOLD_TIME = 500;

    let holding = false;
    let startTime = 0;
    let animationFrame = null;


    function startHold(event) {
      // マウスの場合は左クリックのみ
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      event.preventDefault();

      holding = true;
      startTime = performance.now();

      button.classList.add('holding');

      // 他の場所にフォーカスが移らないようにする
      if (button.setPointerCapture) {
        try {
          button.setPointerCapture(event.pointerId);
        } catch (_) {}
      }

      updateProgress();
    }


    function updateProgress() {
      if (!holding) {
        return;
      }

      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / HOLD_TIME, 1);

      const progressBar =
        button.querySelector('.common-home-progress');

      progressBar.style.width = `${progress * 100}%`;

      if (progress >= 1) {
        holding = false;

        // 少しだけ完成状態を見せてから移動
        setTimeout(() => {
          location.href = 'index.html';
        }, 80);

        return;
      }

      animationFrame = requestAnimationFrame(updateProgress);
    }


    function cancelHold() {
      if (!holding) {
        return;
      }

      holding = false;

      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }

      button.classList.remove('holding');

      const progressBar =
        button.querySelector('.common-home-progress');

      progressBar.style.width = '0%';
    }


    // -------------------------------------
    // Pointer Events
    // -------------------------------------

    button.addEventListener('pointerdown', startHold);

    button.addEventListener('pointerup', cancelHold);
    button.addEventListener('pointercancel', cancelHold);
    button.addEventListener('pointerleave', cancelHold);

    // スマホでスクロール等によってキャンセルされた場合
    button.addEventListener('lostpointercapture', cancelHold);
  }

  if (currentPage !== 'index.html') {
    setupHomeButton();
  }


  // =========================================
  // サーバー死活監視（10秒ごとにping）
  // =========================================

  // ローカルファイル(file://)では通信できないので監視しない
  if (location.protocol !== 'http:' && location.protocol !== 'https:') {
    return;
  }

  const PING_INTERVAL = 10000;   // 10秒ごと
  const PING_TIMEOUT = 8000;     // 8秒で応答がなければ失敗扱い
  const FALLBACK_URL = 'https://www.ryuheisudo.2bd.net/';
  const REDIRECT_DELAY = 3000;   // メッセージ表示後、3秒で移動

  let disconnected = false;
  let pinging = false;


  function showDisconnectedMessage() {
    const style = document.createElement('style');

    style.textContent = `
      .server-disconnected-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 100000;

        display: flex;
        align-items: center;
        justify-content: center;

        background: rgba(30, 40, 50, 0.85);

        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
      }

      .server-disconnected-message {
        padding: 22px 28px;
        margin: 0 16px;

        color: rgba(70, 95, 110, 0.95);
        background: rgba(255, 255, 255, 0.92);

        border: 1px solid rgba(150, 200, 220, 0.5);
        border-radius: 14px;

        font-family: 'Noto Sans JP', sans-serif;
        font-size: 15px;
        font-weight: 400;
        text-align: center;
      }
    `;

    document.head.appendChild(style);

    const overlay = document.createElement('div');

    overlay.className = 'server-disconnected-overlay';

    overlay.innerHTML = `
      <div class="server-disconnected-message">
        サーバーとの通信が切断されました
      </div>
    `;

    document.body.appendChild(overlay);
  }


  function handleDisconnected() {
    if (disconnected) {
      return;
    }

    disconnected = true;

    clearInterval(pingTimer);

    showDisconnectedMessage();

    setTimeout(() => {
      location.href = FALLBACK_URL;
    }, REDIRECT_DELAY);
  }


  async function pingServer() {
    // 前回のpingが終わっていない場合は重ねて送らない
    if (disconnected || pinging) {
      return;
    }

    pinging = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);

    try {
      // 今いるURL（ハッシュを除く）に、キャッシュを使わずリクエスト
      const url = location.href.split('#')[0];

      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });

      if (response.status !== 200) {
        handleDisconnected();
      }
    } catch (_) {
      // 通信エラー・タイムアウト
      handleDisconnected();
    } finally {
      clearTimeout(timeoutId);
      pinging = false;
    }
  }


  const pingTimer = setInterval(pingServer, PING_INTERVAL);

})();
