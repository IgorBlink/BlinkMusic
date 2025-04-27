import  { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

// Объявляем глобальный интерфейс для YouTube API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Добавляем интерфейс для ref
export interface YouTubePlayerRef {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

interface YouTubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  onReady?: () => void;
  onStateChange?: (state: number) => void;
  onProgress?: (currentTime: number, duration: number) => void;
  onError?: (error: any) => void;
  onEnd?: () => void;
}

const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(({
  videoId,
  isPlaying,
  volume,
  isMuted,
  onReady,
  onStateChange,
  onProgress,
  onError,
  onEnd
}, ref) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerReadyRef = useRef<boolean>(false);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Экспортируем методы через ref
  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      if (playerRef.current && playerReadyRef.current) {
        playerRef.current.seekTo(seconds, true);
      }
    },
    getCurrentTime: () => {
      if (playerRef.current && playerReadyRef.current) {
        return playerRef.current.getCurrentTime() || 0;
      }
      return 0;
    },
    getDuration: () => {
      if (playerRef.current && playerReadyRef.current) {
        return playerRef.current.getDuration() || 0;
      }
      return 0;
    }
  }));
  
  // Инициализация YouTube API
  useEffect(() => {
    // Проверяем, загружен ли уже YouTube API
    if (!window.YT) {
      // Создаем script элемент
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      
      // Добавляем элемент на страницу
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      // Определяем коллбэк, который будет вызван после загрузки API
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      // Если API уже загружен, инициализируем плеер
      initPlayer();
    }
    
    return () => {
      // Очищаем интервал при размонтировании компонента
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // Уничтожаем плеер при размонтировании
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);
  
  // Обновляем плеер при изменении ID видео
  useEffect(() => {
    if (playerReadyRef.current && playerRef.current && videoId) {
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoId]);
  
  // Обрабатываем изменения состояния плеера (play/pause)
  useEffect(() => {
    if (playerReadyRef.current && playerRef.current) {
      if (isPlaying) {
        playerRef.current.playVideo();
        
        // Запускаем интервал для отслеживания прогресса
        if (!progressIntervalRef.current) {
          progressIntervalRef.current = setInterval(() => {
            if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
              const currentTime = playerRef.current.getCurrentTime() || 0;
              const duration = playerRef.current.getDuration() || 0;
              
              if (onProgress) {
                onProgress(currentTime, duration);
              }
            }
          }, 1000);
        }
      } else {
        playerRef.current.pauseVideo();
        
        // Останавливаем интервал для отслеживания прогресса
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }
  }, [isPlaying, onProgress]);
  
  // Обрабатываем изменения громкости
  useEffect(() => {
    if (playerReadyRef.current && playerRef.current) {
      const normalizedVolume = Math.floor(volume * 100); // YouTube API принимает значения от 0 до 100
      
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(normalizedVolume);
      }
    }
  }, [volume, isMuted]);
  
  // Инициализируем YouTube плеер
  const initPlayer = () => {
    if (!containerRef.current) return;
    
    // Создаем новый плеер
    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: videoId,
      playerVars: {
        autoplay: isPlaying ? 1 : 0,
        controls: 0, // Скрываем элементы управления YouTube
        disablekb: 1, // Отключаем клавиатурное управление
        fs: 0, // Отключаем кнопку полноэкранного режима
        modestbranding: 1, // Скрываем логотип YouTube
        rel: 0, // Отключаем показ похожих видео в конце
        showinfo: 0, // Скрываем информацию о видео
        iv_load_policy: 3 // Скрываем аннотации
      },
      events: {
        onReady: handlePlayerReady,
        onStateChange: handlePlayerStateChange,
        onError: handlePlayerError
      }
    });
  };
  
  // Обработчик события готовности плеера
  const handlePlayerReady = (event: any) => {
    playerReadyRef.current = true;
    
    // Устанавливаем начальную громкость
    const normalizedVolume = Math.floor(volume * 100);
    
    if (isMuted) {
      event.target.mute();
    } else {
      event.target.unMute();
      event.target.setVolume(normalizedVolume);
    }
    
    // Если нужно начать воспроизведение сразу
    if (isPlaying) {
      event.target.playVideo();
      
      // Запускаем интервал для отслеживания прогресса
      if (!progressIntervalRef.current) {
        progressIntervalRef.current = setInterval(() => {
          if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            const currentTime = playerRef.current.getCurrentTime() || 0;
            const duration = playerRef.current.getDuration() || 0;
            
            if (onProgress) {
              onProgress(currentTime, duration);
            }
          }
        }, 1000);
      }
    }
    
    if (onReady) {
      onReady();
    }
  };
  
  // Обработчик изменения состояния плеера
  const handlePlayerStateChange = (event: any) => {
    if (onStateChange) {
      onStateChange(event.data);
    }
    
    // Если видео закончилось
    if (event.data === window.YT.PlayerState.ENDED) {
      if (onEnd) {
        onEnd();
      }
      
      // Останавливаем интервал для отслеживания прогресса
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  };
  
  // Обработчик ошибок плеера
  const handlePlayerError = (event: any) => {
    if (onError) {
      onError(event.data);
    }
    console.error('YouTube Player Error:', event.data);
  };
  
  return (
    <div style={{ position: 'fixed', bottom: '-9999px', left: '-9999px' }}>
      <div ref={containerRef} id={`youtube-player-${videoId}`} />
    </div>
  );
});

export default YouTubePlayer; 