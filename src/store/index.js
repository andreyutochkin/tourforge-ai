import { createStore } from 'solid-js/store';

// Основное хранилище состояния приложения
const [state, setState] = createStore({
  // Состояние камеры
  isCameraActive: false,
  capturedImages: [],
  deviceOrientation: null,
  
  // Состояние тура
  currentTour: null,
  tours: [],
  currentView: 'camera', // 'camera' или 'tour'
  
  // Состояние ИИ
  aiSuggestions: [],
  isProcessingAI: false,
  
  // Общее состояние приложения
  error: null,
  isLoading: true
});

// Геттеры для удобства
export const getters = {
  getTourById: (id) => state.tours.find(tour => tour.id === id),
  getActiveTour: () => state.currentTour,
  getCaptureProgress: () => {
    const total = 8; // Рекомендуемое количество снимков для полного тура
    return Math.min(state.capturedImages.length / total * 100, 100);
  }
};

// Действия для изменения состояния
export const actions = {
  // Действия с камерой
  activateCamera: () => setState('isCameraActive', true),
  deactivateCamera: () => setState('isCameraActive', false),
  addCapturedImage: (imageData) => setState('capturedImages', [...state.capturedImages, imageData]),
  clearCapturedImages: () => setState('capturedImages', []),
  
  // Действия с турами
  createTour: (tourData) => {
    const newTour = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...tourData
    };
    setState('tours', [...state.tours, newTour]);
    setState('currentTour', newTour);
    return newTour;
  },
  setCurrentTour: (tour) => setState('currentTour', tour),
  switchView: (view) => setState('currentView', view),
  
  // Действия с ИИ
  setAISuggestions: (suggestions) => setState('aiSuggestions', suggestions),
  setAIProcessing: (isProcessing) => setState('isProcessingAI', isProcessing),
  
  // Общие действия
  setError: (error) => setState('error', error),
  clearError: () => setState('error', null),
  setLoading: (isLoading) => setState('isLoading', isLoading)
};

export const useStore = () => [state, setState, { ...getters, ...actions }];
export default useStore;
