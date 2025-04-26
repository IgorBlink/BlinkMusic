import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlay, FaPause } from 'react-icons/fa';
import { IoMdArrowBack } from 'react-icons/io';
import { BiInfoCircle } from 'react-icons/bi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { MdOutlineClose } from 'react-icons/md';
import { usePlayer } from '../context/PlayerContext';
import { tracksApi } from '../services/api';
import api from '../api/axios';
import { LyricLine } from '../types/music';
import './TrackPage.css';

const testPicture = '/test-picture.png';

// Запрос для получения текста песни по YouTube URL
const getLyricsFromYoutube = async (youtubeUrl: string): Promise<LyricLine[]> => {
  try {
    const response = await api.get(`/lyrics/youtube?url=${encodeURIComponent(youtubeUrl)}&timestamped=true`);
    
    if (response.data && response.data.success && Array.isArray(response.data.lyrics)) {
      console.log('Текст песни успешно получен с YouTube');
      return response.data.lyrics;
    } else {
      console.error('Неверный формат ответа от API:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Ошибка при получении текста песни:', error);
    return [];
  }
};

const getAnnotationFromAI = async (trackId: string, lineId: string, lyric: string): Promise<string> => {
  try {
    // Пытаемся получить аннотацию с сервера
    const annotation = await tracksApi.getAnnotation(trackId, lineId);
    return annotation.content;
  } catch (error) {
    console.log('Не удалось получить аннотацию с сервера, используем временный демо-ответ');
    
    // Временный демо-фолбэк
    return new Promise((resolve) => {
      setTimeout(() => {
        const annotationExamples: {[key: string]: string} = {
          "Этой ночью чьё-то сердце от любви горит": "Метафора сильных эмоциональных переживаний, связанных с любовью. Образ горящего сердца часто используется для описания страсти и сильных чувств.",
          "Всё внутри (но мне это ни о чём не говорит), на счёт три": "Выражает внутренний конфликт между эмоциями и рациональным мышлением. Фраза 'на счёт три' означает решительное действие после короткого обратного отсчёта.",
        };
        
        const annotation = annotationExamples[lyric] || 
          `Эта строка может интерпретироваться как ${lyric.length < 20 ? 'краткое выражение эмоций' : 'развернутая метафора чувств'}, передающая настроение меланхолии и романтической тоски.`;
        
        resolve(annotation);
      }, 1500);
    });
  }
};

const TrackPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, togglePlay, progress, setProgress, loadTrackById } = usePlayer();
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState<number>(0);
  const [loadingAnnotation, setLoadingAnnotation] = useState<number | null>(null);
  const [showAnnotation, setShowAnnotation] = useState<number | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState<boolean>(false);
  const [scrollTimeout, setScrollTimeout] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const progressBarRef = useRef<HTMLDivElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lyricsContentRef = useRef<HTMLDivElement>(null);
  const lyricRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pageRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = useRef<boolean>(true);

  // Загрузка трека и его текста
  useEffect(() => {
    const fetchTrackData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Загружаем трек через PlayerContext
        const track = await loadTrackById(id);
        
        if (!track) {
          setError('Трек не найден');
          setIsLoading(false);
          return;
        }
        
        // Получаем текст песни из YouTube URL, если доступен
        if (track.audioUrl && track.audioUrl.includes('youtube.com')) {
          try {
            const lyricsData = await getLyricsFromYoutube(track.audioUrl);
            if (lyricsData && lyricsData.length > 0) {
              setLyrics(lyricsData);
            } else {
              console.log('API вернул пустой текст песни');
              setLyrics([]);
            }
          } catch (lyricsError) {
            console.error('Ошибка при загрузке текста песни:', lyricsError);
            setLyrics([]);
          }
        } else {
          console.log('Трек не содержит ссылку на YouTube');
          setLyrics([]);
        }
        
      } catch (error) {
        console.error('Ошибка при загрузке трека:', error);
        setError('Не удалось загрузить трек. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTrackData();
    
    return () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [id, loadTrackById, scrollTimeout]);

  useEffect(() => {
    lyricRefs.current = Array(lyrics.length).fill(null);
  }, [lyrics.length]);

  useEffect(() => {
    if (!currentTrack || isUserScrolling || lyrics.length === 0) return;

    const newActiveIndex = lyrics.findIndex(
      line => progress >= line.startTime && progress < line.endTime
    );

    if (newActiveIndex !== -1 && newActiveIndex !== activeLyricIndex) {
      setActiveLyricIndex(newActiveIndex);
      
      if (isAutoScrollEnabled.current && !isUserScrolling) {
        const activeElement = lyricRefs.current[newActiveIndex];
        if (activeElement) {
          activeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }

    if (newActiveIndex !== -1) {
      const activeLine = lyrics[newActiveIndex];
      const lineStart = activeLine.startTime;
      const lineDuration = activeLine.endTime - activeLine.startTime;
      const lineProgress = ((progress - lineStart) / lineDuration) * 100;
      
      const activeElement = lyricRefs.current[newActiveIndex];
      if (activeElement) {
        activeElement.style.setProperty('--line-progress', `${Math.min(100, Math.max(0, lineProgress))}%`);
      }
    }
  }, [progress, lyrics, activeLyricIndex, currentTrack, isUserScrolling]);

  const handleScroll = useCallback(() => {
    if (!lyricsContainerRef.current || !isAutoScrollEnabled.current) return;
    
    setIsUserScrolling(true);
    
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    
    const timeout = window.setTimeout(() => {
      setIsUserScrolling(false);
    }, 500);
    
    setScrollTimeout(timeout);
    
    const containerRect = lyricsContainerRef.current.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;
    
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    lyricRefs.current.forEach((ref, index) => {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        const lineCenter = rect.top + rect.height / 2;
        const distance = Math.abs(lineCenter - containerCenter);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    });
    
    if (closestIndex !== activeLyricIndex) {
      setActiveLyricIndex(closestIndex);
      
      const selectedLine = lyrics[closestIndex];
      setProgress(selectedLine.startTime);
    }
  }, [activeLyricIndex, lyrics, scrollTimeout, setProgress, isUserScrolling]);

  useEffect(() => {
    const lyricsContainer = lyricsContainerRef.current;
    if (lyricsContainer) {
      lyricsContainer.addEventListener('scroll', handleScroll);
      
      return () => {
        lyricsContainer.removeEventListener('scroll', handleScroll);
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
      };
    }
  }, [handleScroll, scrollTimeout]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleLyricClick = (index: number) => {
    if (!currentTrack || lyrics.length === 0) return;
    
    setIsUserScrolling(true);
    
    const clickedLine = lyrics[index];
    setProgress(clickedLine.startTime);
    setActiveLyricIndex(index);
    
    const selectedElement = lyricRefs.current[index];
    if (selectedElement) {
      selectedElement.style.setProperty('--line-progress', '0%');
      
      selectedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      
      setTimeout(() => {
        setIsUserScrolling(false);
      }, 600);
    }
  };

  const toggleAutoScroll = () => {
    isAutoScrollEnabled.current = !isAutoScrollEnabled.current;
    
    if (isAutoScrollEnabled.current) {
      const activeElement = lyricRefs.current[activeLyricIndex];
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  };

  const handleRequestAnnotation = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (showAnnotation === index) {
      setShowAnnotation(null);
      return;
    }
    
    if (lyrics[index].annotationId) {
      setShowAnnotation(index);
      return;
    }
    
    setLoadingAnnotation(index);
    setShowAnnotation(index);
    
    try {
      if (!id) throw new Error('ID трека не определен');
      
      const annotation = await getAnnotationFromAI(
        id, 
        lyrics[index].id, 
        lyrics[index].text
      );
      
      const updatedLyrics = [...lyrics];
      updatedLyrics[index] = {
        ...updatedLyrics[index],
        annotationId: `temp-${index}`,
        annotation: annotation
      };
      
      setLyrics(updatedLyrics);
    } catch (error) {
      console.error('Ошибка при получении аннотации:', error);
    } finally {
      setLoadingAnnotation(null);
    }
  };

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

  const handleCloseAnnotation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAnnotation(null);
  };

  const getLyricLineClass = (index: number) => {
    let classes = 'lyric-line';
    
    if (index === activeLyricIndex) classes += ' active';
    if (index === activeLyricIndex + 1) classes += ' next-active';
    if (index === activeLyricIndex - 1) classes += ' prev-active';
    if (showAnnotation === index) classes += ' has-annotation';
    
    return classes;
  };

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
    <div className="track-page" ref={pageRef}>
      <div className="back-button-container">
        <button onClick={handleBack} className="back-button">
          <IoMdArrowBack /> Назад
        </button>
      </div>

      <div className="track-content">
        <div className="track-cover-container">
          <div className="track-cover-wrapper">
            <img 
              src={currentTrack.coverUrl || currentTrack.cover || testPicture} 
              alt={`${currentTrack.title} - ${currentTrack.artist}`} 
              className="track-page-cover"
              onError={(e) => {
                // Если не удалось загрузить изображение, используем запасное
                (e.target as HTMLImageElement).src = testPicture;
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
        </div>

        {isLoading ? (
          <div className="loading-lyrics">
            <div className="loading-spinner"></div>
            <p>Загрузка текста песни...</p>
          </div>
        ) : lyrics.length === 0 ? (
          <div className="no-lyrics-message">
            <p>Текст песни не найден</p>
          </div>
        ) : (
          <div className="lyrics-container" ref={lyricsContainerRef}>
            <div className="lyrics-header">
              <h3>Текст песни</h3>
              <div className="lyrics-controls">
                <button 
                  className={`auto-scroll-toggle ${isAutoScrollEnabled.current ? 'active' : ''}`}
                  onClick={toggleAutoScroll}
                >
                  {isAutoScrollEnabled.current ? 'Автоскролл: вкл' : 'Автоскролл: выкл'}
                </button>
                <div className="lyrics-info">
                  <span>Нажмите на <BiInfoCircle /> для получения аннотации к строке</span>
                </div>
              </div>
            </div>
            
            <div className="lyrics-content">
              {lyrics.map((line, index) => (
                <div 
                  key={index}
                  className={getLyricLineClass(index)}
                  onClick={() => handleLyricClick(index)}
                  ref={(el) => { lyricRefs.current[index] = el; }}
                >
                  <div className="lyric-line-wrapper">
                    <p className="lyrics-text">
                      {line.text}
                    </p>
                    <button 
                      className="annotation-button" 
                      onClick={(e) => handleRequestAnnotation(index, e)}
                      aria-label="Показать аннотацию"
                    >
                      {loadingAnnotation === index ? (
                        <AiOutlineLoading3Quarters className="loading-icon" />
                      ) : (
                        <BiInfoCircle />
                      )}
                    </button>
                  </div>
                  
                  {showAnnotation === index && (
                    <div className="lyric-annotation">
                      <div className="annotation-header">
                        <h4>Аннотация</h4>
                        <button 
                          className="close-annotation" 
                          onClick={handleCloseAnnotation}
                          aria-label="Закрыть аннотацию"
                        >
                          <MdOutlineClose />
                        </button>
                      </div>
                      <div className="annotation-content">
                        {lyrics[index].annotation ? (
                          <p>{lyrics[index].annotation}</p>
                        ) : (
                          <p className="loading-text">Получаем аннотацию...</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div 
              className={`lyrics-scroll-indicator ${isUserScrolling ? 'visible' : ''}`}
              style={{ 
                height: lyricsContainerRef.current 
                  ? `${Math.min(lyricsContainerRef.current.scrollTop / 10, 80)}%` 
                  : '0%' 
              }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackPage;