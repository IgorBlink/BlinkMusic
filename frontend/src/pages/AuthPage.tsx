import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope, FaGoogle, FaApple, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [starsCanvas, setStarsCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, error: authError, isAuthenticated } = useAuth();
  
  // Определяем, куда перенаправить пользователя после авторизации
  const from = (location.state as any)?.from?.pathname || '/';

  // Проверяем, авторизован ли пользователь, и если да, перенаправляем его
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Инициализируем анимацию звезд
  useEffect(() => {
    if (starsCanvas) {
      const context = starsCanvas.getContext('2d');
      if (!context) return;
      
      let width = window.innerWidth;
      let height = window.innerHeight;
      
      starsCanvas.width = width;
      starsCanvas.height = height;
      
      const stars: { x: number; y: number; radius: number; velocity: number; alpha: number }[] = [];
      
      // Create stars
      for (let i = 0; i < 200; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5,
          velocity: Math.random() * 0.05,
          alpha: Math.random()
        });
      }
      
      function drawStars() {
        if (!context) return;
        
        context.clearRect(0, 0, width, height);
        context.fillStyle = '#ffffff';
        
        stars.forEach(star => {
          context.globalAlpha = star.alpha;
          context.beginPath();
          context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          context.fill();
          
          // Move stars down slightly
          star.y += star.velocity;
          
          // Reset star when it goes off screen
          if (star.y > height) {
            star.y = 0;
            star.x = Math.random() * width;
          }
        });
        
        requestAnimationFrame(drawStars);
      }
      
      drawStars();
      
      const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        starsCanvas.width = width;
        starsCanvas.height = height;
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [starsCanvas]);

  // Обрабатываем изменения в полях формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value
    });
    
    // Сбрасываем ошибку при вводе
    if (error) {
      setError(null);
    }
  };

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        // Авторизация
        await login({
          emailOrUsername: formState.email,
          password: formState.password
        });
      } else {
        // Регистрация
        await register({
          username: formState.username,
          email: formState.email,
          password: formState.password
        });
      }
      
      // После успешной авторизации/регистрации пользователь будет автоматически 
      // перенаправлен благодаря useEffect выше
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.response?.data?.message || 
        (isLogin ? 'Ошибка входа. Проверьте данные и попробуйте снова.' : 
                  'Ошибка регистрации. Возможно, пользователь уже существует.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Переключение между формами входа и регистрации
  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  // Возврат на лендинговую страницу
  const goToLanding = () => {
    navigate('/landing');
  };

  return (
    <div className="auth-page">
      <canvas 
        ref={(canvas) => setStarsCanvas(canvas)} 
        className="stars-background"
      />
      
      <div className="auth-nebula"></div>
      
      <button className="back-to-landing-btn" onClick={goToLanding}>
        <FaArrowLeft />
        <span>На главную</span>
      </button>
      
      <div className="auth-container">
        <div className="auth-logo">
          <img src="/logo.svg" alt="BlinkMusic Logo" />
        </div>
        
        <div className="auth-form-wrapper">
          <div className="form-switcher">
            <button 
              className={isLogin ? 'active' : ''}
              onClick={() => setIsLogin(true)}
              type="button"
            >
              Вход
            </button>
            <button 
              className={!isLogin ? 'active' : ''}
              onClick={() => setIsLogin(false)}
              type="button"
            >
              Регистрация
            </button>
          </div>
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <h2>{isLogin ? 'Добро пожаловать' : 'Создайте аккаунт'}</h2>
            <p className="form-subtitle">
              {isLogin 
                ? '' 
                : 'Присоединяйтесь к нашей музыкальной вселенной'}
            </p>
            
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}
            
            {!isLogin && (
              <div className="form-group">
                <div className="input-icon">
                  <FaUser />
                </div>
                <input
                  type="text"
                  name="username"
                  placeholder="Имя пользователя"
                  value={formState.username}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
            )}
            
            <div className="form-group">
              <div className="input-icon">
                <FaEnvelope />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formState.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <div className="input-icon">
                <FaLock />
              </div>
              <input
                type="password"
                name="password"
                placeholder="Пароль"
                value={formState.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            
            {isLogin && (
              <div className="forgot-password">
                <Link to="/forgot-password">Забыли пароль?</Link>
              </div>
            )}
            
            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading
                ? 'Загрузка...'
                : isLogin ? 'Войти' : 'Зарегистрироваться'
              }
            </button>
            
            <div className="auth-divider">
              <span>или</span>
            </div>
            
            <div className="social-auth">
              <button type="button" className="social-btn google" disabled={isLoading}>
                <FaGoogle />
                <span>{isLogin ? 'Войти' : 'Регистрация'} с Google</span>
              </button>
              <button type="button" className="social-btn apple" disabled={isLoading}>
                <FaApple />
                <span>{isLogin ? 'Войти' : 'Регистрация'} с Apple</span>
              </button>
            </div>
            
            <div className="auth-footer">
              <p>
                {isLogin 
                  ? 'Нет аккаунта?' 
                  : 'Уже есть аккаунт?'}
                <button 
                  type="button" 
                  className="toggle-form-btn"
                  onClick={toggleForm}
                  disabled={isLoading}
                >
                  {isLogin ? 'Зарегистрироваться' : 'Войти'}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 