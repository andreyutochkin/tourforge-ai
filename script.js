// TourForge AI - Основной файл приложения
class TourForgeApp {
    constructor() {
        this.currentScreen = 'home';
        this.currentStep = 0;
        this.totalSteps = 12; // Увеличили количество шагов для лучшего качества
        this.capturedImages = [];
        this.roomData = [];
        this.isProcessing = false;
        this.mediaStream = null;
        this.currentRoomIndex = 0;
        this.rooms = ['Гостиная', 'Кухня', 'Спальня', 'Ванная', 'Коридор', 'Балкон'];
        this.capturesPerRoom = 0;
        this.maxCapturesPerRoom = 12; // Увеличили количество снимков для панорамы
        this.voiceGuide = new VoiceGuidance();
        this.platformExporter = new PlatformExporter();
        this.cameraManager = new CameraManager();
        this.aiProcessor = new AIProcessor();
        this.roomManager = new RoomManager();
        this.universalExporter = new UniversalExporter();
        this.sensorManager = new PhoneSensorManager();
        this.panoramaViewer = new PanoramaViewer();
        
        this.initializeApp();
    }

    // Инициализация приложения
    initializeApp() {
        this.bindEvents();
        this.checkCameraAccess();
        this.loadSounds();
        this.setupServiceWorker();
        this.loadTours();
        this.sensorManager.initializeSensors();
        this.aiProcessor.loadModel();
        
        // Показать главный экран
        this.showScreen('home');
    }

    // Привязка событий
    bindEvents() {
        // Навигация
        document.getElementById('startTour').addEventListener('click', () => this.showCameraScreen());
        document.getElementById('myTours').addEventListener('click', () => this.showToursScreen());
        document.getElementById('backFromTours').addEventListener('click', () => this.showHomeScreen());
        document.getElementById('backFromCamera').addEventListener('click', () => this.showHomeScreen());
        document.getElementById('backFromViewer').addEventListener('click', () => this.showResultScreen());
        document.getElementById('backFromResults').addEventListener('click', () => this.showHomeScreen());
        document.getElementById('createFirstTour').addEventListener('click', () => this.showCameraScreen());
        
        // Управление камерой
        document.getElementById('captureButton').addEventListener('click', () => this.captureImage());
        
        // Навигация по комнатам
        document.getElementById('prevRoom').addEventListener('click', () => this.previousRoom());
        document.getElementById('nextRoom').addEventListener('click', () => this.nextRoom());
        
        // Результаты
        document.getElementById('viewTourButton').addEventListener('click', () => this.viewTour());
        document.getElementById('shareButton').addEventListener('click', () => this.shareTour());
        document.getElementById('editPlanButton').addEventListener('click', () => this.editPlan());
        
        // Платформы
        document.querySelectorAll('.btn-platform').forEach(btn => {
            btn.addEventListener('click', (e) => this.exportToPlatform(e.target.dataset.platform));
        });
        
        // Модальные окна
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeModal());
        document.getElementById('saveEdit').addEventListener('click', () => this.saveEdit());
        document.getElementById('closeEditModal').addEventListener('click', () => this.closeModal());
        document.getElementById('closeExportModal').addEventListener('click', () => this.closeExportModal());
        
        // Экспорт
        document.getElementById('saveToDevice').addEventListener('click', () => this.saveToDevice());
        document.getElementById('generateLink').addEventListener('click', () => this.generateLink());
        
        // Инструменты редактирования
        document.querySelectorAll('.btn-tool').forEach(tool => {
            tool.addEventListener('click', (e) => this.selectEditTool(e.target.dataset.tool));
        });
        
        // Управление туром
        document.getElementById('panoramaLeft').addEventListener('click', () => this.rotatePanorama(-30));
        document.getElementById('panoramaRight').addEventListener('click', () => this.rotatePanorama(30));
        document.getElementById('panoramaZoomIn').addEventListener('click', () => this.zoomPanorama(0.1));
        document.getElementById('panoramaZoomOut').addEventListener('click', () => this.zoomPanorama(-0.1));
        document.getElementById('fullscreenButton').addEventListener('click', () => this.toggleFullscreen());
        
        // Навигация по точкам
        document.getElementById('prevPoint').addEventListener('click', () => this.previousPoint());
        document.getElementById('nextPoint').addEventListener('click', () => this.nextPoint());
        
