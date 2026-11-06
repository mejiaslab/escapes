/**
 * Cinematic intro video controller shown after interactive Google OAuth login.
 */

import { INTRO_SESSION_KEY } from "../config.js";

/**
 * Plays the full-screen intro video with audio fallback and skip controls,
 * then reveals the main application shell.
 * @returns {Promise<void>}
 */
export function playIntroSequence() {
  const introScreen = document.getElementById("intro-screen");
  const introVideo = document.getElementById("intro-video");
  const skipButton = document.getElementById("intro-skip-btn");
  const soundButton = document.getElementById("intro-sound-btn");
  const soundIcon = document.getElementById("intro-sound-icon");
  const appShell = document.getElementById("app-shell");

  if (!introScreen || !introVideo) {
    if (appShell) appShell.hidden = false;
    return Promise.resolve();
  }

  introScreen.hidden = false;
  introVideo.pause();

  try {
    introVideo.currentTime = 0;
  } catch (_) {
    // Ignore reset errors before metadata is loaded
  }

  return new Promise((resolve) => {
    let finished = false;

    function updateSoundButtonUi() {
      if (!soundButton || !soundIcon) return;
      soundIcon.textContent = introVideo.muted ? "🔇" : "🔊";
      const label = introVideo.muted ? "Activar sonido" : "Silenciar";
      soundButton.title = label;
      soundButton.setAttribute("aria-label", label);
    }

    function finishIntro(immediate = false) {
      if (finished) return;
      finished = true;

      clearTimeout(safetyTimer);
      document.removeEventListener("keydown", handleKeydown);

      introVideo.onplaying = null;
      introVideo.onended = null;
      introVideo.onerror = null;

      if (skipButton) {
        skipButton.onclick = null;
        skipButton.disabled = true;
      }
      if (soundButton) {
        soundButton.onclick = null;
        soundButton.hidden = true;
      }

      introVideo.pause();

      const delayMs = immediate ? 0 : 300;
      if (!immediate) {
        introScreen.classList.add("intro-screen-ending");
      }

      setTimeout(() => {
        introScreen.hidden = true;
        introScreen.classList.remove("intro-screen-ending");
        if (skipButton) skipButton.disabled = false;
        if (appShell) appShell.hidden = false;
        try {
          sessionStorage.setItem(INTRO_SESSION_KEY, "true");
        } catch (_) {
          // Ignore storage quota or privacy mode errors
        }
        resolve();
      }, delayMs);
    }

    function handleKeydown(event) {
      if (event.key === "Escape" || event.code === "Space") {
        event.preventDefault();
        finishIntro(true);
      }
    }

    // Safety timeout (8s video + 4s network buffer)
    const safetyTimer = setTimeout(() => finishIntro(true), 12000);

    introVideo.onplaying = () => {
      clearTimeout(safetyTimer);
    };

    introVideo.onended = () => finishIntro(false);
    introVideo.onerror = () => finishIntro(true);

    if (skipButton) {
      skipButton.onclick = () => finishIntro(false);
    }

    document.addEventListener("keydown", handleKeydown);

    if (soundButton) {
      soundButton.onclick = () => {
        introVideo.muted = !introVideo.muted;
        updateSoundButtonUi();
      };
    }

    // Attempt playback with sound; fall back to muted autoplay if blocked by browser policy
    introVideo.muted = false;
    const playPromise = introVideo.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          clearTimeout(safetyTimer);
        })
        .catch(() => {
          introVideo.muted = true;
          if (soundButton) {
            soundButton.hidden = false;
            updateSoundButtonUi();
          }
          introVideo.play().catch(() => finishIntro(true));
        });
    }
  });
}

/**
 * Clears the intro playback session marker upon logout.
 */
export function clearIntroSessionFlag() {
  try {
    sessionStorage.removeItem(INTRO_SESSION_KEY);
  } catch (_) {
    // Ignore storage errors
  }
}
