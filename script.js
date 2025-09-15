// Полное содержание JavaScript файла из предыдущего ответа
class TourForgeApp {
    constructor() {
        this.currentScreen = 'home';
        this.currentStep = 0;
        this.totalSteps = 8;
        this.capturedImages = [];
        this.roomData = [];
        this.isProcessing = false;
        this.mediaStream = null;
        this.currentRoomIndex = 0;
        this.rooms = ['Гостиная', 'Кухня', 'Спальня', 'Ванная', 'Коридор', 'Балкон'];
        this.capturesPerRoom = 0;
        this.maxCapturesPerRoom = 8;
        this.voiceGuide = new VoiceGuidance();
        this.platformExporter = new PlatformExporter();
        
        this.initializeApp();
    }

    // ... все методы класса ...
}

// Дополнительные классы
class VoiceGuidance {
    // ... полная реализация ...
}

class PlatformExporter {
    // ... полная реализация ...
}

// Инициализация приложения
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TourForgeApp();
});

// Service Worker для оффлайн-работы
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(registration => {
            console.log('ServiceWorker registration successful');
        })
        .catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
}

// Обработка ошибок
window.addEventListener('error', e => {
    console.error('Application error:', e.error);
});