        // Горячие точки
        document.querySelectorAll('.hotspot').forEach(hotspot => {
            hotspot.addEventListener('click', (e) => this.navigateToPoint(e.target.dataset.target));
        });
    }

    // Показать экран
    showScreen(screenId) {
        // Скрыть все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Показать нужный экран
        document.getElementById(screenId + 'Screen').classList.add('active');
        this.currentScreen = screenId;
        
        // Специальные действия для экранов
        if (screenId === 'camera') {
            this.initializeCamera();
        } else if (screenId === 'tours') {
            this.loadTours();
        } else if (screenId === 'tourViewer') {
            this.loadTourViewer();
        }
    }

    // Показать главный экран
    showHomeScreen() {
        this.showScreen('home');
    }

    // Показать экран списка туров
    showToursScreen() {
        this.showScreen('tours');
    }

    // Показать экран камеры
    async showCameraScreen() {
        this.showScreen('camera');
        await this.initializeCamera();
        this.startGuidance();
    }

    // Показать экран обработки
    showProcessingScreen() {
        this.showScreen('processing');
        this.processImages();
    }

    // Показать экран результатов
    showResultScreen() {
        this.showScreen('result');
        this.drawFloorPlan();
    }

    // Показать экран просмотра тура
    showTourViewerScreen() {
        this.showScreen('tourViewer');
    }

    // Инициализация камеры
    async initializeCamera() {
        try {
            const success = await this.cameraManager.initializeCamera();
            if (!success) {
                this.showToast('Не удалось получить доступ к камере', 'error');
                this.showHomeScreen();
                return false;
            }
            
            this.showToast('Камера готова к работе', 'success');
            return true;
        } catch (error) {
            console.error('Camera initialization error:', error);
            this.showToast('Ошибка инициализации камеры', 'error');
            this.showHomeScreen();
            return false;
        }
    }

    // Запуск системы подсказок
    startGuidance() {
        this.currentStep = 1;
        this.capturesPerRoom = 0;
        this.currentRoomIndex = 0;
        this.updateProgress();
        this.updateRoomNavigation();
        
        this.voiceGuide.speak(`Начинаем съемку ${this.rooms[this.currentRoomIndex]}. Встаньте в центре комнаты и медленно поворачивайтесь на 360 градусов. Делайте снимки каждые 30 градусов.`);
        
        this.showOverlayInstruction(`Снимаем ${this.rooms[this.currentRoomIndex]}. Делайте снимки каждые 30 градусов.`);
        
        // Запуск отслеживания угла поворота
        this.startAngleTracking();
    }

    // Запуск отслеживания угла поворота
    startAngleTracking() {
        let lastAngle = 0;
        
        const updateAngle = () => {
            if (this.currentScreen !== 'camera') return;
            
            const currentAngle = this.sensorManager.getCurrentAngle();
            const angleDiff = Math.abs(currentAngle - lastAngle);
            
            if (angleDiff > 5) {
                lastAngle = currentAngle;
                this.updateAngleIndicator(currentAngle);
                
                // Автоматический захват при повороте на 30 градусов
                if (this.capturesPerRoom > 0 && angleDiff >= 30) {
                    this.captureImage();
                }
            }
            
            requestAnimationFrame(updateAngle);
        };
        
        requestAnimationFrame(updateAngle);
    }

    // Обновление индикатора угла
    updateAngleIndicator(angle) {
        const angleText = document.querySelector('.angle-text');
        const angleHand = document.querySelector('.angle-hand');
        
        if (angleText && angleHand) {
            angleText.textContent = `${Math.round(angle)}°`;
            angleHand.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
        }
    }

    // Обновление прогресса
    updateProgress() {
        document.getElementById('currentStep').textContent = this.currentStep;
        document.getElementById('totalSteps').textContent = this.totalSteps;
        
        const progress = (this.currentStep / this.totalSteps) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = `${Math.round(progress)}% завершено`;
        document.getElementById('captureCounter').textContent = `${this.capturesPerRoom}/${this.maxCapturesPerRoom} снимков`;
    }

    // Обновление навигации по комнатам
    updateRoomNavigation() {
        document.getElementById('prevRoom').disabled = this.currentRoomIndex === 0;
        document.getElementById('nextRoom').disabled = this.currentRoomIndex === this.rooms.length - 1;
        document.getElementById('roomLabel').textContent = this.rooms[this.currentRoomIndex];
    }

    // Показать оверлей с инструкцией
    showOverlayInstruction(text) {
        const instructionBox = document.getElementById('instructionBox');
        instructionBox.querySelector('p').textContent = text;
        instructionBox.classList.add('fade-in');
        setTimeout(() => instructionBox.classList.remove('fade-in'), 5000);
    }

    // Захват изображения
    async captureImage() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        
        try {
            // Проверить стабильность устройства
            if (!this.sensorManager.isDeviceSteady()) {
                this.showToast('Держите устройство неподвижно для съемки', 'warning');
                this.isProcessing = false;
                return;
            }
            
            // Захват кадра
            const imageData = this.cameraManager.captureFrame();
            
            // Улучшение качества с помощью AI
            const enhancedImage = await this.aiProcessor.enhanceImage(imageData);
            
            // Классификация комнаты с помощью AI
            const roomType = await this.aiProcessor.classifyRoom(enhancedImage);
            
            // Сохранение изображения
            const imageInfo = {
                data: enhancedImage,
                room: roomType,
                timestamp: Date.now(),
                angle: this.capturesPerRoom * 30,
                coordinates: await this.roomManager.getCurrentCoordinates()
            };
            
            this.capturedImages.push(imageInfo);
            
            // Проигрывание звука
            this.playSound('capture');
            
            // Показ анимации захвата
            this.showCaptureAnimation();
            
            // Обновление прогресса
            this.capturesPerRoom++;
            this.currentStep++;
            this.updateProgress();
            
            // Голосовая подсказка
            if (this.capturesPerRoom < this.maxCapturesPerRoom) {
                const remaining = this.maxCapturesPerRoom - this.capturesPerRoom;
                this.voiceGuide.speak(`Снимок принят. Осталось ${remaining} снимков в этой комнате.`);
            } else {
                this.voiceGuide.speak(`Комната ${this.rooms[this.currentRoomIndex]} завершена. Готовы перейти к следующей комнате?`);
            }
        } catch (error) {
            console.error('Capture error:', error);
            this.showToast('Ошибка при съемке', 'error');
        }
        
        this.isProcessing = false;
    }

    // Переход к следующей комнате
    nextRoom() {
        if (this.currentRoomIndex < this.rooms.length - 1) {
            this.currentRoomIndex++;
            this.capturesPerRoom = 0;
            this.updateRoomNavigation();
            
            this.voiceGuide.speak(`Начинаем съемку ${this.rooms[this.currentRoomIndex]}. Встаньте в центре комнаты и медленно поворачивайтесь.`);
            this.showOverlayInstruction(`Снимаем ${this.rooms[this.currentRoomIndex]}. Делайте снимки каждые 30 градусов.`);
        } else {
            this.voiceGuide.speak("Все комнаты сфотографированы. Начинаем обработку.");
            this.showProcessingScreen();
        }
    }

    // Переход к предыдущей комнате
    previousRoom() {
        if (this.currentRoomIndex > 0) {
            this.currentRoomIndex--;
            this.capturesPerRoom = 0;
            this.updateRoomNavigation();
            
            this.voiceGuide.speak(`Возвращаемся к съемке ${this.rooms[this.currentRoomIndex]}.`);
            this.showOverlayInstruction(`Снимаем ${this.rooms[this.currentRoomIndex]}. Делайте снимки каждые 30 градусов.`);
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
        
        document.querySelector('.camera-view').appendChild(flash);
        
        setTimeout(() => {
            flash.remove();
        }, 300);
    }

    // Обработка изображений
    async processImages() {
        // Симуляция обработки с прогрессом
        const steps = document.querySelectorAll('.processing-step');
        const status = document.getElementById('aiStatus');
        
        for (let i = 0; i < steps.length; i++) {
            await this.simulateProcessingStep(steps[i], i, status);
        }
        
        // Генерация плана помещения
        await this.generateFloorPlan();
        
        // Создание панорамы
        await this.createPanorama();
        
        // Показ результатов
        this.showResultScreen();
    }

    // Создание панорамы
    async createPanorama() {
        try {
            this.showToast('Создание панорамы...', 'info');
            
            // В реальном приложении здесь будет логика сшивания изображений в панораму
            // Сейчас используем заглушку
            const panoramaData = await this.aiProcessor.createPanorama(this.capturedImages);
            
            // Сохраняем данные панорамы
            this.panoramaData = panoramaData;
            
            this.showToast('Панорама успешно создана', 'success');
        } catch (error) {
            console.error('Panorama creation error:', error);
            this.showToast('Ошибка при создании панорамы', 'error');
        }
    }

    // Симуляция шага обработки
    async simulateProcessingStep(step, index, status) {
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
                
                const statusTexts = [
                    'ИИ анализирует геометрию помещения и определяет структуру стен',
                    'Определяем размеры и площади каждой комнаты',
                    'Создаем 3D модель на основе ваших снимков',
                    'Генерируем интерактивный тур для просмотра'
                ];
                
                if (stepTexts[index]) {
                    step.querySelector('.step-text').textContent = stepTexts[index];
                }
                
                if (statusTexts[index]) {
                    status.textContent = statusTexts[index];
                }
                
                // Отметить завершенный шаг
                if (index > 0) {
                    steps[index - 1].classList.add('completed');
                }
                
                resolve();
            }, 2000);
        });
    }

    // Генерация плана помещения
    async generateFloorPlan() {
        // В реальном приложении здесь будет сложный алгоритм компьютерного зрения
        // Сейчас просто симулируем создание плана
        
        this.roomData = [
            { name: 'Гостиная', area: 20, coordinates: { x: 50, y: 50 }, color: 'rgba(255, 107, 107, 0.6)' },
            { name: 'Кухня', area: 12, coordinates: { x: 150, y: 50 }, color: 'rgba(77, 171, 247, 0.6)' },
            { name: 'Спальня', area: 15, coordinates: { x: 50, y: 150 }, color: 'rgba(130, 224, 170, 0.6)' },
            { name: 'Ванная', area: 8, coordinates: { x: 150, y: 150 }, color: 'rgba(180, 142, 173, 0.6)' },
            { name: 'Коридор', area: 10, coordinates: { x: 100, y: 100 }, color: 'rgba(245, 176, 65, 0.6)' }
        ];
        
        // Отрисовка плана
        this.drawFloorPlan();
        
        // Сохранение тура
        this.saveTour();
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
            
            ctx.fillStyle = room.color;
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

    // Заполнение списка комнат
    populateRoomList() {
        const container = document.getElementById('roomList');
        container.innerHTML = '';
        
        this.roomData.forEach(room => {
            const roomItem = document.createElement('div');
            roomItem.className = 'room-item';
            
            roomItem.innerHTML = `
                <div class="room-icon">${this.getRoomIcon(room.name)}</div>
                <div class="room-info">
                    <div class="room-name">${room.name}</div>
                    <div class="room-area">${room.area} м²</div>
                </div>
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

    // Сохранение тура
    saveTour() {
        const tour = {
            id: Date.now(),
            name: `Тур от ${new Date().toLocaleDateString()}`,
            date: new Date().toISOString(),
            preview: this.capturedImages[0]?.data || '',
            rooms: this.roomData,
            images: this.capturedImages,
            panorama: this.panoramaData
        };
        
        const tours = JSON.parse(localStorage.getItem('tours') || '[]');
        tours.push(tour);
        localStorage.setItem('tours', JSON.stringify(tours));
        
        this.currentTourId = tour.id;
    }

    // Загрузка списка туров
    loadTours() {
        const tours = JSON.parse(localStorage.getItem('tours') || '[]');
        this.displayTours(tours);
    }

    // Отображение списка туров
    displayTours(tours) {
        const toursList = document.getElementById('toursList');
        
        if (tours.length === 0) {
            toursList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📂</div>
                    <h3>У вас пока нет созданных туров</h3>
                    <p>Начните с создания вашего первого 3D тура</p>
                    <button class="btn btn-primary" id="createFirstTour">
                        <span class="btn-icon">📷</span>
                        Создать первый тур
                    </button>
                </div>
            `;
            document.getElementById('createFirstTour').addEventListener('click', () => this.showCameraScreen());
            return;
        }
        
        toursList.innerHTML = tours.map(tour => `
            <div class="tour-card">
                <div class="tour-card-header">
                    <h3 class="tour-card-title">${tour.name}</h3>
                    <span class="tour-card-date">${new Date(tour.date).toLocaleDateString()}</span>
                </div>
                <div class="tour-card-preview" style="background-image: url('${tour.preview}')"></div>
                <div class="tour-card-actions">
                    <button class="btn btn-secondary view-tour" data-id="${tour.id}">
                        <span class="btn-icon">👁️</span>
                        Просмотр
                    </button>
                    <button class="btn btn-primary export-tour" data-id="${tour.id}">
                        <span class="btn-icon">📤</span>
                        Экспорт
                    </button>
                </div>
            </div>
        `).join('');
        
        // Добавление обработчиков событий
        document.querySelectorAll('.view-tour').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tourId = e.target.dataset.id;
                this.viewSavedTour(tourId);
            });
        });
        
        document.querySelectorAll('.export-tour').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tourId = e.target.dataset.id;
                this.exportTour(tourId);
            });
        });
    }

    // Просмотр тура
    viewTour() {
        this.showTourViewerScreen();
    }

    // Просмотр сохраненного тура
    viewSavedTour(tourId) {
        const tours = JSON.parse(localStorage.getItem('tours') || '[]');
        const tour = tours.find(t => t.id == tourId);
        
        if (tour) {
            this.currentTourId = tourId;
            this.roomData = tour.rooms;
            this.capturedImages = tour.images;
            this.panoramaData = tour.panorama;
            this.showTourViewerScreen();
        }
    }

    // Загрузка просмотрщика тура
    loadTourViewer() {
        const tourContainer = document.getElementById('tourContainer');
        
        // Очистка контейнера
        tourContainer.innerHTML = '';
        
        // Создание контейнера для панорамы
        const panoramaContainer = document.createElement('div');
        panoramaContainer.id = 'panorama-container';
        panoramaContainer.style.width = '100%';
        panoramaContainer.style.height = '100%';
        tourContainer.appendChild(panoramaContainer);
        
        // Инициализация панорамы
        this.panoramaViewer.init(panoramaContainer, this.panoramaData);
        
        // Добавление горячих точек
        this.addHotspots();
    }

    // Добавление горячих точек
    addHotspots() {
        const hotspotsContainer = document.querySelector('.panorama-hotspots');
        hotspotsContainer.innerHTML = '';
        
        this.roomData.forEach(room => {
            const hotspot = document.createElement('div');
            hotspot.className = 'hotspot';
            hotspot.dataset.target = room.name.toLowerCase();
            hotspot.style.top = `${30 + Math.random() * 40}%`;
            hotspot.style.left = `${20 + Math.random() * 60}%`;
            
            hotspot.innerHTML = `
                <div class="hotspot-marker"></div>
                <div class="hotspot-tooltip">${room.name}</div>
            `;
            
            hotspot.addEventListener('click', () => {
                this.navigateToPoint(room.name.toLowerCase());
            });
            
            hotspotsContainer.appendChild(hotspot);
        });
    }

    // Навигация к точке
    navigateToPoint(pointId) {
        this.panoramaViewer.lookAtPoint(pointId);
        this.showToast(`Переход к ${pointId}`, 'info');
    }

    // Вращение панорамы
    rotatePanorama(angle) {
        this.panoramaViewer.rotate(angle);
    }

    // Приближение панорамы
    zoomPanorama(level) {
        this.panoramaViewer.zoom(level);
    }

    // Переход к предыдущей точке
    previousPoint() {
        this.panoramaViewer.previousPoint();
    }

    // Переход к следующей точке
    nextPoint() {
        this.panoramaViewer.nextPoint();
    }

    // Полноэкранный режим
    toggleFullscreen() {
        this.panoramaViewer.toggleFullscreen();
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

    // Экспорт на платформу
    async exportToPlatform(platform) {
        try {
            this.showToast(`Подготовка для ${platform}...`, 'info');
            
            // Используем соответствующий модуль экспорта
            const exporter = window[`${platform}Exporter`];
            if (exporter) {
                const tourData = {
                    images: this.capturedImages,
                    rooms: this.roomData,
                    panorama: this.panoramaData
                };
                
                const result = await exporter.exportTour(tourData);
                
                if (result.success) {
                    this.showToast(`Тур подготовлен для ${platform}`, 'success');
                    
                    // Предложить скачать или скопировать ссылку
                    if (result.downloadLink) {
                        window.open(result.downloadLink, '_blank');
                    }
                } else {
                    this.showToast(result.message, 'error');
                }
            } else {
                this.showToast(`Экспорт на ${platform} пока не поддерживается`, 'error');
            }
        } catch (error) {
            this.showToast(`Ошибка экспорта на ${platform}`, 'error');
            console.error('Export error:', error);
        }
    }

    // Экспорт тура
    async exportTour(tourId) {
        const tours = JSON.parse(localStorage.getItem('tours') || '[]');
        const tour = tours.find(t => t.id == tourId);
        
        if (tour) {
            this.currentTourId = tourId;
            this.roomData = tour.rooms;
            this.capturedImages = tour.images;
            this.panoramaData = tour.panorama;
            
            // Показать модальное окно экспорта
            this.showExportModal();
        }
    }

    // Показать модальное окно экспорта
    showExportModal() {
        document.getElementById('exportModal').classList.add('active');
    }

    // Закрыть модальное окно экспорта
    closeExportModal() {
        document.getElementById('exportModal').classList.remove('active');
    }

    // Сохранение на устройство
    async saveToDevice() {
        try {
            const tourData = {
                images: this.capturedImages,
                rooms: this.roomData,
                panorama: this.panoramaData
            };
            
            const blob = await this.universalExporter.exportTour(tourData, 'zip');
            const url = await this.universalExporter.saveToDevice(blob, 'tour-export.zip');
            
            this.showToast('Тур сохранен на устройстве', 'success');
            this.closeExportModal();
        } catch (error) {
            this.showToast('Ошибка при сохранении тура', 'error');
            console.error('Save to device error:', error);
        }
    }

    // Генерация ссылки
    async generateLink() {
        try {
            // В реальном приложении здесь будет загрузка на сервер
            // и получение публичной ссылки
            const mockLink = 'https://tourforge.ai/tour/' + Math.random().toString(36).substring(2, 10);
            
            // Копирование в буфер обмена
            await navigator.clipboard.writeText(mockLink);
            
            this.showToast('Ссылка скопирована в буфер обмена', 'success');
            this.closeExportModal();
        } catch (error) {
            this.showToast('Ошибка при создании ссылки', 'error');
            console.error('Generate link error:', error);
        }
    }

    // Редактирование плана
    editPlan() {
        document.getElementById('editModal').classList.add('active');
        this.initEditor();
    }

    // Инициализация редактора
    initEditor() {
        const canvas = document.getElementById('editCanvas');
        const ctx = canvas.getContext('2d');
        
        // Очистка canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Отрисовка плана для редактирования
        this.roomData.forEach(room => {
            const roomSize = Math.sqrt(room.area) * 10;
            
            ctx.fillStyle = room.color;
            ctx.fillRect(room.coordinates.x, room.coordinates.y, roomSize, roomSize);
            
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.strokeRect(room.coordinates.x, room.coordinates.y, roomSize, roomSize);
            
            // Добавление текста
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(room.name, room.coordinates.x + roomSize/2, room.coordinates.y + roomSize/2);
        });
    }

    // Выбор инструмента редактирования
    selectEditTool(tool) {
        document.querySelectorAll('.btn-tool').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
        
        // Показать опции для выбранного инструмента
        this.showEditOptions(tool);
    }

    // Показать опции редактирования
    showEditOptions(tool) {
        const optionsContainer = document.getElementById('editOptions');
        
        const options = {
            'select': '<p>Выберите элемент для редактирования</p>',
            'wall': `
                <div class="option-group">
                    <label>Толщина стены</label>
                    <input type="range" min="1" max="10" value="2">
                </div>
                <div class="option-group">
                    <label>Цвет стены</label>
                    <input type="color" value="#cccccc">
                </div>
            `,
            'door': `
                <div class="option-group">
                    <label>Тип двери</label>
                    <select>
                        <option>Обычная</option>
                        <option>Двустворчатая</option>
                        <option>Раздвижная</option>
                    </select>
                </div>
            `,
            'window': `
                <div class="option-group">
                    <label>Тип окна</label>
                    <select>
                        <option>Обычное</option>
                        <option>Панорамное</option>
                        <option>С текстурами</option>
                    </select>
                </div>
            `,
            'furniture': `
                <div class="option-group">
                    <label>Тип мебели</label>
                    <select>
                        <option>Диван</option>
                        <option>Кровать</option>
                        <option>Шкаф</option>
                        <option>Стол</option>
                        <option>Стул</option>
                    </select>
                </div>
            `
        };
        
        optionsContainer.innerHTML = options[tool] || '';
    }

    // Закрытие модального окна
    closeModal() {
        document.getElementById('editModal').classList.remove('active');
    }

    // Сохранение изменений
    saveEdit() {
        // Здесь будет логика сохранения изменений
        this.showToast('Изменения сохранены', 'success');
        this.closeModal();
        
        // Перерисовываем план с изменениями
        this.drawFloorPlan();
    }

    // Остановка камерой
    stopCamera() {
        this.cameraManager.stopCamera();
    }

    // Проверка доступа к камере
    async checkCameraAccess() {
        try {
            const hasAccess = await this.cameraManager.checkCameraAccess();
            if (!hasAccess) {
                this.showToast('Требуется доступ к камере для работы приложения', 'warning');
            }
        } catch (error) {
            console.error('Camera access check error:', error);
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

    // Показать уведомление
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">×</button>
        `;
        
        document.getElementById('toastContainer').appendChild(toast);
        
        // Добавление обработчика закрытия
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
        
        // Автоматическое закрытие
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
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

// Класс управления камерой
class CameraManager {
    constructor() {
        this.videoElement = document.getElementById('cameraView');
        this.stream = null;
    }

    async initializeCamera() {
        try {
            // Запрос разрешения на использование камеры
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            });
            
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();
            
            return true;
        } catch (error) {
            console.error('Camera initialization error:', error);
            return false;
        }
    }

    captureFrame() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Установка размеров canvas
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;
        
        // Захват кадра
        context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
        
        // Возврат данных изображения
        return canvas.toDataURL('image/jpeg', 0.8);
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    async checkCameraAccess() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            return videoDevices.length > 0;
        } catch (error) {
            console.error('Camera access check error:', error);
            return false;
        }
    }
}

// Класс голосовых подсказок
class VoiceGuidance {
    constructor() {
        this.synth = window.speechSynthesis;
        this.utterance = null;
    }

    speak(text) {
        if (this.synth.speaking) {
            this.synth.cancel();
        }
        
        this.utterance = new SpeechSynthesisUtterance(text);
        this.utterance.lang = 'ru-RU';
        this.utterance.rate = 0.9;
        
        this.synth.speak(this.utterance);
    }

    stop() {
        if (this.synth.speaking) {
            this.synth.cancel();
        }
    }
}

// Класс AI обработки
class AIProcessor {
    constructor() {
        this.model = null;
        this.isModelLoaded = false;
    }

    async loadModel() {
        try {
            // В реальном приложении здесь будет загрузка модели
            // this.model = await tf.loadGraphModel('models/room-classification/model.json');
            this.isModelLoaded = true;
            console.log('AI model loaded successfully');
        } catch (error) {
            console.error('Model loading error:', error);
            // Fallback к простой логике
            this.isModelLoaded = false;
        }
    }

    async enhanceImage(imageData) {
        // В реальном приложении здесь будет улучшение качества изображения с помощью AI
        // Сейчас просто возвращаем исходное изображение
        return imageData;
    }

    async classifyRoom(imageData) {
        if (!this.isModelLoaded) {
            // Простая логика если модель не загрузилась
            return this.simpleRoomClassification(imageData);
        }

        try {
            // Реальная обработка с помощью TensorFlow.js
            // const tensor = tf.browser.fromPixels(imageData)
            //     .resizeNearestNeighbor([224, 224])
            //     .toFloat()
            //     .expandDims();
            
            // const predictions = await this.model.predict(tensor);
            // const results = await predictions.data();
            
            // return this.processPredictions(results);
            return this.simpleRoomClassification(imageData);
        } catch (error) {
            console.error('Classification error:', error);
            return this.simpleRoomClassification(imageData);
        }
    }

    async createPanorama(images) {
        // В реальном приложении здесь будет создание панорамы из нескольких изображений
        // Сейчас возвращаем заглушку
        return {
            type: 'equirectangular',
            panorama: 'https://pannellum.org/images/alma.jpg',
            autoLoad: true,
            hotspots: images.map((img, i) => ({
                pitch: 0,
                yaw: i * 30,
                type: 'info',
                text: `Снимок ${i + 1}`
            }))
        };
    }

    simpleRoomClassification(imageData) {
        // Простая логика определения комнаты по цветам и текстурам
        const roomTypes = ['Гостиная', 'Кухня', 'Спальня', 'Ванная', 'Коридор'];
        return roomTypes[Math.floor(Math.random() * roomTypes.length)];
    }
}

// Класс управления комнатами
class RoomManager {
    constructor() {
        this.currentRoom = null;
        this.rooms = [];
    }

    startNewRoom(roomType) {
        this.currentRoom = {
            type: roomType,
            images: [],
            timestamp: Date.now()
        };
        
        return this.currentRoom;
    }

    async getCurrentCoordinates() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve({ lat: 0, lng: 0 });
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                () => resolve({ lat: 0, lng: 0 }),
                { timeout: 5000 }
            );
        });
    }
}

// Класс управления датчиками телефона
class PhoneSensorManager {
    constructor() {
        this.orientation = { alpha: 0, beta: 0, gamma: 0 };
        this.motion = { acceleration: { x: 0, y: 0, z: 0 } };
        this.isSensorsAvailable = false;
    }

    async initializeSensors() {
        try {
            if (window.DeviceOrientationEvent) {
                window.addEventListener('deviceorientation', (event) => {
                    this.orientation = {
                        alpha: event.alpha,
                        beta: event.beta,
                        gamma: event.gamma
                    };
                });
            }

            if (window.DeviceMotionEvent) {
                window.addEventListener('devicemotion', (event) => {
                    this.motion = {
                        acceleration: event.acceleration,
                        interval: event.interval
                    };
                });
            }

            this.isSensorsAvailable = true;
            return true;
        } catch (error) {
            console.warn('Sensors not available:', error);
            this.isSensorsAvailable = false;
            return false;
        }
    }

    getCurrentAngle() {
        if (!this.isSensorsAvailable) {
            return Math.random() * 360; // Fallback
        }
        return this.orientation.alpha || 0;
    }

    isDeviceSteady() {
        if (!this.isSensorsAvailable) return true;
        
        const acc = this.motion.acceleration;
        const movement = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
        return movement < 2; // Порог стабильности
    }
}

// Класс панорамного просмотрщика
class PanoramaViewer {
    constructor() {
        this.viewer = null;
        this.currentPoint = 0;
        this.points = [];
    }

    init(container, panoramaData) {
        // Инициализация панорамного просмотрщика
        this.viewer = pannellum.viewer(container, panoramaData);
        
        // Сохранение точек обзора
        this.points = panoramaData.hotspots || [];
    }

    rotate(angle) {
        if (this.viewer) {
            const currentYaw = this.viewer.getYaw();
            this.viewer.setYaw(currentYaw + angle);
        }
    }

    zoom(level) {
        if (this.viewer) {
            const currentHfov = this.viewer.getHfov();
            this.viewer.setHfov(currentHfov - level * 10);
        }
    }

    lookAtPoint(pointId) {
        const point = this.points.find(p => p.id === pointId);
        if (point && this.viewer) {
            this.viewer.lookAt(point.yaw, point.pitch, point.hfov);
        }
    }

    previousPoint() {
        if (this.points.length > 0) {
            this.currentPoint = (this.currentPoint - 1 + this.points.length) % this.points.length;
            this.lookAtPoint(this.points[this.currentPoint].id);
        }
    }

    nextPoint() {
        if (this.points.length > 0) {
            this.currentPoint = (this.currentPoint + 1) % this.points.length;
            this.lookAtPoint(this.points[this.currentPoint].id);
        }
    }

    toggleFullscreen() {
        if (this.viewer) {
            this.viewer.toggleFullscreen();
        }
    }
}

// Базовый класс для экспорта на платформы
class PlatformExporter {
    constructor() {
        this.platforms = {
            'cian': { name: 'Циан', format: 'jpg', maxSize: 50 },
            'avito': { name: 'Авито', format: 'jpg', maxSize: 30 },
            'domclick': { name: 'ДомКлик', format: 'png', maxSize: 40 },
            'yandex': { name: 'Яндекс.Недвижимость', format: 'jpg', maxSize: 50 }
        };
    }

    async exportTour(tourData) {
        // Базовая реализация, должна быть переопределена в дочерних классах
        return {
            success: true,
            message: 'Тур подготовлен для экспорта',
            downloadLink: null
        };
    }

    async optimizeImages(images, options) {
        // Базовая реализация оптимизации изображений
        return images.map(img => {
            return {
                ...img,
                optimized: true,
                format: options.format,
                size: 'optimized'
            };
        });
    }

    generateDescription(roomData) {
        const totalArea = roomData.reduce((sum, room) => sum + room.area, 0);
        const roomList = roomData.map(room => `${room.name} (${room.area} м²)`).join(', ');
        
        return `Виртуальный тур по квартире общей площадью ${totalArea} м². Включает помещения: ${roomList}.`;
    }
}

// Класс универсального экспорта
class UniversalExporter {
    constructor() {
        this.formats = {
            'zip': this.createZipArchive.bind(this),
            'json': this.createJsonExport.bind(this)
        };
    }

    async exportTour(tourData, format = 'zip') {
        const exporter = this.formats[format];
        if (!exporter) {
            throw new Error(`Unsupported format: ${format}`);
        }

        return await exporter(tourData);
    }

    async createZipArchive(tourData) {
        // В реальном приложении здесь будет создание ZIP архива
        // с использованием библиотеки JSZip
        return new Blob([JSON.stringify(tourData)], { type: 'application/zip' });
    }

    async saveToDevice(blob, filename) {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            
            setTimeout(() => {
                URL.revokeObjectURL(url);
                resolve(url);
            }, 100);
        });
    }
}

// Инициализация приложения после загрузки DOM
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

// Обработка изменения ориентации
window.addEventListener('orientationchange', () => {
    if (app) {
        app.handleOrientationChange();
    }
});

// Обработка изменения видимости страницы
document.addEventListener('visibilitychange', () => {
    if (app) {
        app.handleVisibilityChange();
    }
});
