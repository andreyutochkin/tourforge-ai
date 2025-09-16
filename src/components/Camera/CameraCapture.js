import { Component, createSignal, onCleanup } from 'solid-js';
import { useStore } from '../../store';
import { startCamera, stopCamera, capturePanorama } from '../../services/camera/captureService';
import Button from '../UI/Button';
import CameraPreview from './CameraPreview';

const CameraCapture: Component = () => {
  const { state, setState } = useStore();
  const [isCapturing, setIsCapturing] = createSignal(false);
  let videoRef;

  const handleStartCamera = async () => {
    try {
      const stream = await startCamera();
      if (videoRef) {
        videoRef.srcObject = stream;
        setState('isCameraActive', true);
        setState('error', null);
        
        // Онлайн-подсказка
        console.log('Камера активирована! Наведите на объект и следуйте инструкциям для создания панорамы.');
      }
    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
      setState('error', 'Не удалось включить камеру. Проверьте разрешения.');
    }
  };

  const handleStopCamera = () => {
    stopCamera();
    if (videoRef) {
      videoRef.srcObject = null;
    }
    setState('isCameraActive', false);
  };

  const handleCapture = async () => {
    if (!state.isCameraActive) {
      setState('error', 'Сначала включите камеру');
      return;
    }
    
    setIsCapturing(true);
    
    try {
      const panoramaData = await capturePanorama(videoRef, state.deviceOrientation);
      setState('capturedImages', [...state.capturedImages, panoramaData]);
      
      // Онлайн-подсказка
      console.log('Изображение захвачено! ИИ анализирует сцену...');
      
      // Автоматический анализ с помощью ИИ
      setTimeout(() => {
        setState('aiSuggestions', generateAISuggestions(panoramaData));
      }, 1000);
    } catch (error) {
      console.error('Ошибка захвата изображения:', error);
      setState('error', 'Не удалось захватить изображение');
    } finally {
      setIsCapturing(false);
    }
  };

  const generateAISuggestions = (imageData) => {
    // Заглушка для ИИ-анализа
    // В реальном приложении здесь будет вызов API Yandex Vision или аналогичного сервиса
    return [
      "Рекомендуем сделать снимок с противоположного угла",
      "Попробуйте захватить больше деталей потолка",
      "Снимите панораму от окна к входной двери"
    ];
  };

  onCleanup(() => {
    if (state.isCameraActive) {
      handleStopCamera();
    }
  });

  return (
    <div class="camera-capture">
      <CameraPreview ref={videoRef} />
      
      <div class="camera-controls">
        <Button 
          onClick={handleStartCamera} 
          disabled={state.isCameraActive}
          icon="camera"
          tooltip="Включить камеру для захвата изображений"
        >
          Включить камеру
        </Button>
        
        <Button 
          onClick={handleCapture} 
          disabled={!state.isCameraActive || isCapturing()}
          loading={isCapturing()}
          icon="capture"
          tooltip="Захватить панорамное изображение"
        >
          {isCapturing() ? 'Захват...' : 'Снять панораму'}
        </Button>
        
        <Button 
          onClick={handleStopCamera} 
          disabled={!state.isCameraActive}
          icon="stop"
          tooltip="Отключить камеру"
        >
          Выключить камеру
        </Button>
      </div>
      
      {state.error && <div class="error-message">{state.error}</div>}
    </div>
  );
};

export default CameraCapture;
