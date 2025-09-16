let currentStream = null;

export const startCamera = async () => {
  try {
    // Останавливаем предыдущий поток, если есть
    if (currentStream) {
      stopCamera();
    }
    
    // Запрашиваем доступ к камере
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });
    
    currentStream = stream;
    return stream;
  } catch (error) {
    console.error('Ошибка при запуске камеры:', error);
    throw error;
  }
};

export const stopCamera = () => {
  if (currentStream) {
    const tracks = currentStream.getTracks();
    tracks.forEach(track => track.stop());
    currentStream = null;
  }
};

export const capturePanorama = (videoRef, deviceOrientation = null) => {
  return new Promise((resolve, reject) => {
    try {
      const video = videoRef;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Устанавливаем размеры canvas равными видео
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Рисуем текущий кадр видео на canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Получаем данные изображения
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      
      // Создаем объект с метаданными
      const panoramaData = {
        imageData,
        timestamp: Date.now(),
        orientation: deviceOrientation,
        size: { width: canvas.width, height: canvas.height }
      };
      
      resolve(panoramaData);
    } catch (error) {
      reject(error);
    }
  });
};

export const switchCamera = async () => {
  try {
    stopCamera();
    
    // Определяем доступные камеры
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    if (videoDevices.length < 2) {
      throw new Error('Доступна только одна камера');
    }
    
    // Определяем текущую камеру
    const currentFacingMode = currentStream 
      ? currentStream.getVideoTracks()[0].getSettings().facingMode 
      : null;
    
    // Выбираем противоположную камеру
    const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: newFacingMode } 
    });
    
    currentStream = stream;
    return stream;
  } catch (error) {
    console.error('Ошибка при переключении камеры:', error);
    throw error;
  }
};
