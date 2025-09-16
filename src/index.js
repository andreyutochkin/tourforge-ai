import { render } from 'solid-js/web';
import { Router } from 'solid-app-router';
import App from './App';
import './styles/main.css';
import './styles/responsive.css';

// Регистрируем Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Инициализация приложения
render(() => (
  <Router>
    <App />
  </Router>
), document.getElementById('app'));

// Скрываем экран загрузки после полной загрузки приложения
window.addEventListener('load', () => {
  const loadingScreen = document.querySelector('.loading-screen');
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.style.opacity = '0';
      setTimeout(() => loadingScreen.remove(), 500);
    }, 1000);
  }
});
