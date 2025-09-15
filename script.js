// Основной класс приложения
class TourForgeApp {
    constructor() {
        this.currentScreen = 'welcome';
        this.currentStep = 0;
        this.totalSteps = 5;
        this.capturedImages = [];
        this.roomData = [];
        this.isProcessing = false;
        this.mediaStream = null;
        this.currentRoom = 'Гостиная';
        
        this.initializeApp();
    }

    // Инициализация приложения
    initializeApp() {
        this.bindEvents();
        this.checkCameraAccess();
        this.loadSounds();
        this.setupServiceWorker();
    }

    // Привязка событий
    bindEvents() {
        // Кнопки навигации
        document.getElementById('startButton').addEventListener('click', () => this.showCameraScreen());
        document.getElementById('backButton').addEventListener('click', () => this.goBack());
        document.getElementById('captureButton').addEventListener('click', () => this.captureImage());
        
        // Кнопки результатов
        document.getElementById('viewTourButton').addEventListener('click', () => this.viewTour());
        document.getElementById('shareButton').addEventListener('click', () => this.shareTour());
        document.getElementById('editPlanButton').addEventListener('click', () => this.editPlan());
        
        // Кнопки модального окна
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeModal());
        document.getElementById('saveEdit').addEventListener('click', () => this.saveEdit());
        
        // Обработка изменения ориентации
        window.addEventListener('orientationchange', () => this.handleOrientationChange());
        
