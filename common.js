document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // トップページでは表示しない
  const currentPage = location.pathname.split('/').pop() || 'index.html';

  if (currentPage === 'index.html') {
    return;
  }

  // =========================================
  // HTML生成
  // =========================================

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


  // =========================================
  // CSS生成
  // =========================================

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


  // =========================================
  // 長押し処理
  // =========================================

  const HOLD_TIME = 1000;

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


  // =========================================
  // Pointer Events
  // =========================================

  button.addEventListener('pointerdown', startHold);

  button.addEventListener('pointerup', cancelHold);
  button.addEventListener('pointercancel', cancelHold);
  button.addEventListener('pointerleave', cancelHold);

  // スマホでスクロール等によってキャンセルされた場合
  button.addEventListener('lostpointercapture', cancelHold);

})();
