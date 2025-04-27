import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlay, FaHeadphones, FaLightbulb, FaWaveSquare, FaMusic, FaArrowRight, FaRocket } from 'react-icons/fa';
import { MdOutlineLyrics } from 'react-icons/md';
import { HiAnnotation, HiUserGroup } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesArray = useRef<Array<{
    x: number; 
    y: number; 
    size: number; 
    speedX: number; 
    speedY: number; 
    color: string;
    alpha: number;
  }>>([]);
  
  // Перенаправление авторизованных пользователей на главную страницу
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Отслеживание скролла для анимаций
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Анимация фоновых частиц
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    // Устанавливаем размеры канваса равными размеру окна
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(); // Пересоздаем частицы при изменении размера
    };

    // Инициализация массива частиц
    const initParticles = () => {
      particlesArray.current = [];
      const numberOfParticles = Math.floor(canvas.width * canvas.height / 9000);
      
      for (let i = 0; i < numberOfParticles; i++) {
        const size = Math.random() * 2 + 0.1;
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const speedX = Math.random() * 0.2 - 0.1;
        const speedY = Math.random() * 0.2 - 0.1;
        const alpha = Math.random() * 0.8 + 0.2;
        
        // Выбираем случайный цвет из набора космических оттенков
        const colors = [
          '65, 105, 225',  // Royal Blue
          '100, 149, 237', // Cornflower Blue
          '123, 104, 238', // Medium Slate Blue
          '138, 43, 226',  // Blue Violet
          '30, 144, 255',  // Dodger Blue
          '0, 191, 255'    // Deep Sky Blue
        ];
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        particlesArray.current.push({
          x, y, size, speedX, speedY, color, alpha
        });
      }
    };

    // Обновление и отрисовка частиц
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Обновляем и рисуем каждую частицу
      particlesArray.current.forEach(particle => {
        // Обновляем положение
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Возвращаем частицы в пределы экрана
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX = -particle.speedX;
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY = -particle.speedY;
        }
        
        // Рисуем частицу
        ctx.beginPath();
        ctx.fillStyle = `rgba(${particle.color}, ${particle.alpha})`;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };

    // Инициализируем размеры и создаем частицы
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Запускаем анимацию
    animate();

    // Очищаем при размонтировании
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Расчет параллакс-эффекта для героя
  const calculateParallax = (multiplier: number = 0.5) => {
    return { transform: `translateY(${scrollPosition * multiplier}px)` };
  };

  return (
    <div className="landing-page">
      <canvas 
        ref={canvasRef} 
        className="particle-background"
      />
      
      {/* Шапка лендинга */}
      <header className="landing-header">
        <div className="landing-logo">
          <img src="/logo.png" alt="BlinkMusic Logo" />
          
        </div>
        <nav className="landing-nav">
          <ul>
            <li><a href="#features">Возможности</a></li>
            <li><a href="#experience">Опыт</a></li>
            <li><a href="#testimonials">Отзывы</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </nav>
        <div className="landing-actions">
          <Link to="/login" className="login-btn">Войти</Link>
          <Link to="/register" className="register-btn">Регистрация</Link>
        </div>
      </header>
      
      {/* Основная часть */}
      <main>
        {/* Герой-секция */}
        <section className="hero-section" ref={heroRef}>
          <div className="hero-content">
            <h1 style={calculateParallax(0.3)}>
              Музыка в космическом измерении
            </h1>
            <p style={calculateParallax(0.4)}>
              Погрузитесь в мир музыки с иммерсивной визуализацией, синхронизированными текстами и AI-аннотациями
            </p>
            <div className="hero-buttons" style={calculateParallax(0.5)}>
              <Link to="/register" className="primary-btn">
                Начать бесплатно
                <FaRocket className="btn-icon" />
              </Link>
              <a href="#demo" className="secondary-btn">
                Смотреть демо
                <FaPlay className="btn-icon" />
              </a>
            </div>
          </div>
          <div className="hero-image" style={calculateParallax(0.2)}>
            <img src="/landing/hero-screenshot.svg" alt="BlinkMusic Interface" />
            <div className="hero-glow"></div>
          </div>
        </section>
        
        {/* Секция с особенностями */}
        <section className="features-section" id="features">
          <div className="section-header">
            <h2>Уникальные возможности</h2>
            <p>Откройте для себя новый способ взаимодействия с музыкой</p>
          </div>
          
          <div className="feature-cards">
            <div className="feature-card">
              <div className="feature-icon">
                <FaWaveSquare />
              </div>
              <h3>Волновая визуализация</h3>
              <p>Настраиваемая визуализация аудио в реальном времени, которая реагирует на каждый бит и ноту</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <MdOutlineLyrics />
              </div>
              <h3>Синхронизированные тексты</h3>
              <p>Тексты песен, идеально согласованные с музыкой с подсветкой активной строки</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <HiAnnotation />
              </div>
              <h3>AI-аннотации</h3>
              <p>Интерактивные аннотации с объяснением смысла текста, созданные с помощью искусственного интеллекта</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FaHeadphones />
              </div>
              <h3>Высокое качество звука</h3>
              <p>Кристально чистый звук в высоком качестве для максимального музыкального опыта</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FaLightbulb />
              </div>
              <h3>Персонализация</h3>
              <p>Настройте свой музыкальный опыт с индивидуальными рекомендациями и плейлистами</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <HiUserGroup />
              </div>
              <h3>Социальные функции</h3>
              <p>Делитесь любимыми песнями, плейлистами и интерпретациями с друзьями</p>
            </div>
          </div>
        </section>
        
        {/* Секция с демонстрацией */}
        <section className="demo-section" id="demo">
          <div className="section-header">
            <h2>Испытайте BlinkMusic</h2>
            <p>Мы создали музыкальный опыт, который можно не только услышать, но и увидеть</p>
          </div>
          
          <div className="demo-content">
            <div className="demo-screens">
              <img 
                src="/landing/main-page.svg" 
                alt="BlinkMusic Demo" 
                className="demo-screen-main" 
              />
              <img 
                src="/landing/lyrics-screenshot.svg" 
                alt="BlinkMusic Lyrics" 
                className="demo-screen-lyrics" 
              />
              <img 
                src="/landing/albums-page.svg" 
                alt="BlinkMusic Albums" 
                className="demo-screen-albums" 
              />
            </div>
            
            <div className="demo-features">
              <div className="demo-feature">
                <span className="demo-feature-number">01</span>
                <h3>Личная музыкальная волна</h3>
                <p>Уникальная визуализация звука, которая адаптируется под ваше настроение</p>
              </div>
              
              <div className="demo-feature">
                <span className="demo-feature-number">02</span>
                <h3>Реактивные тексты песен</h3>
                <p>Текст песни, который следует за музыкой с красивыми анимированными переходами</p>
              </div>
              
              <div className="demo-feature">
                <span className="demo-feature-number">03</span>
                <h3>Объяснение смысла текста</h3>
                <p>Понимайте любимые песни глубже благодаря аннотациям от искусственного интеллекта</p>
              </div>
              
              <Link to="/register" className="demo-cta-btn">
                Попробовать сейчас
                <FaArrowRight className="btn-icon" />
              </Link>
            </div>
          </div>
        </section>
        
        {/* Секция "Отзывы" */}
        <section className="testimonials-section" id="testimonials">
          <div className="section-header">
            <h2>Что говорят пользователи</h2>
            <p>Отзывы наших музыкальных исследователей</p>
          </div>
          
          <div className="testimonials-container">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"BlinkMusic полностью изменил мое восприятие музыки. Видеть, как песня оживает через визуальную волну, делает каждый трек особенным."</p>
                <div className="testimonial-author">
                  <div className="author-avatar">АК</div>
                  <div className="author-info">
                    <h4>Алексей К.</h4>
                    <span>Музыкальный продюсер</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"Синхронизированные тексты и аннотации помогли мне открыть для себя новые смыслы в песнях, которые я слушаю уже много лет."</p>
                <div className="testimonial-author">
                  <div className="author-avatar">МС</div>
                  <div className="author-info">
                    <h4>Мария С.</h4>
                    <span>Студент</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"Функция визуализации волны — это именно то, чего мне всегда не хватало в других музыкальных приложениях. Теперь я могу не только слушать, но и видеть музыку."</p>
                <div className="testimonial-author">
                  <div className="author-avatar">ИП</div>
                  <div className="author-info">
                    <h4>Игорь П.</h4>
                    <span>Аудиофил</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Секция FAQ */}
        <section className="faq-section" id="faq">
          <div className="section-header">
            <h2>Часто задаваемые вопросы</h2>
            <p>Ответы на популярные вопросы о BlinkMusic</p>
          </div>
          
          <div className="faq-container">
            <div className="faq-item">
              <h3>Как работает визуализация волны?</h3>
              <p>Наша запатентованная технология анализирует аудио-данные в реальном времени и преобразует частоты, ритм и другие характеристики звука в красивую визуальную анимацию, которая синхронизирована с музыкой.</p>
            </div>
            
            <div className="faq-item">
              <h3>Бесплатно ли пользоваться BlinkMusic?</h3>
              <p>Да, основные функции BlinkMusic доступны бесплатно. Мы также предлагаем премиум-подписку с доступом к эксклюзивным функциям визуализации, отсутствием рекламы и поддержкой высокого качества звука.</p>
            </div>
            
            <div className="faq-item">
              <h3>Могу ли я использовать BlinkMusic без интернета?</h3>
              <p>Да, вы можете скачать треки для прослушивания в офлайн-режиме. Все визуальные эффекты и синхронизированные тексты будут работать даже без подключения к интернету.</p>
            </div>
            
            <div className="faq-item">
              <h3>Как создаются аннотации к песням?</h3>
              <p>Мы используем технологии искусственного интеллекта для анализа текстов песен и создания содержательных аннотаций. Наша система постоянно обучается и улучшается благодаря обратной связи от сообщества.</p>
            </div>
            
            <div className="faq-item">
              <h3>На каких устройствах доступен BlinkMusic?</h3>
              <p>BlinkMusic доступен в веб-версии, а также как нативное приложение для iOS и Android. Мы обеспечиваем одинаково высокий уровень качества и функциональности на всех платформах.</p>
            </div>
            
            <div className="faq-item">
              <h3>Могу ли я делиться плейлистами с друзьями?</h3>
              <p>Да, BlinkMusic имеет встроенные социальные функции, которые позволяют вам делиться плейлистами, отдельными треками и даже вашими настройками визуализации с друзьями и сообществом.</p>
            </div>
          </div>
        </section>
        
        {/* CTA в конце страницы */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>Готовы начать музыкальное путешествие?</h2>
            <p>Присоединяйтесь к тысячам пользователей, которые уже открыли для себя новый способ наслаждаться музыкой</p>
            <Link to="/register" className="cta-btn">
              Создать аккаунт бесплатно
              <FaRocket className="btn-icon" />
            </Link>
          </div>
          <div className="cta-image">
            <FaMusic className="music-icon-1" />
            <FaMusic className="music-icon-2" />
            <FaMusic className="music-icon-3" />
          </div>
        </section>
      </main>
      
      {/* Подвал */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/logo.svg" alt="BlinkMusic Logo" />
            <span>BlinkMusic</span>
          </div>
          
          <div className="footer-links">
            <div className="footer-column">
              <h3>Компания</h3>
              <ul>
                <li><a href="#">О нас</a></li>
                <li><a href="#">Карьера</a></li>
                <li><a href="#">Блог</a></li>
                <li><a href="#">Контакты</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h3>Продукт</h3>
              <ul>
                <li><a href="#">Функции</a></li>
                <li><a href="#">Премиум</a></li>
                <li><a href="#">Мобильное приложение</a></li>
                <li><a href="#">Партнерская программа</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h3>Ресурсы</h3>
              <ul>
                <li><a href="#">Поддержка</a></li>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Документация</a></li>
                <li><a href="#">Сообщество</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h3>Юридическая информация</h3>
              <ul>
                <li><a href="#">Условия использования</a></li>
                <li><a href="#">Политика конфиденциальности</a></li>
                <li><a href="#">Правила сообщества</a></li>
                <li><a href="#">Лицензии</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} BlinkMusic. Все права защищены.</p>
          <div className="social-links">
            <a href="#" aria-label="Facebook">Facebook</a>
            <a href="#" aria-label="Twitter">Twitter</a>
            <a href="#" aria-label="Instagram">Instagram</a>
            <a href="#" aria-label="GitHub">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 