import { useEffect, useState, useRef} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlay, FaPause } from 'react-icons/fa';
import { IoMdArrowBack } from 'react-icons/io';
import { BiInfoCircle } from 'react-icons/bi';

import { usePlayer } from '../context/PlayerContext';

import { LyricLine } from '../types/music';
import axios from 'axios';
import './TrackPage.css';

// Кэш для хранения текстов песен по URL, чтобы избежать повторных запросов
const lyricsCache: Record<string, LyricLine[]> = {};

// Константа для опережения активации строки (в секундах)
const LYRIC_ADVANCE_TIME = 1;

// Функция для получения лирики с YouTube по URL
const getLyricsFromYoutube = async (youtubeUrl: string): Promise<LyricLine[]> => {
  // Проверяем, есть ли текст уже в кэше
  if (lyricsCache[youtubeUrl]) {
    console.log('Используем кэшированный текст песни');
    return lyricsCache[youtubeUrl];
  }
  
  try {
    console.log('Запрос текста песни для URL:', youtubeUrl);
    const response = await axios.get(
      `http://localhost:5000/api/lyrics/youtube?url=${encodeURIComponent(youtubeUrl)}&timestamped=true`
    );
    
    if (response.data && response.data.success && Array.isArray(response.data.lyrics)) {
      console.log('Текст песни успешно получен из YouTube');
      // Преобразуем время из миллисекунд в секунды для совместимости с нашим плеером
      const lyrics = response.data.lyrics.map((line: any) => ({
        id: `line-${Math.random().toString(36).substring(2, 9)}`,
        text: line.text.replace(/&#39;/g, "'").replace(/&amp;/g, "&"),
        startTime: line.startTime / 1000,
        endTime: line.endTime / 1000
      }));
      
      // Сохраняем в кэш
      lyricsCache[youtubeUrl] = lyrics;
      
      return lyrics;
    } else {
      console.error('Неверный формат ответа от API:', response.data);
      return getPlaceholderLyrics();
    }
  } catch (error) {
    console.error('Ошибка при получении текста песни:', error);
    return getPlaceholderLyrics();
  }
};

// Упрощенная функция получения аннотации
// const getAnnotation = async (
//   lyricLine: string,
//   artist: string,
//   trackTitle: string
// ): Promise<string> => {
//   try {
//     console.log('Отправка запроса на получение аннотации:', { lyricLine, artist, trackTitle });
    
//     // Отправляем запрос на сервер
//     const response = await axios.post('http://localhost:5000/api/annotations/explain', {
//       lyricLine,
//       artist,
//       trackTitle
//     });
    
//     console.log('Получен ответ от сервера:', response.data);
    
//     // Просто возвращаем текст аннотации, заменяя переносы строк
//     if (response.data?.success && response.data?.annotation?.text) {
//       return response.data.annotation.text.replace(/\n/g, '<br>');
//     }
    
//     return 'Не удалось получить аннотацию для этой строки.';
//   } catch (error) {
//     console.error('Ошибка при получении аннотации:', error);
//     return 'Произошла ошибка при запросе аннотации.';
//   }
// };

// Плейсхолдер для лирики, если API недоступно
const getPlaceholderLyrics = (): LyricLine[] => {
  return [
    { id: '1', text: 'Текст песни временно недоступен', startTime: 0, endTime: 5 },
    { id: '2', text: 'Попробуйте обновить страницу позже', startTime: 5, endTime: 10 },
    { id: '3', text: 'Или выберите другой трек', startTime: 10, endTime: 15 },
  ];
};

const TrackPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, togglePlay, progress, setProgress, loadTrackById } = usePlayer();
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState<number>(0);
  const [showAnnotation, setShowAnnotation] = useState<number | null>(null);
  const [annotationContent, setAnnotationContent] = useState<string>('Загрузка аннотации...');
  const [isAutoScroll, setIsAutoScroll] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const progressBarRef = useRef<HTMLDivElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lyricRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Загрузка трека и текста песни
  useEffect(() => {
    const fetchTrackData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        let trackToUse = currentTrack;
        
        // Проверяем, есть ли трек уже в PlayerContext
        if (currentTrack && (currentTrack.id.toString() === id || 
                             (currentTrack.originalData && 
                              (currentTrack.originalData.sourceId === id || 
                               `${currentTrack.originalData.artist}-${currentTrack.originalData.title}`.replace(/\s+/g, '-').toLowerCase() === id)))) {
          console.log('Используем уже загруженный трек:', currentTrack.title);
          // Трек уже загружен, используем его
        } else {
          // Загружаем трек через PlayerContext
          const track = await loadTrackById(id);
          
          if (!track) {
            setError('Трек не найден');
            setIsLoading(false);
            return;
          }
          
          trackToUse = track;
        }
        
        // Получаем текст песни
        if (trackToUse && trackToUse.audioUrl && trackToUse.audioUrl.includes('youtube.com')) {
          const lyricsData = await getLyricsFromYoutube(trackToUse.audioUrl);
          setLyrics(lyricsData);
        } else {
          setLyrics(getPlaceholderLyrics());
        }
        
      } catch (error) {
        console.error('Ошибка при загрузке трека:', error);
        setError('Не удалось загрузить трек. Пожалуйста, попробуйте позже.');
        setLyrics(getPlaceholderLyrics());
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTrackData();
  }, [id, loadTrackById, currentTrack]);

  // Инициализация массива ссылок на элементы лирики
  useEffect(() => {
    lyricRefs.current = Array(lyrics.length).fill(null);
  }, [lyrics.length]);

  // Добавим эффект для начального позиционирования активной строки
  useEffect(() => {
    // Когда лирика загружена и активная строка определена
    if (lyrics.length > 0 && activeLyricIndex >= 0 && isAutoScroll) {
      // Создаем небольшую задержку для правильного рендеринга
      const timer = setTimeout(() => {
        const activeElement = lyricRefs.current[activeLyricIndex];
        if (activeElement) {
          // Центрируем активную строку
          activeElement.scrollIntoView({
            behavior: 'auto', // Используем 'auto' вместо 'smooth' для начального позиционирования
            block: 'center'
          });
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [lyrics.length, activeLyricIndex, isAutoScroll]);

  // Обновление активной строки лирики при изменении времени воспроизведения
  // Теперь с опережением на LYRIC_ADVANCE_TIME секунд
  useEffect(() => {
    if (!currentTrack || lyrics.length === 0) return;

    // Находим строку, соответствующую текущему времени проигрывания
    // с учетом времени опережения
    const adjustedProgress = progress + LYRIC_ADVANCE_TIME;
    
    const newActiveIndex = lyrics.findIndex(
      line => adjustedProgress >= line.startTime && adjustedProgress < line.endTime
    );

    // Если нашли подходящую строку и она отличается от текущей активной
    if (newActiveIndex !== -1 && newActiveIndex !== activeLyricIndex) {
      setActiveLyricIndex(newActiveIndex);
      
      // Если автоскролл включен, прокручиваем к активной строке
      if (isAutoScroll) {
        const activeElement = lyricRefs.current[newActiveIndex];
        if (activeElement) {
          // Используем scrollIntoView с опцией center для центрирования
          activeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }
  }, [progress, lyrics, activeLyricIndex, currentTrack, isAutoScroll]);

  // Обработчик клика по строке лирики
  const handleLyricClick = (index: number) => {
    if (!currentTrack || lyrics.length === 0) return;
    
    // Устанавливаем новую активную строку
    setActiveLyricIndex(index);
    
    // Переходим к времени начала этой строки (с учетом опережения)
    const lineStartTime = Math.max(0, lyrics[index].startTime - LYRIC_ADVANCE_TIME);
    setProgress(lineStartTime);
    
    // Если автопрокрутка выключена, включаем ее
    if (!isAutoScroll) {
      setIsAutoScroll(true);
    }
    
    // Прокручиваем к выбранной строке и центрируем её
    const activeElement = lyricRefs.current[index];
    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  // Переключение режима автопрокрутки
  // const toggleAutoScroll = () => {
  //   setIsAutoScroll(!isAutoScroll);
  // };

  // Обработчик для кнопки аннотации - суперпростая реализация
  const handleRequestAnnotation = async (text: string, index: number) => {
    try {
      setAnnotationContent("Загрузка аннотации...");
      setShowAnnotation(index);
      
      console.log("Запрашиваем аннотацию для текста:", text);
      
      if (!currentTrack) return;
      
      // Прямой запрос к API для получения аннотации
      const response = await axios.post('http://localhost:5000/api/annotations/explain', {
        lyricLine: text,
        artist: currentTrack.artist,
        trackTitle: currentTrack.title
      });
      
      console.log("Получен ответ аннотации:", response);
      
      if (response.data?.success && response.data?.annotation?.text) {
        // Более безопасный и правильный способ форматирования текста для dangerouslySetInnerHTML
        // Заменяем переносы строк на тег <br> и обрабатываем специальные символы HTML
        const annotationText = response.data.annotation.text;
        // Преобразуем переносы строк в HTML теги <br>
        const formattedText = annotationText
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0)
          .join('<br>');
        
        console.log("Форматированный текст аннотации:", formattedText);
        
        // Устанавливаем отформатированный текст
        setAnnotationContent(formattedText);
      } else {
        setAnnotationContent("Не удалось получить аннотацию");
        console.error("Ошибка в ответе аннотации:", response);
      }
    } catch (error) {
      console.error("Ошибка при получении аннотации:", error);
      setAnnotationContent("Произошла ошибка при загрузке аннотации");
    }
  };

  // Обработчик для клика по прогресс-бару
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && currentTrack) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickPosition = e.clientX - rect.left;
      const progressBarWidth = rect.width;
      const clickPercentage = clickPosition / progressBarWidth;
      const newProgress = clickPercentage * currentTrack.duration;
      
      setProgress(newProgress);
    }
  };

  // Закрытие аннотации
  const handleCloseAnnotation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAnnotation(null);
  };

  // Определение класса для строки лирики
  const getLyricLineClass = (index: number) => {
    let classes = 'lyric-line';
    
    // Если это активная строка
    if (index === activeLyricIndex) {
      classes += ' active';
    }
    
    // Если это следующая после активной строки
    if (index === activeLyricIndex + 1) {
      classes += ' next-active';
    }
    
    // Если это предыдущая перед активной строкой
    if (index === activeLyricIndex - 1) {
      classes += ' prev-active';
    }
    
    // Если это далеко от активной строки (более 2 строк)
    if (Math.abs(index - activeLyricIndex) > 2) {
      classes += ' far-from-active';
    }
    
    // Если для этой строки есть аннотация
    if (showAnnotation === index) {
      classes += ' has-annotation';
    }
    
    return classes;
  };

  // Форматирование времени в виде MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Обработчик кнопки "Назад"
  const handleBack = () => {
    navigate(-1);
  };

  // Если трек не загружен, показываем сообщение
  if (!currentTrack) {
    return (
      <div className="track-page no-track">
        <div className="back-button-container">
          <button onClick={handleBack} className="back-button">
            <IoMdArrowBack /> Назад
          </button>
        </div>
        <div className="no-track-message">
          <h2>Трек не выбран</h2>
          <p>Выберите трек для прослушивания</p>
        </div>
      </div>
    );
  }

  const progressPercentage = (progress / currentTrack.duration) * 100;

  return (
    <div className="track-page">
      <div className="back-button-container">
        <button onClick={handleBack} className="back-button">
          <IoMdArrowBack /> Назад
        </button>
      </div>

      <div className="track-content">
        <div className="track-cover-container">
          <div className="track-cover-wrapper">
            <img 
              src={currentTrack.coverUrl || currentTrack.cover || '/test-picture.png'} 
              alt={`${currentTrack.title} - ${currentTrack.artist}`} 
              className="track-page-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/test-picture.png';
              }}
            />
          </div>
          
          <div className="track-info-header">
            <div className="track-main-info">
              <h2 className="track-title">{currentTrack.title}</h2>
              <p className="track-artist">{currentTrack.artist}</p>
            </div>
          </div>
          
          <div className="track-progress-container">
            <div className="track-time-current">{formatTime(progress)}</div>
            <div 
              className="track-progress-bar" 
              ref={progressBarRef}
              onClick={handleProgressClick}
            >
              <div 
                className="track-progress-current" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="track-time-total">{formatTime(currentTrack.duration)}</div>
          </div>
          
          <button className="track-play-button" onClick={togglePlay}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
        </div>

        {isLoading ? (
          <div className="loading-lyrics">
            <div className="loading-spinner"></div>
            <p>Загрузка текста песни...</p>
          </div>
        ) : error ? (
          <div className="no-lyrics-message">
            <p>{error}</p>
          </div>
        ) : lyrics.length === 0 ? (
          <div className="no-lyrics-message">
            <p>Текст песни не найден</p>
          </div>
        ) : (
          <div className="lyrics-container" ref={lyricsContainerRef}>
            {/* <div className="lyrics-header">
              <h3>Текст песни</h3>
              <button 
                className={`auto-scroll-toggle ${isAutoScroll ? 'active' : ''}`}
                onClick={toggleAutoScroll}
                title={isAutoScroll ? "Выключить автопрокрутку" : "Включить автопрокрутку"}
              >
                {isAutoScroll ? "Автопрокрутка: Вкл" : "Автопрокрутка: Выкл"}
              </button>
            </div> */}
            
            {/* Индикатор центра экрана */}
            <div className="lyrics-center-indicator"></div>
            
            <div className="lyrics-content">
              {lyrics.map((line, index) => (
                <div 
                  key={line.id || index}
                  className={getLyricLineClass(index)}
                  onClick={() => handleLyricClick(index)}
                  ref={(el) => { lyricRefs.current[index] = el; }}
                >
                  <div className="lyric-line-wrapper">
                    <span className="lyric-time">{formatTime(line.startTime)}</span>
                    <p className="lyrics-text">
                      {line.text}
                    </p>
                    <button 
                      className="annotation-button" 
                      onClick={() => handleRequestAnnotation(line.text, index)}
                      aria-label="Показать аннотацию"
                    >
                      <BiInfoCircle />
                    </button>
                  </div>
                  
                  {showAnnotation === index && (
                    <div className="lyric-annotation">
                      <div className="annotation-header">
                        <h4>Аннотация</h4>
                        <button className="close-annotation" onClick={handleCloseAnnotation}>
                          ✕
                        </button>
                      </div>
                      <div className="annotation-content" 
                        dangerouslySetInnerHTML={{ __html: annotationContent }}
                      ></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackPage;