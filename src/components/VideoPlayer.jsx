import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ChevronRight,
  SkipForward,
  Volume,
  Volume1,
  RotateCw,
  RotateCcw,
  Gauge,
  ListVideo,
  X,
  PictureInPicture,
  SlidersHorizontal,
  Sun,
  ArrowLeft,
  ChevronLeft,
} from "lucide-react";
import { formatTime } from "../utils/data";
import { useNavigate } from "react-router-dom";
import Tooltip from "./Tooltip";
import LazyImage from "./LazyImage";
import { useWatching } from "../context/WatchingContext";
import Episodes from "./Episodes";
import { UserAuth } from "../context/AuthContext";

const VideoPlayer = ({
  episode,
  svr,
  movie,
  resumeData = null,
  autoEpisodes = true,
  onVideoEnd,
  onNavigateToNextEpisode,
  shouldAutoPlay = false,
}) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const inactivityTimer = useRef(null);
  const controlsTimerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const lastTapTime = useRef(0);
  const lastTapX = useRef(0);
  const lastTapY = useRef(0);
  const singleTapTimer = useRef(null);
  const navigate = useNavigate();
  const { toggleWatching, updateWatchingProgress, isInWatching } =
    useWatching();
  const { user } = UserAuth();

  // State
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPos, setHoverPos] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [centerOverlay, setCenterOverlay] = useState(null);
  const [seekForwardAmount, setSeekForwardAmount] = useState(0);
  const [seekBackwardAmount, setSeekBackwardAmount] = useState(0);
  const [isSeekAnimating, setIsSeekAnimating] = useState(false);
  const [seekAnimationKey, setSeekAnimationKey] = useState(0);
  const seekTimeoutRef = useRef(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [currentQuality, setCurrentQuality] = useState("auto");
  const [qualities, setQualities] = useState([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [showSwipeControl, setShowSwipeControl] = useState(null);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [swipeValue, setSwipeValue] = useState(0);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [previewTime, setPreviewTime] = useState(null);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [isHoveringControls, setIsHoveringControls] = useState(false);
  const isHoveringControlsRef = useRef(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenuState, setShowQualityMenuState] = useState(false);
  const wakeLockRef = useRef(null);

  // Screen Wake Lock - Giữ màn hình luôn sáng khi xem video
  const requestWakeLock = async () => {
    try {
      // Check if Wake Lock API is supported
      if ("wakeLock" in navigator) {
        // Request a screen wake lock
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        console.log("Wake Lock activated - màn hình sẽ luôn sáng");

        // Listen for wake lock release
        wakeLockRef.current.addEventListener("release", () => {
          console.log("Wake Lock released");
        });
      } else {
        console.log("Wake Lock API not supported on this device");
      }
    } catch (err) {
      console.error("Wake Lock request failed:", err);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current !== null) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log("Wake Lock released manually");
      } catch (err) {
        console.error("Wake Lock release failed:", err);
      }
    }
  };

  // Manage Wake Lock based on video playing state and fullscreen
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Request wake lock khi video đang play VÀ (ở fullscreen HOẶC trên mobile)
    if (playing && (fullscreen || isMobile)) {
      requestWakeLock();
    } else {
      // Release wake lock khi video pause hoặc thoát fullscreen (trên desktop)
      releaseWakeLock();
    }

    // Cleanup khi component unmount
    return () => {
      releaseWakeLock();
    };
  }, [playing, fullscreen, isMobile]);

  // Re-request wake lock khi tab/page trở lại visible (mobile thường release wake lock khi tab không active)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (
        document.visibilityState === "visible" &&
        wakeLockRef.current === null &&
        playing &&
        (fullscreen || isMobile)
      ) {
        console.log("Tab visible again, re-requesting wake lock");
        await requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [playing, fullscreen, isMobile]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      // Chỉ dựa vào width để dễ test trên DevTools
      const isMobileDetected = width < 1024;
      setIsMobile(isMobileDetected);
      console.log("Mobile detection:", { width, isMobile: isMobileDetected });
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto fullscreen trên mobile khi user click play
  const handleAutoFullscreen = async () => {
    // Check mobile based on current window width (avoid closure issue)
    const isMobileNow = window.innerWidth < 1024;
    console.log(
      "handleAutoFullscreen called, isMobile:",
      isMobileNow,
      "width:",
      window.innerWidth
    );

    if (!isMobileNow) {
      console.log("Not mobile width, skipping auto fullscreen");
      return;
    }

    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) {
      console.log("No container/video ref, skipping auto fullscreen");
      return;
    }

    try {
      // Check if already in fullscreen
      const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      console.log("Current fullscreen state:", isFullscreen);

      if (!isFullscreen) {
        console.log("Requesting fullscreen...");

        // iOS Safari: Try video element fullscreen first (works better)
        if (
          video.webkitEnterFullscreen &&
          typeof video.webkitEnterFullscreen === "function"
        ) {
          try {
            video.webkitEnterFullscreen();
            console.log("iOS video fullscreen entered");
            setFullscreen(true);
            return;
          } catch (err) {
            console.log("iOS video fullscreen failed, trying container:", err);
          }
        }

        // Standard fullscreen API
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen();
        } else if (container.mozRequestFullScreen) {
          await container.mozRequestFullScreen();
        } else if (container.msRequestFullscreen) {
          await container.msRequestFullscreen();
        }

        console.log("Fullscreen requested successfully");
        setFullscreen(true);

        // Lock orientation sau khi fullscreen (iOS cần fullscreen trước)
        if (screen.orientation && screen.orientation.lock) {
          try {
            await screen.orientation.lock("landscape");
            console.log("Orientation locked to landscape");
          } catch (err) {
            console.log("Orientation lock failed:", err);
          }
        }
      }
    } catch (err) {
      console.log("Auto fullscreen failed:", err);
    }
  };

  // Check PiP support
  useEffect(() => {
    setPipSupported(document.pictureInPictureEnabled);
  }, []);

  // Auto fullscreen trên mobile khi có resumeData (user click "Xem tiếp")
  useEffect(() => {
    if (!isMobile || !videoReady || fullscreen) return;

    // Nếu có resumeData hoặc shouldAutoPlay → trigger auto fullscreen
    if (resumeData || shouldAutoPlay) {
      console.log("Triggering auto fullscreen from resumeData/shouldAutoPlay");

      const timer = setTimeout(async () => {
        try {
          await handleAutoFullscreen();
          console.log("Auto fullscreen completed");
        } catch (err) {
          console.log("Auto fullscreen failed:", err);
        }
      }, 300); // Delay nhỏ để đảm bảo video đã sẵn sàng

      return () => clearTimeout(timer);
    }
  }, [isMobile, videoReady, resumeData, shouldAutoPlay, fullscreen]);

  // Setup HLS
  useEffect(() => {
    const video = videoRef.current;

    // Cleanup HLS instance cũ trước khi tạo mới
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Reset states khi src thay đổi
    setVideoReady(false);
    setPlaying(false);
    setShowControls(false);
    setIsBuffering(false);
    setBuffered(0);
    setProgress(0);
    setDuration(0);
    // Reset hasPlayedOnce CHỈ nếu KHÔNG có shouldAutoPlay
    if (!shouldAutoPlay) {
      setHasPlayedOnce(false);
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        startLevel: -1, // auto
        enableWorker: true, // Sử dụng Web Worker để tăng performance
        lowLatencyMode: true, // Giảm độ trễ
      });

      hls.loadSource(movie?.episodes[svr]?.server_data[episode]?.link_m3u8);
      hls.attachMedia(video);
      hlsRef.current = hls;

      // Get available qualities
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels.map((level) => ({
          height: level.height,
          bitrate: level.bitrate,
          name: level.height ? `${level.height}p` : "Auto",
        }));
        setQualities([{ name: "Auto", height: 0 }, ...levels]);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level];
        setCurrentQuality(level.height ? `${level.height}p` : "auto");
      });

      // Video sẵn sàng
      hls.on(Hls.Events.MANIFEST_LOADED, () => {
        setVideoReady(true);

        // Auto-play nếu shouldAutoPlay (chuyển tập hoặc tiếp tục xem)
        if (shouldAutoPlay) {
          // Giảm timeout để giữ user gesture context
          setTimeout(async () => {
            if (video && hlsRef.current === hls) {
              // Auto fullscreen trước khi play trên mobile (PHẢI AWAIT!)
              console.log("HLS manifest loaded, triggering auto fullscreen");
              try {
                await handleAutoFullscreen();
                console.log("Fullscreen completed, now playing video");
              } catch (err) {
                console.log("Fullscreen on autoplay (HLS) failed:", err);
              }

              // Play video sau khi fullscreen
              await video.play().catch(console.error);
              setPlaying(true);
              setShowControls(true);
              setHasPlayedOnce(true);
            }
          }, 100); // Giảm từ 500ms → 100ms để giữ user gesture
        }
      });

      // Error handling
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Error:", data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = movie?.episodes[svr]?.server_data[episode]?.link_m3u8;

      const handleCanPlay = () => {
        setVideoReady(true);

        // Auto-play nếu shouldAutoPlay (chuyển tập hoặc tiếp tục xem)
        if (shouldAutoPlay) {
          // Giảm timeout để giữ user gesture context
          setTimeout(async () => {
            if (video) {
              // Auto fullscreen trước khi play trên mobile (Safari - PHẢI AWAIT!)
              console.log("Safari canplay event, triggering auto fullscreen");
              try {
                await handleAutoFullscreen();
                console.log("Fullscreen completed, now playing video");
              } catch (err) {
                console.log("Fullscreen on autoplay (Safari) failed:", err);
              }

              // Play video sau khi fullscreen
              await video.play().catch(console.error);
              setPlaying(true);
              setShowControls(true);
              setHasPlayedOnce(true);
            }
          }, 100); // Giảm từ 500ms → 100ms để giữ user gesture
        }
      };

      video.addEventListener("canplay", handleCanPlay);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [movie, svr, episode, shouldAutoPlay]);

  // Xử lý resume data riêng biệt
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resumeData || !videoReady) return;

    // Chỉ seek nếu video đã sẵn sàng và có resume data với currentTime > 0
    if (resumeData.currentTime > 0) {
      // Delay để đảm bảo video đã load xong
      const seekTimer = setTimeout(() => {
        if (video && hlsRef.current) {
          // Kiểm tra cả video và HLS instance
          video.currentTime = resumeData.currentTime;
          setProgress(resumeData.currentTime);
          console.log("Resume video at:", resumeData.currentTime);
        }
      }, 800); // Delay để HLS load xong

      return () => clearTimeout(seekTimer);
    }
  }, [resumeData, videoReady]); // ❌ Bỏ playing và shouldAutoPlay khỏi dependency

  // Monitor buffering
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleBuffering = () => {
      if (video.readyState < 2) {
        setIsBuffering(true);
      }
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(
          (video.buffered.end(video.buffered.length - 1) / video.duration) * 100
        );
      }
    };

    const handleEnded = () => {
      if (onVideoEnd) {
        onVideoEnd();
      }
    };

    video.addEventListener("waiting", handleBuffering);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("waiting", handleBuffering);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("ended", handleEnded);
    };
  }, [onVideoEnd]);

  // Pause overlay management - Professional implementation
  const resetPauseOverlayTimer = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    setShowOverlay(false);

    // Chỉ start timer nếu video đang pause
    const video = videoRef.current;
    if (video && video.paused) {
      inactivityTimer.current = setTimeout(() => {
        // Double-check trước khi hiện
        if (videoRef.current && videoRef.current.paused) {
          setShowOverlay(true);
        }
      }, 20000); // 20 seconds
    }
  }, []);

  // Video pause/play events - Sync state với video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePause = () => {
      setPlaying(false); // ✅ Sync state với video element
      resetPauseOverlayTimer();
    };

    const handlePlay = () => {
      setPlaying(true); // ✅ Sync state với video element
      clearTimeout(inactivityTimer.current);
      setShowOverlay(false);
    };

    video.addEventListener("pause", handlePause);
    video.addEventListener("play", handlePlay);

    return () => {
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("play", handlePlay);
      clearTimeout(inactivityTimer.current);
    };
  }, [resetPauseOverlayTimer]);

  // User interactions - clear overlay
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleInteraction = () => {
      // Clear overlay và reset timer
      resetPauseOverlayTimer();
    };

    container.addEventListener("touchstart", handleInteraction, {
      passive: true,
    });
    container.addEventListener("touchmove", handleInteraction, {
      passive: true,
    });
    container.addEventListener("mousemove", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    return () => {
      container.removeEventListener("touchstart", handleInteraction);
      container.removeEventListener("touchmove", handleInteraction);
      container.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [resetPauseOverlayTimer]);

  const showCenterOverlay = (icon, duration = 800) => {
    setCenterOverlay(icon);
    setIsSeekAnimating(true);
    setTimeout(() => {
      setIsSeekAnimating(false);
      setCenterOverlay(null);
    }, duration);
  };

  const handleInitialPlay = async () => {
    const video = videoRef.current;
    if (video) {
      // Auto fullscreen trên mobile TRƯỚC khi play (quan trọng!)
      console.log(
        "handleInitialPlay called, fullscreen:",
        fullscreen,
        "width:",
        window.innerWidth
      );
      console.log("Triggering auto fullscreen from play button");
      try {
        await handleAutoFullscreen();
      } catch (err) {
        console.log("Fullscreen on play failed:", err);
      }

      video.play();
      setPlaying(true);
      setShowControls(true);
      setHasPlayedOnce(true);

      // Lưu phim vào danh sách đang xem
      const movieData = {
        slug: movie.slug,
        poster_url: movie.poster_url,
        thumb_url: movie.thumb_url,
        name: movie.name,
        tmdb: movie.tmdb,
        year: movie.year,
        quality: movie.quality,
        category: movie.category,
        modified: movie.modified,
        episode_current: movie.episode_current,
        episode: episode,
        svr: svr,
        episodeName: movie.episodes[svr].server_data[episode].name,
        currentTime: 0,
        duration: video.duration || 0,
        progress: 0,
        lastWatched: new Date().toISOString(),
      };

      // Chỉ thêm nếu chưa có trong danh sách, tránh toggle gây xóa
      if (!isInWatching(movie.slug) && user?.email) {
        toggleWatching(movieData);
      }
    }
  };

  const handleTimeUpdate = () => {
    const currentTime = videoRef.current.currentTime;
    const videoDuration = videoRef.current.duration;

    // ✅ Luôn update UI progress/duration (cho cả guest và logged-in user)
    setProgress(currentTime);
    setDuration(videoDuration);

    // ✅ CHỈ lưu watching progress khi user đã đăng nhập
    if (
      user?.email &&
      videoDuration > 0 &&
      currentTime > 0 &&
      Math.floor(currentTime) % 5 === 0
    ) {
      updateWatchingProgress(
        movie.slug,
        currentTime,
        videoDuration,
        episode,
        svr,
        movie.episodes[svr].server_data[episode].name
      );
    }
  };

  const handleSeek = (e) => {
    // Chỉ seek khi click, không phải drag
    if (isDraggingProgress) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    if (!clientX) return;

    const percent = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / rect.width)
    );
    videoRef.current.currentTime = percent * duration;
  };

  const handleProgressDragStart = (e) => {
    e.preventDefault();
    setIsDraggingProgress(true);
    setIsHoveringProgress(true);

    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    if (!clientX) return;

    const percent = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / rect.width)
    );
    setPreviewTime(percent * duration);
  };

  const handleSeek10s = useCallback((sec) => {
    const video = videoRef.current;
    if (!video) return;

    const videoDuration = video.duration || 0;
    if (videoDuration === 0) return;

    // Xác định hướng seek
    const direction = sec > 0 ? "forward" : "backward";

    // Reset hướng ngược lại khi đổi hướng
    if (direction === "forward") {
      setSeekBackwardAmount(0);
      setSeekForwardAmount((prev) => prev + Math.abs(sec));
    } else {
      setSeekForwardAmount(0);
      setSeekBackwardAmount((prev) => prev + Math.abs(sec));
    }

    // Hiện overlay và tăng animation key để trigger animation mới
    setCenterOverlay(direction);
    setIsSeekAnimating(true);
    setSeekAnimationKey((prev) => prev + 1); // Force re-trigger animation

    // Clear timeout cũ và tạo mới
    clearTimeout(seekTimeoutRef.current);

    // Thực hiện seek
    const newTime = video.currentTime + sec;
    video.currentTime = Math.max(0, Math.min(newTime, videoDuration));

    // Reset sau 1.2 giây (đủ thời gian để xem số)
    seekTimeoutRef.current = setTimeout(() => {
      setSeekForwardAmount(0);
      setSeekBackwardAmount(0);
      setIsSeekAnimating(false);
      setCenterOverlay(null);
    }, 1200);
  }, []);

  const changePlaybackRate = (rate) => {
    const newRate = Math.min(Math.max(rate, 0.25), 2);
    videoRef.current.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  const changeQuality = (quality) => {
    if (hlsRef.current) {
      if (quality === "auto") {
        hlsRef.current.currentLevel = -1;
        setCurrentQuality("auto");
      } else {
        const level = hlsRef.current.levels.findIndex(
          (l) => l.height === quality
        );
        if (level !== -1) {
          hlsRef.current.currentLevel = level;
        }
      }
    }
    setShowQualityMenu(false);
  };

  const handleHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    if (!clientX) return;

    const percent = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / rect.width)
    );
    setHoverTime(percent * duration);
    setHoverPos(clientX - rect.left);
  };

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value);
    videoRef.current.volume = v;
    setVolume(v);
    setMuted(v === 0);
  };

  const handleMute = () => {
    if (videoRef.current.muted) {
      videoRef.current.volume = 0.5;
      setVolume(0.5);
      showCenterOverlay("unmute");
    } else {
      videoRef.current.volume = 0;
      setVolume(0);
      showCenterOverlay("mute");
    }
    videoRef.current.muted = videoRef.current.volume === 0;
    setMuted(videoRef.current.volume === 0);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    try {
      // Check if already in fullscreen
      const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      if (!isFullscreen) {
        console.log("Entering fullscreen...");

        // iOS Safari: Try video element fullscreen first (works better on mobile)
        if (
          isMobile &&
          video.webkitEnterFullscreen &&
          typeof video.webkitEnterFullscreen === "function"
        ) {
          try {
            video.webkitEnterFullscreen();
            console.log("iOS video fullscreen entered");
            setFullscreen(true);
            return;
          } catch (err) {
            console.log("iOS video fullscreen failed, trying container:", err);
          }
        }

        // Request fullscreen với fallback cho các browser khác nhau
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          // Safari iOS & old Chrome
          await container.webkitRequestFullscreen();
        } else if (container.mozRequestFullScreen) {
          // Firefox
          await container.mozRequestFullScreen();
        } else if (container.msRequestFullscreen) {
          // IE11
          await container.msRequestFullscreen();
        }

        console.log("Fullscreen entered successfully");
        setFullscreen(true);

        // Lock orientation SAU khi vào fullscreen (iOS requirement)
        if (screen.orientation && screen.orientation.lock) {
          try {
            await screen.orientation.lock("landscape");
            console.log("Orientation locked to landscape");
          } catch (err) {
            console.log("Orientation lock failed:", err);
          }
        }
      } else {
        console.log("Exiting fullscreen...");

        // Unlock orientation TRƯỚC khi thoát fullscreen
        if (screen.orientation && screen.orientation.unlock) {
          try {
            screen.orientation.unlock();
            console.log("Orientation unlocked");
          } catch (err) {
            console.log("Orientation unlock failed:", err);
          }
        }

        // iOS Safari: Exit video fullscreen
        if (
          video.webkitExitFullscreen &&
          typeof video.webkitExitFullscreen === "function"
        ) {
          try {
            video.webkitExitFullscreen();
            console.log("iOS video fullscreen exited");
            setFullscreen(false);
            return;
          } catch (err) {
            console.log("iOS exit fullscreen failed:", err);
          }
        }

        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }

        console.log("Fullscreen exited successfully");
        setFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error("PiP error:", error);
    }
  };

  // Handle video click - desktop only, mobile uses double tap
  const handleVideoClick = () => {
    // Only allow click play/pause on desktop
    if (isMobile) return;

    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(console.error);
      showCenterOverlay("play");
    } else {
      video.pause();
      showCenterOverlay("pause");
    }
    // ❌ Không set state ở đây, để video events tự sync
  };

  // Touch gestures - Clean implementation
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;
    const touchDuration = Date.now() - touchStartTime.current;
    const videoWidth = containerRef.current?.offsetWidth || 1;
    const videoHeight = containerRef.current?.offsetHeight || 1;

    // Bỏ qua nếu tap vào control bar
    const tapY = touchStartY.current;
    if (tapY > videoHeight * 0.85) return;

    // 1. SWIPE GESTURES (priority cao nhất)
    const isSwipe = Math.abs(diffX) > 50 || Math.abs(diffY) > 50;

    if (isSwipe) {
      // Vertical swipe on left edge = Volume
      if (
        touchStartX.current < videoWidth * 0.2 &&
        Math.abs(diffY) > Math.abs(diffX)
      ) {
        const volumeChange = (-diffY / videoHeight) * 0.5;
        const newVolume = Math.max(0, Math.min(1, volume - volumeChange));
        videoRef.current.volume = newVolume;
        setVolume(newVolume);
        setMuted(newVolume === 0);
        setShowSwipeControl({ type: "volume", value: newVolume });
        setTimeout(() => setShowSwipeControl(null), 500);
        return;
      }

      // Vertical swipe on right edge = Brightness
      if (
        touchStartX.current > videoWidth * 0.8 &&
        Math.abs(diffY) > Math.abs(diffX)
      ) {
        const brightnessChange = (-diffY / videoHeight) * 100; // 0-100% range
        const newBrightness = Math.max(
          20,
          Math.min(200, brightness - brightnessChange)
        );
        setBrightness(newBrightness);
        setShowSwipeControl({ type: "brightness", value: newBrightness });
        setTimeout(() => setShowSwipeControl(null), 500);
        return;
      }
    }

    // 2. TAP GESTURES
    const isTap =
      Math.abs(diffX) < 20 && Math.abs(diffY) < 20 && touchDuration < 300;

    if (isTap) {
      const tapX = touchStartX.current;
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;
      const distFromLastTap = Math.sqrt(
        Math.pow(tapX - lastTapX.current, 2) +
          Math.pow(tapY - lastTapY.current, 2)
      );

      // Double tap detection (trong 300ms và cùng vị trí)
      const isDoubleTap = timeSinceLastTap < 300 && distFromLastTap < 50;

      if (isDoubleTap) {
        // Cancel single tap timer
        clearTimeout(singleTapTimer.current);

        // Double tap: seek
        const isLeftHalf = tapX < videoWidth / 2;
        if (isLeftHalf) {
          handleSeek10s(-10);
        } else {
          handleSeek10s(10);
        }

        lastTapTime.current = 0; // Reset để tránh triple tap
      } else {
        // Single tap: delay 300ms để check double tap
        lastTapTime.current = now;
        lastTapX.current = tapX;
        lastTapY.current = tapY;

        singleTapTimer.current = setTimeout(async () => {
          // Single tap confirmed
          const video = videoRef.current;

          // Nếu video đang play và chưa fullscreen trên mobile → trigger fullscreen
          if (
            video &&
            !video.paused &&
            !fullscreen &&
            window.innerWidth < 1024
          ) {
            console.log("Single tap detected, triggering fullscreen");
            try {
              await handleAutoFullscreen();
              setShowControls(true);
              return;
            } catch (err) {
              console.log("Fullscreen from tap failed:", err);
            }
          }

          // ✅ LOGIC MỚI: Tap vào vùng trống → CHỈ toggle controls (không play/pause)
          // Play/pause chỉ qua nút bấm ở giữa màn
          if (showControls) {
            // Control đang hiện → ẩn đi
            setShowControls(false);
          } else {
            // Control chưa hiện → hiện ra
            setShowControls(true);
            resetControlsTimer(true); // Start timer để tự ẩn sau 3s
          }
        }, 300);
      }
    }
  };

  // Progress bar drag listeners
  useEffect(() => {
    if (!isDraggingProgress) return;

    const handleGlobalMove = (e) => {
      const progressBar = document.querySelector("[data-progress-bar]");
      if (!progressBar) return;

      const rect = progressBar.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
      if (!clientX) return;

      const percent = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width)
      );

      // Chỉ update preview, KHÔNG seek video
      setPreviewTime(percent * duration);
      setHoverTime(percent * duration);
      setHoverPos(clientX - rect.left);
    };

    const handleGlobalEnd = (e) => {
      // Seek video khi thả - mới update currentTime
      const video = videoRef.current;

      if (video && previewTime !== null) {
        video.currentTime = previewTime;
      }

      setIsDraggingProgress(false);
      setPreviewTime(null);
      setHoverTime(null);
      setIsHoveringProgress(false);
    };

    window.addEventListener("mousemove", handleGlobalMove);
    window.addEventListener("mouseup", handleGlobalEnd);
    window.addEventListener("touchmove", handleGlobalMove);
    window.addEventListener("touchend", handleGlobalEnd);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMove);
      window.removeEventListener("mouseup", handleGlobalEnd);
      window.removeEventListener("touchmove", handleGlobalMove);
      window.removeEventListener("touchend", handleGlobalEnd);
    };
  }, [isDraggingProgress, duration, previewTime]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".group/speed") && showSpeedMenu) {
        setShowSpeedMenu(false);
      }
      if (!e.target.closest(".group/quality") && showQualityMenuState) {
        setShowQualityMenuState(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showSpeedMenu, showQualityMenuState]);

  // Reset controls timer - expose để có thể gọi từ button clicks
  const resetControlsTimer = useCallback(
    (forceTimer = false) => {
      setShowControls(true);
      clearTimeout(controlsTimerRef.current);

      // forceTimer = true: luôn start timer (button clicks/keyboard)
      // forceTimer = false: chỉ start nếu không drag/hover progress
      const shouldStartTimer = forceTimer
        ? true
        : !isDraggingProgress && !isHoveringProgress;

      if (shouldStartTimer) {
        controlsTimerRef.current = setTimeout(() => {
          // Khi timer hết, check ref (real-time value) thay vì state
          // KHÔNG hide nếu Episodes đang mở (quan trọng cho mobile)
          if (
            !isHoveringControlsRef.current &&
            !isDraggingProgress &&
            !isHoveringProgress &&
            !showEpisodes
          ) {
            setShowControls(false);
          }
        }, 3000);
      }
    },
    [isDraggingProgress, isHoveringProgress, showEpisodes]
  );

  // Auto hide controls
  useEffect(() => {
    containerRef.current?.addEventListener("mousemove", resetControlsTimer);

    return () => {
      clearTimeout(controlsTimerRef.current);
      containerRef.current?.removeEventListener(
        "mousemove",
        resetControlsTimer
      );
    };
  }, [resetControlsTimer]);

  // Sync fullscreen state với browser events (quan trọng cho mobile)
  useEffect(() => {
    const video = videoRef.current;

    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setFullscreen(isFullscreen);

      // Unlock orientation khi user thoát fullscreen bằng gesture
      if (!isFullscreen && screen.orientation && screen.orientation.unlock) {
        try {
          screen.orientation.unlock();
          console.log("Orientation unlocked on fullscreen exit");
        } catch (err) {
          console.log("Orientation unlock failed:", err);
        }
      }
    };

    // iOS Safari specific events
    const handleIOSFullscreenBegin = () => {
      console.log("iOS fullscreen begin");
      setFullscreen(true);

      // Try to lock orientation on iOS
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape").catch((err) => {
          console.log("iOS orientation lock failed:", err);
        });
      }
    };

    const handleIOSFullscreenEnd = () => {
      console.log("iOS fullscreen end");
      setFullscreen(false);

      // Unlock orientation on iOS
      if (screen.orientation && screen.orientation.unlock) {
        try {
          screen.orientation.unlock();
          console.log("iOS orientation unlocked");
        } catch (err) {
          console.log("iOS orientation unlock failed:", err);
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    // iOS specific video events
    if (video) {
      video.addEventListener("webkitbeginfullscreen", handleIOSFullscreenBegin);
      video.addEventListener("webkitendfullscreen", handleIOSFullscreenEnd);
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange
      );

      if (video) {
        video.removeEventListener(
          "webkitbeginfullscreen",
          handleIOSFullscreenBegin
        );
        video.removeEventListener(
          "webkitendfullscreen",
          handleIOSFullscreenEnd
        );
      }
    };
  }, []);

  // Khi Episodes mở/đóng, reset timer để giữ controls hiển thị
  useEffect(() => {
    if (showEpisodes) {
      setShowControls(true);
      clearTimeout(controlsTimerRef.current);
    } else {
      // Khi đóng Episodes, reset timer bình thường
      resetControlsTimer(false);
    }
  }, [showEpisodes, resetControlsTimer]);

  // Auto-hide controls sau khi video play (đặc biệt quan trọng khi chuyển tập)
  useEffect(() => {
    if (videoReady && hasPlayedOnce && playing) {
      console.log("Video is playing, starting auto-hide timer for controls", {
        episode,
        svr,
        shouldAutoPlay,
      });
      // Delay trước khi start timer
      const initialDelay = setTimeout(() => {
        // Start timer để ẩn controls
        resetControlsTimer(true); // Force start timer
      }, 2000); // 2s sau khi video play mới bắt đầu timer ẩn

      return () => clearTimeout(initialDelay);
    }
  }, [videoReady, hasPlayedOnce, playing, episode, svr, resetControlsTimer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      // Không xử lý nếu focus vào input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      // Hiện controls và reset timer khi nhấn phím tắt
      const videoShortcuts = [
        " ",
        "arrowright",
        "arrowleft",
        "f",
        "m",
        "[",
        "]",
        "p",
        "?",
      ];
      if (videoShortcuts.includes(e.key.toLowerCase())) {
        resetControlsTimer(true); // Force timer bất kể hover state
      }

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          const video = videoRef.current;
          if (video) {
            if (video.paused) {
              video.play().catch(console.error);
              showCenterOverlay("play");
              // Set hasPlayedOnce nếu đây là lần đầu play
              if (!hasPlayedOnce) {
                setHasPlayedOnce(true);
              }
            } else {
              video.pause();
              showCenterOverlay("pause");
            }
          }
          break;
        case "arrowright":
          e.preventDefault();
          handleSeek10s(10);
          break;
        case "arrowleft":
          e.preventDefault();
          handleSeek10s(-10);
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          handleMute();
          break;
        case "[":
          e.preventDefault();
          changePlaybackRate(playbackRate - 0.25);
          break;
        case "]":
          e.preventDefault();
          changePlaybackRate(playbackRate + 0.25);
          break;
        case "p":
          e.preventDefault();
          if (pipSupported) togglePiP();
          break;
        case "?":
          e.preventDefault();
          setShowShortcuts(!showShortcuts);
          setShowControls(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [
    playbackRate,
    pipSupported,
    showShortcuts,
    hasPlayedOnce,
    resetControlsTimer,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative bg-black w-full aspect-video mx-auto overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video */}
      <video
        ref={videoRef}
        poster={import.meta.env.VITE_API_IMAGE + movie?.poster_url}
        className={`w-full h-full bg-black transition-all duration-300 ${
          fullscreen || isMobile ? "object-contain" : "object-cover"
        }`}
        style={{ filter: `brightness(${brightness}%)` }}
        onTimeUpdate={handleTimeUpdate}
        onClick={isMobile ? undefined : handleVideoClick}
        preload="auto"
        playsInline
      />

      {/* Loading indicator - khi video chưa ready */}
      {!videoReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white text-lg font-medium">Đang tải...</p>
          </div>
        </div>
      )}

      {/* Initial play button - CHỈ hiện lần đầu vào, chưa play bao giờ */}
      {videoReady && !hasPlayedOnce && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/50 via-black/60 to-black/70 backdrop-blur-sm z-20 animate-fadeIn">
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={handleInitialPlay}
              className="outline-none group relative border-[1px] border-white/80 rounded-full p-4 sm:p-6 bg-black/50 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-white shadow-2xl active:scale-95 hover:shadow-white/50"
              aria-label="Phát video"
            >
              <Play
                size={isMobile ? 30 : 60}
                className="text-white fill-white drop-shadow-2xl"
                strokeWidth={2}
                fill="white"
              />
              <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></div>
            </button>
          </div>
        </div>
      )}

      {/* Buffering indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white text-sm">Đang tải...</p>
          </div>
        </div>
      )}

      {/* Swipe control indicator */}
      {showSwipeControl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[9998]">
          <div className="bg-black/80 backdrop-blur-lg rounded-2xl px-8 py-6 min-w-[200px] shadow-2xl border border-white/10">
            <div className="flex flex-col items-center gap-4">
              {/* Icon & Label */}
              <div className="flex items-center gap-3">
                {showSwipeControl.type === "volume" ? (
                  <>
                    <Volume2 size={28} className="text-white" />
                    <span className="text-white font-semibold text-lg">
                      Âm lượng
                    </span>
                  </>
                ) : (
                  <>
                    <Sun size={28} className="text-white" />
                    <span className="text-white font-semibold text-lg">
                      Độ sáng
                    </span>
                  </>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-150 ${
                      showSwipeControl.type === "volume"
                        ? "bg-gradient-to-r from-red-500 to-red-600"
                        : "bg-gradient-to-r from-yellow-400 to-yellow-500"
                    }`}
                    style={{
                      width: `${
                        showSwipeControl.type === "volume"
                          ? showSwipeControl.value * 100
                          : ((showSwipeControl.value - 20) / 180) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Value display */}
              <div className="text-center">
                <span className="text-white text-3xl font-bold tabular-nums">
                  {showSwipeControl.type === "volume"
                    ? Math.round(showSwipeControl.value * 100)
                    : Math.round(showSwipeControl.value)}
                </span>
                <span className="text-white/70 text-xl ml-1">%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Center overlay */}
      {centerOverlay && (
        <div
          className={`absolute inset-0 flex items-center pointer-events-none transition-all duration-200 ${
            centerOverlay === "forward"
              ? "justify-end px-[6%]"
              : centerOverlay === "backward"
              ? "justify-start px-[6%]"
              : "justify-center lg:flex hidden"
          }`}
        >
          <div
            className={`bg-black/40 opacity-80 backdrop-blur-sm rounded-full p-6 lg:p-10 text-white shadow-2xl ${
              isSeekAnimating
                ? centerOverlay === "forward"
                  ? "animate-slideInRight bg-transparent !backdrop-blur-none !shadow-none"
                  : centerOverlay === "backward"
                  ? "animate-slideInLeft bg-transparent !backdrop-blur-none !shadow-none"
                  : "animate-fadeIn"
                : "animate-fadeOut"
            }`}
          >
            {centerOverlay === "play" && (
              <Play
                size={isMobile ? 48 : 80}
                className="text-white fill-white drop-shadow-2xl"
                strokeWidth={2}
              />
            )}
            {centerOverlay === "pause" && (
              <Pause
                size={isMobile ? 48 : 80}
                className="text-white fill-white drop-shadow-2xl"
                strokeWidth={2}
              />
            )}
            {centerOverlay === "forward" && (
              <div className="flex items-center justify-center gap-1">
                <div className="text-center">
                  <span className="text-white text-3xl lg:text-5xl font-bold transition-all duration-100">
                    + {seekForwardAmount}
                  </span>
                </div>
                <ChevronRight
                  size={isMobile ? 48 : 72}
                  strokeWidth={2.5}
                  className="animate-slideInRight"
                  key={seekAnimationKey + "forward"}
                />
              </div>
            )}
            {centerOverlay === "backward" && (
              <div className="flex items-center justify-center gap-1">
                <ChevronLeft
                  size={isMobile ? 48 : 72}
                  strokeWidth={2.5}
                  className="animate-slideInLeft"
                  key={seekAnimationKey + "backward"}
                />
                <div className="text-center">
                  <span className="text-white text-3xl lg:text-5xl font-bold transition-all duration-100">
                    - {seekBackwardAmount}
                  </span>
                </div>
              </div>
            )}
            {centerOverlay === "mute" && (
              <VolumeX size={isMobile ? 40 : 80} strokeWidth={2.5} />
            )}
            {centerOverlay === "unmute" && (
              <Volume2 size={isMobile ? 40 : 80} strokeWidth={2.5} />
            )}
          </div>
        </div>
      )}

      {/* Mobile Netflix-style controls */}
      {isMobile && videoReady && hasPlayedOnce && showControls && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          {/* Left side - Volume control */}
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-auto"
            onTouchStart={(e) => {
              e.stopPropagation();
              clearTimeout(inactivityTimer.current);
              clearTimeout(controlsTimerRef.current);
              setShowControls(true);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              resetControlsTimer(true);
            }}
            onTouchMove={(e) => {
              e.stopPropagation();
              clearTimeout(inactivityTimer.current);
              clearTimeout(controlsTimerRef.current);
            }}
          >
            <div className="flex flex-col items-center gap-3 rounded-full px-2 py-4">
              <Volume2
                size={18}
                className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={handleVolume}
                className="h-28 w-1 cursor-pointer accent-white"
                style={{
                  writingMode: "bt-lr",
                  WebkitAppearance: "slider-vertical",
                  appearance: "slider-vertical",
                }}
                aria-label="Âm lượng"
              />
              <span className="text-white text-xs font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {Math.round(volume * 100)}
              </span>
            </div>
          </div>

          {/* Center - Play/Pause & Seek buttons */}
          <div
            className="flex items-center justify-center gap-16 pointer-events-auto"
            onTouchStart={(e) => {
              e.stopPropagation();
              clearTimeout(inactivityTimer.current);
              clearTimeout(controlsTimerRef.current);
              setShowControls(true);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              resetControlsTimer(true);
            }}
            onTouchMove={(e) => {
              e.stopPropagation();
              clearTimeout(inactivityTimer.current);
              clearTimeout(controlsTimerRef.current);
            }}
          >
            {/* Backward 10s button */}
            <button
              onTouchEnd={(e) => {
                e.preventDefault();
                handleSeek10s(-10);
              }}
              className="rounded-full p-4 active:scale-90 transition-all"
              aria-label="Tua lại 10 giây"
            >
              <div className="flex items-center flex-row-reverse gap-2">
                <RotateCcw
                  size={48}
                  className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                  strokeWidth={2.5}
                />
              </div>
            </button>

            {/* Play/Pause button */}
            <button
              onTouchEnd={(e) => {
                e.preventDefault();
                const video = videoRef.current;
                if (video) {
                  if (video.paused) {
                    video.play().catch(console.error);
                    showCenterOverlay("play");
                  } else {
                    video.pause();
                    showCenterOverlay("pause");
                  }
                }
              }}
              className="rounded-full p-5 active:scale-90 transition-all"
              aria-label={playing ? "Tạm dừng" : "Phát"}
            >
              {playing ? (
                <Pause
                  size={46}
                  className="text-white fill-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                  strokeWidth={2.5}
                />
              ) : (
                <Play
                  size={46}
                  className="text-white fill-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                  strokeWidth={2.5}
                />
              )}
            </button>

            {/* Forward 10s button */}
            <button
              onTouchEnd={(e) => {
                e.preventDefault();
                handleSeek10s(10);
              }}
              className="rounded-full p-4 active:scale-90 transition-all"
              aria-label="Tua tới 10 giây"
            >
              <div className="flex items-center gap-2">
                <RotateCw
                  size={48}
                  className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                  strokeWidth={2.5}
                />
              </div>
            </button>
          </div>

          {/* Right side - Brightness control */}
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto"
            onTouchStart={(e) => {
              e.stopPropagation();
              clearTimeout(inactivityTimer.current);
              clearTimeout(controlsTimerRef.current);
              setShowControls(true);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              resetControlsTimer(true);
            }}
            onTouchMove={(e) => {
              e.stopPropagation();
              clearTimeout(inactivityTimer.current);
              clearTimeout(controlsTimerRef.current);
            }}
          >
            <div className="flex flex-col items-center gap-3 rounded-full px-2 py-4">
              <Sun
                size={18}
                className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              />
              <input
                type="range"
                min={20}
                max={200}
                step={5}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="h-28 w-1 cursor-pointer accent-yellow-400"
                style={{
                  writingMode: "bt-lr",
                  WebkitAppearance: "slider-vertical",
                  appearance: "slider-vertical",
                }}
                aria-label="Độ sáng"
              />
              <span className="text-white text-xs font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {Math.round(brightness)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pause overlay */}
      {showOverlay && hasPlayedOnce && !showControls && (
        <div className="absolute inset-0 bg-black/60 flex flex-col justify-center px-[10%] transition-opacity duration-500">
          <div className="text-white max-w-2xl pt-12 lg:pt-0">
            <p className="text-xs lg:text-base mb-2 text-white/70">Đang xem</p>
            <h1 className="text-2xl lg:text-5xl font-bold mb-1">
              {movie.name}
            </h1>
            <p className="text-sm lg:text-xl font-semibold mb-3">
              Loạt phim truyền hình ngắn
            </p>
            <p className="text-xl lg:text-3xl font-semibold mb-3">{`Tập ${movie.episodes[svr].server_data[episode].name}`}</p>
            <p
              className="text-xs lg:text-base opacity-90 mb-6 text-pretty line-clamp-3 invisible lg:visible text-white/70"
              dangerouslySetInnerHTML={{ __html: movie.content }}
            />
          </div>
          <p className="absolute bottom-[10%] right-[10%] text-white/70 text-xs lg:text-base">
            Đã tạm ngừng
          </p>
        </div>
      )}

      {/* Keyboard shortcuts helper */}
      {showShortcuts && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[9999]">
          <div className="bg-black/95 text-white p-6 rounded-lg max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Phím tắt</h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="hover:bg-white/20 p-1 rounded"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <kbd className="bg-white/20 px-2 py-1 rounded">Space</kbd>
                <p className="text-white/70">Phát/Dừng</p>
              </div>
              <div>
                <kbd className="bg-white/20 px-2 py-1 rounded">→</kbd>
                <p className="text-white/70">+10 giây</p>
              </div>
              <div>
                <kbd className="bg-white/20 px-2 py-1 rounded">←</kbd>
                <p className="text-white/70">-10 giây</p>
              </div>
              <div>
                <kbd className="bg-white/20 px-2 py-1 rounded">M</kbd>
                <p className="text-white/70">Tắt tiếng</p>
              </div>
              <div>
                <kbd className="bg-white/20 px-2 py-1 rounded">F</kbd>
                <p className="text-white/70">Toàn màn hình</p>
              </div>
              <div>
                <kbd className="bg-white/20 px-2 py-1 rounded">[</kbd>
                <p className="text-white/70">Giảm tốc độ</p>
              </div>
              <div>
                <kbd className="bg-white/20 px-2 py-1 rounded">]</kbd>
                <p className="text-white/70">Tăng tốc độ</p>
              </div>
              <div>
                <kbd className="bg-white/20 px-2 py-1 rounded">P</kbd>
                <p className="text-white/70">PiP Mode</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {videoReady && hasPlayedOnce && (
        <div
          className={`absolute top-0 left-0 w-full flex items-center justify-between bg-gradient-to-b from-black/30 to-transparent transition-opacity duration-300 ${
            showControls || showEpisodes ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={() => {
              navigate(
                `/trang-chu?movie=${movie.slug}&tmdb_id=${movie.tmdb.id}&tmdb_type=${movie.tmdb.type}`
              );
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              navigate(
                `/trang-chu?movie=${movie.slug}&tmdb_id=${movie.tmdb.id}&tmdb_type=${movie.tmdb.type}`
              );
            }}
            className={`hover:scale-125 transition-all ease-linear duration-100 p-4 lg:p-6 text-white z-50 pointer-events-auto active:scale-95`}
          >
            <ArrowLeft size={isMobile ? 30 : 40} />
          </button>
          <span className="lg:hidden block ml-4 text-sm text-white font-semibold truncate">
            {movie.name} -{" "}
            {"Tập " + movie.episodes[svr].server_data[episode].name}
          </span>
          <button className="hover:scale-125 transition-all opacity-0 ease-linear duration-100 p-4 lg:p-6 text-white z-50 pointer-events-auto active:scale-95">
            <ArrowLeft size={isMobile ? 30 : 40} />
          </button>
        </div>
      )}

      {/* Controls - chỉ hiện khi video ready VÀ đã play lần đầu */}
      {videoReady && hasPlayedOnce && (
        <div
          onMouseEnter={() => {
            setIsHoveringControls(true);
            isHoveringControlsRef.current = true;
          }}
          onMouseLeave={() => {
            setIsHoveringControls(false);
            isHoveringControlsRef.current = false;
          }}
          className={`absolute bottom-0 w-full bg-gradient-to-t from-black/50 to-transparent p-2 lg:p-4 text-white 
            transition-all duration-500 ease-in-out
            ${
              showControls || showEpisodes
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
        >
          {/* Progress bar */}
          <div className="flex flex-col items-center justify-between w-full gap-3 mb-2 lg:mb-3">
            <div className="flex items-center gap-2 justify-between w-full px-1">
              <span className="text-xs lg:text-sm whitespace-nowrap text-white/90 ">
                {formatTime(progress)}
              </span>
              <span className="text-xs lg:text-sm whitespace-nowrap text-white/90">
                {formatTime(duration)}
              </span>
            </div>
            <div
              data-progress-bar
              className="relative h-1 bg-white/20 cursor-pointer w-full transition-all duration-200 group/progress py-[2px] -my-1"
              onClick={handleSeek}
              onMouseDown={handleProgressDragStart}
              onTouchStart={handleProgressDragStart}
              onMouseMove={handleHover}
              onTouchMove={handleHover}
              onMouseEnter={() => setIsHoveringProgress(true)}
              onMouseLeave={() => {
                if (!isDraggingProgress) {
                  setHoverTime(null);
                  setIsHoveringProgress(false);
                }
              }}
            >
              {/* Buffered */}
              <div
                className="absolute top-0 left-0 h-full bg-white/20 transition-all duration-200"
                style={{ width: `${buffered}%` }}
              />

              {/* Progress */}
              <div
                className={`absolute top-0 left-0 h-full bg-red-600 ${
                  isDraggingProgress
                    ? "h-1 transition-none"
                    : "group-hover/progress:h-1 transition-all duration-200"
                }`}
                style={{
                  width: `${
                    ((isDraggingProgress && previewTime !== null
                      ? previewTime
                      : progress) /
                      duration) *
                    100
                  }%`,
                }}
              >
                {/* Thumb */}
                <div
                  className={`absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full shadow-lg transform ${
                    isDraggingProgress
                      ? "scale-125 h-3 w-3 transition-none"
                      : "scale-0 group-hover/progress:scale-100 h-3 w-3 transition-all duration-200"
                  }`}
                />
              </div>

              {/* Hover preview */}
              {hoverTime !== null && (
                <div
                  className="absolute -top-12 flex flex-col items-center -translate-x-1/2 pointer-events-none z-10"
                  style={{ left: hoverPos }}
                >
                  <div className="bg-black/90 backdrop-blur flex items-center justify-center text-xs px-2 py-1.5 rounded shadow-xl border border-white/10">
                    {formatTime(hoverTime)}
                  </div>
                  <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-black/90 -mt-px" />
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between px-2 lg:px-3 pt-4 lg:pb-3">
            <div className="hidden lg:flex items-center space-x-1 lg:space-x-4 flex-wrap">
              {/* Play */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const video = videoRef.current;
                  if (video) {
                    if (video.paused) {
                      video.play().catch(console.error);
                      showCenterOverlay("play");
                    } else {
                      video.pause();
                      showCenterOverlay("pause");
                    }
                  }
                  resetControlsTimer(true); // Force timer khi click
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                }}
                className="group relative hover:scale-110 transition-all ease-linear duration-100 outline-none hidden lg:block"
                aria-label={playing ? "Dừng" : "Phát"}
              >
                {playing ? (
                  <Pause size={isMobile ? 32 : 36} className="text-white fill-white drop-shadow-2xl" strokeWidth={2} fill="white" />
                ) : (
                  <Play size={isMobile ? 32 : 36} className="text-white fill-white drop-shadow-2xl" strokeWidth={2} fill="white" />
                )}
              </button>

              {/* Backward */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSeek10s(-10);
                  resetControlsTimer(true); // Force timer khi click
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                }}
                className="hover:scale-125 transition-all ease-linear duration-100 group/tooltip relative p-2 outline-none hidden lg:block"
                aria-label="Quay lại 10 giây"
              >
                <RotateCcw size={isMobile ? 30 : 40} />
                <Tooltip
                  content={"10s trước (←)"}
                  size="sm"
                  className="bottom-[100%]"
                  color="dark"
                />
              </button>

              {/* Forward */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSeek10s(10);
                  resetControlsTimer(true); // Force timer khi click
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                }}
                className="hover:scale-125 transition-all ease-linear duration-100 group/tooltip relative p-2 outline-none hidden lg:block"
                aria-label="Tiến 10 giây"
              >
                <RotateCw size={isMobile ? 30 : 40} />
                <Tooltip
                  content={"10s sau (→)"}
                  size="sm"
                  className="bottom-[100%]"
                  color="dark"
                />
              </button>

              {/* Volume - Desktop only (mobile uses edge swipe) */}
              {!isMobile && (
                <div className="flex items-center relative group group/tooltip">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMute();
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                    }}
                    className="hover:scale-125 transition-all ease-linear duration-100 p-2 outline-none"
                    aria-label={muted ? "Bật tiếng" : "Tắt tiếng"}
                  >
                    {muted ? (
                      <VolumeX size={40} />
                    ) : volume < 0.3 ? (
                      <Volume size={40} />
                    ) : volume < 0.7 ? (
                      <Volume1 size={40} />
                    ) : (
                      <Volume2 size={40} />
                    )}
                  </button>
                  <div className="cursor-pointer -rotate-90 absolute top-[-70px] left-1/2 z-10 -translate-x-1/2 bg-[#262626] backdrop-blur flex justify-center items-center p-2 rounded-md group-hover:visible group-hover:opacity-100 opacity-0 invisible transition-all duration-200">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={handleVolume}
                      className="w-24 cursor-pointer"
                      style={{ accentColor: "red", backgroundColor: "gray" }}
                      aria-label="Âm lượng"
                    />
                  </div>
                </div>
              )}

              {/* Title - chỉ desktop */}
            </div>
            <span className="hidden lg:block ml-4 text-xs lg:text-base font-semibold truncate">
              {movie.name} -{" "}
              {"Tập " + movie.episodes[svr].server_data[episode].name}
            </span>

            <div className="flex items-center justify-around w-full lg:w-auto lg:justify-start space-x-1 lg:space-x-4">
              {/* Next episode */}
              {movie.episodes[svr].server_data.length > 0 &&
                parseInt(episode) <
                  movie.episodes[svr].server_data.length - 1 && (
                  <div className="relative group/episodes">
                    <button
                      className="hover:scale-125 transition-all ease-linear duration-100 group/tooltip relative p-2 outline-none flex items-center space-x-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigateToNextEpisode) {
                          onNavigateToNextEpisode();
                        } else {
                          navigate(
                            `/xem-phim/${movie.slug}?svr=${svr}&ep=${
                              parseInt(episode) + 1
                            }`
                          );
                        }
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                      }}
                      aria-label="Xem tập tiếp theo"
                    >
                      <SkipForward size={isMobile ? 30 : 40} />
                      <span className="lg:hidden">Tập tiếp theo</span>
                    </button>
                    <div
                      className="hidden lg:block absolute -translate-x-1/2 -translate-y-[100%] top-0 left-1/2 bg-[#262626]/95 backdrop-blur text-white text-sm
                  opacity-0 invisible group-hover/episodes:opacity-100 group-hover/episodes:visible 
                  transition-all duration-200 z-[9999] rounded-sm overflow-hidden"
                    >
                      <div className="py-3 px-5 text-center">
                        <span className="text-white font-semibold text-lg">
                          Tập tiếp theo
                        </span>
                        <span className="text-white font-semibold text-lg">
                          {" - Tập " +
                            movie.episodes[svr].server_data[
                              parseInt(episode) + 1
                            ].name}
                        </span>
                      </div>
                      <div className="flex flex-col h-full bg-[#131313]">
                        <div className="group/nextEpisode relative h-36 aspect-video flex items-center justify-center p-3 cursor-pointer">
                          <LazyImage
                            src={movie.poster_url}
                            alt={
                              movie.episodes[svr].server_data[
                                parseInt(episode) + 1
                              ].name
                            }
                            sizes="10vw"
                          />

                          <div className="absolute bottom-0 right-0 w-full h-full flex items-center justify-center rounded-sm cursor-pointer opacity-50 group-hover/nextEpisode:opacity-100 group-hover/nextEpisode:scale-105 transition-all ease-linear duration-100 delay-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onNavigateToNextEpisode) {
                                  onNavigateToNextEpisode();
                                } else {
                                  navigate(
                                    `/xem-phim/${movie.slug}?svr=${svr}&ep=${
                                      parseInt(episode) + 1
                                    }`
                                  );
                                }
                              }}
                              className="outline-none group relative border-[1px] border-white/80 rounded-full p-2 sm:p-3 bg-black/50 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-white shadow-2xl active:scale-95 hover:shadow-white/50"
                              aria-label="Phát video"
                            >
                              <Play
                                size={24}
                                className="text-white fill-white drop-shadow-2xl"
                                strokeWidth={2}
                                fill="white"
                              />
                              <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              {/* Episodes */}
              {movie.episodes[svr].server_data.length > 0 &&
                movie.type !== "single" && (
                  <div className="group/episodes">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isMobile) {
                          const newShowState = !showEpisodes;
                          setShowEpisodes(newShowState);
                          if (newShowState) {
                            // Pause video khi mở Episodes
                            videoRef.current.pause();
                            // Đảm bảo controls luôn hiển thị
                            setShowControls(true);
                          }
                        }
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                      }}
                      className={`group-hover/episodes:scale-125 transition-all ease-linear duration-100 p-2 outline-none flex items-center space-x-2 ${
                        showEpisodes && isMobile ? "text-red-500" : ""
                      }`}
                      aria-label="Danh sách tập"
                    >
                      <ListVideo size={isMobile ? 30 : 40} />
                      <span className="lg:hidden">Danh sách tập</span>
                    </button>
                    <Episodes
                      onClose={() => {
                        setShowEpisodes(false);
                        setShowControls(true);
                        resetControlsTimer(false);
                      }}
                      onEpisodeChange={(newSvr, newEp) => {
                        // Trigger shouldAutoPlay khi chuyển tập từ Episodes
                        console.log("Episode changed from Episodes:", {
                          newSvr,
                          newEp,
                        });
                        // Set hasPlayedOnce để không hiện nút play lớn
                        setHasPlayedOnce(true);
                      }}
                      show={showEpisodes}
                      name={movie.name}
                      episodes={movie.episodes}
                      svr={svr}
                      poster_url={movie.poster_url}
                      slug={movie.slug}
                      episode={episode}
                    />
                  </div>
                )}
              {/* Playback speed */}
              <div className="relative group">
                <div className="relative group/speed">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSpeedMenu(!showSpeedMenu);
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                    }}
                    className="hover:scale-125 transition-all ease-linear duration-100 p-2 group/tooltip relative outline-none flex items-center space-x-2"
                    aria-label="Tốc độ phát"
                  >
                    <Gauge size={isMobile ? 30 : 40} />
                    <span className="lg:hidden">Tốc độ ({playbackRate}x)</span>
                  </button>
                  <div
                    className={`absolute bottom-14 right-1/2 bg-black/90 backdrop-blur text-white rounded-md p-1 text-xs lg:text-sm
                  transition-all duration-200 translate-x-1/2 border border-white/10 ${
                    showSpeedMenu
                      ? "opacity-100 visible"
                      : "opacity-0 invisible lg:group-hover/speed:opacity-100 lg:group-hover/speed:visible"
                  }`}
                  >
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <div
                        key={rate}
                        onClick={(e) => {
                          e.stopPropagation();
                          changePlaybackRate(rate);
                          setShowSpeedMenu(false);
                        }}
                        className={`px-3 py-1 cursor-pointer hover:bg-white/20 text-center rounded transition
                    ${
                      playbackRate === rate
                        ? "text-red-500 font-semibold bg-white/10"
                        : ""
                    }`}
                      >
                        {rate}x
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quality selector */}
              <div className="relative group hidden lg:block">
                <div className="relative group/quality hidden lg:block">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQualityMenuState(!showQualityMenuState);
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                    }}
                    className="hover:scale-125 transition-all ease-linear duration-100 p-2 group/tooltip relative outline-none"
                    aria-label="Chất lượng"
                  >
                    <SlidersHorizontal size={40} />
                  </button>
                  <div
                    className={`absolute bottom-14 right-1/2 bg-black/90 backdrop-blur text-white rounded-md p-1 text-sm
                  transition-all duration-200 translate-x-1/2 border border-white/10 min-w-max ${
                    showQualityMenuState
                      ? "opacity-100 visible"
                      : "opacity-0 invisible lg:group-hover/quality:opacity-100 lg:group-hover/quality:visible"
                  }`}
                  >
                    {qualities.map((q) => (
                      <div
                        key={q.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          changeQuality(q.height === 0 ? "auto" : q.height);
                          setShowQualityMenuState(false);
                        }}
                        className={`px-3 py-1 cursor-pointer hover:bg-white/20 text-center rounded transition
                    ${
                      currentQuality ===
                      (q.height === 0 ? "auto" : `${q.height}p`)
                        ? "text-red-500 font-semibold bg-white/10"
                        : ""
                    }`}
                      >
                        {q.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Picture in Picture */}
              {/* {pipSupported && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePiP();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                  }}
                  className="hover:scale-125 transition-all ease-linear duration-100 group/tooltip relative p-2 hidden lg:block"
                  aria-label="Picture in Picture"
                >
                  <PictureInPicture size={40} />
                  <Tooltip
                    content={"PiP (P)"}
                    size="sm"
                    className="bottom-[100%]"
                    color="dark"
                  />
                </button>
              )} */}

              {/* Fullscreen */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                }}
                className="hover:scale-125 transition-all ease-linear duration-100 group/tooltip relative p-2 outline-none hidden lg:block"
                aria-label={fullscreen ? "Thu nhỏ" : "Phóng to"}
              >
                {fullscreen ? (
                  <Minimize size={isMobile ? 30 : 40} />
                ) : (
                  <Maximize size={isMobile ? 30 : 40} />
                )}
                <Tooltip
                  content={fullscreen ? "Thu nhỏ (F)" : "Phóng to (F)"}
                  size="sm"
                  className="bottom-[100%]"
                  color="dark"
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
