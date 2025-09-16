import { Component, createSignal, onMount } from 'solid-js';
import { useStore } from './store';
import CameraCapture from './components/Camera/CameraCapture';
import TourViewer from './components/Tour/TourViewer';
import AISuggestions from './components/AI/AISuggestions';
import LoadingSpinner from './components/UI/LoadingSpinner';
import { initializeApp } from './services/storage/indexedDB';

const App: Component = () => {
  const { state, setState } = useStore();
  const [isInitialized, setIsInitialized] = createSignal(false);

  onMount(async () => {
    try {
      // Инициализация базы данных и загрузка сохраненных данных
      await initializeApp();
      
      // Проверка поддержки необходимых API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setState('error', 'Ваш браузер не поддерживает доступ к камере');
        return;
      }
      
      // Проверка поддержки гироскопа
      if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation, true);
      }
      
      setIsInitialized(true);
      
      // Онлайн-подсказка
      console.log('Добро пожаловать в TourForge Ai! Для начала работы нажмите "Снять панораму" и следуйте инструкциям.');
    } catch (error) {
      console.error('Ошибка инициализации приложения:', error);
      setState('error', 'Не удалось инициализировать приложение');
    }
  });

  const handleOrientation = (event) => {
    setState('deviceOrientation', {
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma
    });
  };

  return (
    <div class="app">
      <header class="app-header">
        <h1>TourForge Ai</h1>
        <p>Создавайте immersive 3D туры с помощью искусственного интеллекта</p>
      </header>
      
      <main class="app-main">
        {!isInitialized() ? (
          <LoadingSpinner message="Инициализация приложения..." />
        ) : state.error ? (
          <div class="error-state">
            <h2>Произошла ошибка</h2>
            <p>{state.error}</p>
            <button onclick={() => window.location.reload()}>Перезагрузить</button>
          </div>
        ) : state.currentView === 'tour' ? (
          <TourViewer />
        ) : (
          <div class="capture-mode">
            <CameraCapture />
            <AISuggestions />
          </div>
        )}
      </main>
      
      <footer class="app-footer">
        <p>Нужна помощь? Следуйте подсказкам на экране.</p>
      </footer>
    </div>
  );
};

export default App;