        // Обработка видимости страницы
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }

    // Проверка доступа к камере
    async checkCameraAccess() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                } 
            });
            this.mediaStream = stream;
            this.showToast('Камера готова к работе', 'success');
        } catch (error) {
            this.showToast('Не удалось получить доступ к камере', 'error');
            console.error('Camera access error:', error);
        }
    }

    // Загрузка звуков
    loadSounds() {
        // В реальном приложении здесь будет загрузка звуковых файлов
        console.log('Sounds loaded');
    }

    // Настройка Service Worker
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('service-worker.js');
                console.log('Service Worker registered');
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    // Показать экран камеры
    async showCameraScreen() {
        this.hideAllScreens();
        document.getElementById('cameraScreen').style.display = 'flex';
        this.currentScreen = 'camera';
        
        await this.initializeCamera();
        this.startGuidance();
    }

    // Инициализация камеры
    async initializeCamera() {
        try {
            const video = document.getElementById('cameraView');
            
            if (this.mediaStream) {
                video.srcObject = this.mediaStream;
                await video.play();
            } else {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    } 
                });
                this.mediaStream = stream;
                video.srcObject = stream;
                await video.play();
            }
            
            this.showToast('Камера активирована', 'success');
        } catch (error) {
            this.showToast('Ошибка инициализации камеры', 'error');
            console.error('Camera initialization error:', error);
        }
    }

    // Запуск системы подсказок
    startGuidance() {
        this.currentStep = 1;
        this.updateProgress();
        this.giveInstruction('Встаньте в центре комнаты и медленно поворачивайтесь на 360 градусов');
        
        // Симуляция обнаружения комнат (в реальном приложении будет компьютерное зрение)
        setTimeout(() => {
            this.detectRoom('Гостиная');
        }, 2000);
    }

    // Дать инструкцию пользователю
    giveInstruction(text) {
        const instructionBox = document.getElementById('instructionBox');
        instructionBox.querySelector('p').textContent = text;
        
        // Проигрывание звуковой подсказки
        this.playSound('instruction');
        
        // Показ анимации инструкции
        instructionBox.classList.add('fade-in');
        setTimeout(() => instructionBox.classList.remove('fade-in'), 3000);
    }

    // Обновление прогресса
    updateProgress() {
        document.getElementById('currentStep').textContent = this.currentStep;
        document.getElementById('totalSteps').textContent = this.totalSteps;
        
        const progress = (this.currentStep / this.totalSteps) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = `${Math.round(progress)}%`;
    }

    // Обнаружение комнаты
    detectRoom(roomName) {
        this.currentRoom = roomName;
        document.getElementById('roomLabel').textContent = roomName;
        
        this.giveInstruction(`Обнаружена ${roomName}. Продолжайте медленно поворачиваться`);
        
        // Обновление подсказки
        const hints = [
            'Держите телефон на уровне груди',
            'Двигайтесь медленно и плавно',
            'Старайтесь захватить все углы комнаты',
            'Избегайте резких движений',
            'Следите за освещением - избегайте прямых солнечных лучей'
        ];
        
        document.getElementById('currentHint').textContent = 
            hints[Math.floor(Math.random() * hints.length)];
    }

    // Захват изображения
    async captureImage() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        const video = document.getElementById('cameraView');
        const canvas = document.getElementById('previewCanvas');
        const context = canvas.getContext('2d');
        
        // Установка размеров canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Захват кадра
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Сохранение изображения
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        this.capturedImages.push({
            data: imageData,
            room: this.currentRoom,
            timestamp: Date.now()
        });
        
        // Проигрывание звука
        this.playSound('capture');
        
        // Показ анимации захвата
        this.showCaptureAnimation();
        
        // Переход к следующему шагу
        setTimeout(() => {
            this.currentStep++;
            this.updateProgress();
            
            if (this.currentStep <= this.totalSteps) {
                this.simulateRoomDetection();
            } else {
                this.processImages();
            }
            
            this.isProcessing = false;
        }, 1000);
    }

    // Симуляция обнаружения комнат
    simulateRoomDetection() {
        const rooms = ['Кухня', 'Спальня', 'Ванная', 'Коридор', 'Балкон'];
        if (this.currentStep <= rooms.length) {
            this.detectRoom(rooms[this.currentStep - 1]);
        }
    }

    // Показать анимацию захвата
    showCaptureAnimation() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            opacity: 0.8;
            z-index: 10;
            animation: flash 0.3s ease-out;
        `;
        
        document.querySelector('.camera-container').appendChild(flash);
        
        setTimeout(() => {
            flash.remove();
        }, 300);
    }

    // Обработка изображений
    async processImages() {
        this.hideAllScreens();
        document.getElementById('processingScreen').style.display = 'flex';
        this.currentScreen = 'processing';
        
        // Симуляция обработки с прогрессом
        const steps = document.querySelectorAll('.processing-step');
        
        for (let i = 0; i < steps.length; i++) {
            await this.simulateProcessingStep(steps[i], i);
        }
        
        // Генерация плана помещения
        await this.generateFloorPlan();
        
        // Показ результатов
        this.showResults();
    }

    // Симуляция шага обработки
    async simulateProcessingStep(step, index) {
        return new Promise(resolve => {
            setTimeout(() => {
                step.classList.add('active');
                
                // Обновление текста текущего шага
                const stepTexts = [
                    'Анализ геометрии помещения...',
                    'Определение размеров комнат...',
                    'Создание 3D модели...',
                    'Генерация виртуального тура...'
                ];
                
                if (stepTexts[index]) {
                    step.querySelector('.step-text').textContent = stepTexts[index];
                }
                
                resolve();
            }, 1500);
        });
    }

    // Генерация плана помещения
    async generateFloorPlan() {
        // В реальном приложении здесь будет сложный алгоритм компьютерного зрения
        // Сейчас просто симулируем создание плана
        
        this.roomData = [
            { name: 'Гостиная', area: 20, coordinates: { x: 50, y: 50 } },
            { name: 'Кухня', area: 12, coordinates: { x: 150, y: 50 } },
            { name: 'Спальня', area: 15, coordinates: { x: 50, y: 150 } },
            { name: 'Ванная', area: 8, coordinates: { x: 150, y: 150 } },
            { name: 'Коридор', area: 10, coordinates: { x: 100, y: 100 } }
        ];
        
        // Отрисовка плана
        this.drawFloorPlan();
    }

    // Отрисовка плана помещения
    drawFloorPlan() {
        const canvas = document.getElementById('floorPlanCanvas');
        const ctx = canvas.getContext('2d');
        const roomLabels = document.getElementById('roomLabels');
        
        // Очистка
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        roomLabels.innerHTML = '';
        
        // Отрисовка комнат
        this.roomData.forEach(room => {
            // Простая отрисовка прямоугольных комнат
            const roomSize = Math.sqrt(room.area) * 10;
            
            ctx.fillStyle = this.getRoomColor(room.name);
            ctx.fillRect(room.coordinates.x, room.coordinates.y, roomSize, roomSize);
            
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.strokeRect(room.coordinates.x, room.coordinates.y, roomSize, roomSize);
            
            // Добавление подписи
            const label = document.createElement('div');
            label.className = 'room-label-item';
            label.textContent = room.name;
            label.style.left = `${room.coordinates.x + roomSize/2}px`;
            label.style.top = `${room.coordinates.y + roomSize/2}px`;
            roomLabels.appendChild(label);
        });
        
        // Заполнение списка комнат
        this.populateRoomList();
    }

    // Получение цвета для комнаты
    getRoomColor(roomName) {
        const colors = {
            'Гостиная': 'rgba(255, 107, 107, 0.6)',
            'Кухня': 'rgba(77, 171, 247, 0.6)',
            'Спальня': 'rgba(130, 224, 170, 0.6)',
            'Ванная': 'rgba(180, 142, 173, 0.6)',
            'Коридор': 'rgba(245, 176, 65, 0.6)',
            'Балкон': 'rgba(169, 113, 243, 0.6)'
        };
        
        return colors[roomName] || 'rgba(200, 200, 200, 0.6)';
    }

    // Заполнение списка комнат
    populateRoomList() {
        const container = document.querySelector('.rooms-container');
        container.innerHTML = '';
        
        this.roomData.forEach(room => {
            const roomItem = document.createElement('div');
            roomItem.className = 'room-item';
            
            roomItem.innerHTML = `
                <div class="room-icon">${this.getRoomIcon(room.name)}</div>
                <div class="room-name">${room.name}</div>
                <div class="room-area">${room.area} м²</div>
            `;
            
            container.appendChild(roomItem);
        });
    }

    // Получение иконки для комнаты
    getRoomIcon(roomName) {
        const icons = {
            'Гостиная': '🛋️',
            'Кухня': '👨‍🍳',
            'Спальня': '🛏️',
            'Ванная': '🚿',
            'Коридор': '🚪',
            'Балкон': '🌳'
        };
        
        return icons[roomName] || '🏠';
    }

    // Показать результаты
    showResults() {
        this.hideAllScreens();
        document.getElementById('resultScreen').style.display = 'flex';
        this.currentScreen = 'results';
        
        this.playSound('success');
        this.showToast('План помещения успешно создан!', 'success');
    }

    // Просмотр тура
    viewTour() {
        this.showToast('3D тур будет открыт в новом окне', 'info');
        // В реальном приложении здесь будет открытие 3D тура
    }

    // Поделиться туром
    async shareTour() {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: '3D тур помещения',
                    text: 'Посмотрите созданный 3D тур моей квартиры',
                    url: window.location.href
                });
            } else {
                this.showToast('Скопируйте ссылку для分享', 'info');
            }
        } catch (error) {
            console.error('Share error:', error);
        }
    }

    // Редактирование плана
    editPlan() {
        document.getElementById('editModal').style.display = 'flex';
    }

    // Закрытие модального окна
    closeModal() {
        document.getElementById('editModal').style.display = 'none';
    }

    // Сохранение изменений
    saveEdit() {
        this.closeModal();
        this.showToast('Изменения сохранены', 'success');
    }

    // Назад
    goBack() {
        switch (this.currentScreen) {
            case 'camera':
                this.stopCamera();
                this.hideAllScreens();
                document.getElementById('welcomeScreen').style.display = 'flex';
                this.currentScreen = 'welcome';
                break;
            case 'processing':
                this.stopProcessing();
                this.showCameraScreen();
                break;
            case 'results':
                this.hideAllScreens();
                document.getElementById('welcomeScreen').style.display = 'flex';
                this.currentScreen = 'welcome';
                break;
        }
    }

    // Остановка камеры
    stopCamera() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
    }

    // Остановка обработки
    stopProcessing() {
        this.isProcessing = false;
    }

    // Скрыть все экраны
    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });
    }

    // Показать уведомление
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.getElementById('toastContainer').appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Проиграть звук
    playSound(type) {
        // В реальном приложении здесь будет воспроизведение звуков
        console.log(`Playing sound: ${type}`);
    }

    // Обработка изменения ориентации
    handleOrientationChange() {
        this.showToast('Поверните телефон в портретный режим для лучшего обзора', 'info');
    }

    // Обработка изменения видимости страницы
    handleVisibilityChange() {
        if (document.hidden && this.mediaStream) {
            this.stopCamera();
        } else if (!document.hidden && this.currentScreen === 'camera') {
            this.initializeCamera();
        }
    }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    new TourForgeApp();
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
    alert('Произошла ошибка в приложении. Пожалуйста, перезагрузите страницу.');
});

// Регистрация приложения как PWA
window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    console.log('PWA install prompt available');
});
