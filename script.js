// Основной класс приложения
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

    // Инициализация приложения
    initializeApp() {
        this.bindEvents();
        this.checkCameraAccess();
        this.loadSounds();
        this.setupServiceWorker();
        this.loadTours();
    }

    // Привязка событий
    bindEvents() {
        // Навигация
        document.getElementById('startTour').addEventListener('click', () => this.showCameraScreen());
        document.getElementById('myTours').addEventListener('click', () => this.showToursScreen());
        document.getElementById('backFromTours').addEventListener('click', () => this.showHomeScreen());
        document.getElementById('backFromCamera').addEventListener('click', () => this.showHomeScreen());
        document.getElementById('backFromViewer').addEventListener('click', () => this.showResultScreen());
        document.getElementById('createFirstTour').addEventListener('click', () => this.showCameraScreen());
        
        // Управление камерой
        document.getElementById('captureButton').addEventListener('click', () => this.captureImage());
        document.getElementById('switchCamera').addEventListener('click', () => this.switchCamera());
        document.getElementById('toggleFlash').addEventListener('click', () => this.toggleFlash());
        
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
        
        // Модальное окно
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeModal());
        document.getElementById('saveEdit').addEventListener('click', () => this.saveEdit());
        
        // Инструменты редактирования
        document.querySelectorAll('.edit-tool').forEach(tool => {
            tool.addEventListener('click', (e) => this.selectEditTool(e.target.dataset.tool));
        });
        
        // Управление туром
        document.getElementById('zoomIn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOut').addEventListener('click', () => this.zoomOut());
        document.getElementById('fullscreen').addEventListener('click', () => this.toggleFullscreen());
        
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
                    <p>У вас пока нет созданных туров</p>
                    <button class="btn-primary" id="createFirstTour">Создать первый тур</button>
                </div>
            `;
            document.getElementById('createFirstTour').addEventListener('click', () => this.showCameraScreen());
            return;
        }
        
        toursList.innerHTML = tours.map(tour => `
            <div class="tour-item">
                <div class="tour-item-header">
                    <div class="tour-item-title">${tour.name}</div>
                    <div class="tour-item-date">${new Date(tour.date).toLocaleDateString()}</div>
                </div>
                <div class="tour-item-preview" style="background: url('${tour.preview}') center/cover;"></div>
                <div class="tour-item-actions">
                    <button class="tour-item-action" onclick="app.viewSavedTour(${tour.id})">Просмотр</button>
                    <button class="tour-item-action" onclick="app.shareTour(${tour.id})">Поделиться</button>
                    <button class="tour-item-action" onclick="app.deleteTour(${tour.id})">Удалить</button>
                </div>
            </div>
        `).join('');
    }

    // Показать главный экран
    showHomeScreen() {
        this.hideAllScreens();
        document.getElementById('homeScreen').style.display = 'flex';
        this.currentScreen = 'home';
    }

    // Показать экран списка туров
    showToursScreen() {
        this.hideAllScreens();
        document.getElementById('toursScreen').style.display = 'flex';
        this.currentScreen = 'tours';
        this.loadTours();
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

    // Переключение камеры
    async switchCamera() {
        this.stopCamera();
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: this.mediaStream ? 'user' : 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                } 
            });
            this.mediaStream = stream;
            
            const video = document.getElementById('cameraView');
            video.srcObject = stream;
            await video.play();
            
            this.showToast('Камера переключена', 'success');
        } catch (error) {
            this.showToast('Ошибка переключения камеры', 'error');
            console.error('Camera switch error:', error);
        }
    }

    // Переключение вспышки
    toggleFlash() {
        // Реализация включения/выключения вспышки
        this.showToast('Вспышка пока не поддерживается', 'info');
    }

    // Запуск системы подсказок
    startGuidance() {
        this.currentStep = 1;
        this.capturesPerRoom = 0;
        this.currentRoomIndex = 0;
        this.updateProgress();
        this.updateRoomNavigation();
        
        this.voiceGuide.speak(`Начинаем съемку ${this.rooms[this.currentRoomIndex]}. Встаньте в центре комнаты и медленно поворачивайтесь на 360 градусов. Делайте снимки каждые 45 градусов.`);
        
        this.showOverlayInstruction(`Снимаем ${this.rooms[this.currentRoomIndex]}. Делайте снимки каждые 45 градусов.`);
    }

    // Обновление прогресса
    updateProgress() {
        document.getElementById('currentStep').textContent = this.currentStep;
        document.getElementById('totalSteps').textContent = this.totalSteps;
        
        const progress = (this.currentStep / this.totalSteps) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = `${Math.round(progress)}%`;
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
            room: this.rooms[this.currentRoomIndex],
            timestamp: Date.now(),
            angle: this.capturesPerRoom * 45
        });
        
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
        
        this.isProcessing = false;
    }

    // Переход к следующей комнате
    nextRoom() {
        if (this.currentRoomIndex < this.rooms.length - 1) {
            this.currentRoomIndex++;
            this.capturesPerRoom = 0;
            this.updateRoomNavigation();
            
            this.voiceGuide.speak(`Начинаем съемку ${this.rooms[this.currentRoomIndex]}. Встаньте в центре комнаты и медленно поворачивайтесь.`);
            this.showOverlayInstruction(`Снимаем ${this.rooms[this.currentRoomIndex]}. Делайте снимки каждые 45 градусов.`);
        } else {
            this.voiceGuide.speak("Все комнаты сфотографированы. Начинаем обработку.");
            this.processImages();
        }
    }

    // Переход к предыдущей комнате
    previousRoom() {
        if (this.currentRoomIndex > 0) {
            this.currentRoomIndex--;
            this.capturesPerRoom = 0;
            this.updateRoomNavigation();
            
            this.voiceGuide.speak(`Возвращаемся к съемке ${this.rooms[this.currentRoomIndex]}.`);
            this.showOverlayInstruction(`Снимаем ${this.rooms[this.currentRoomIndex]}. Делайте снимки каждые 45 градусов.`);
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
        const status = document.getElementById('aiStatus');
        
        for (let i = 0; i < steps.length; i++) {
            await this.simulateProcessingStep(steps[i], i, status);
        }
        
        // Генерация плана помещения
        await this.generateFloorPlan();
        
        // Показ результатов
        this.showResults();
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

    // Сохранение тура
    saveTour() {
        const tour = {
            id: Date.now(),
            name: `Тур от ${new Date().toLocaleDateString()}`,
            date: new Date().toISOString(),
            preview: this.capturedImages[0]?.data || '',
            rooms: this.roomData,
            images: this.capturedImages
        };
        
        const tours = JSON.parse(localStorage.getItem('tours') || '[]');
        tours.push(tour);
        localStorage.setItem('tours', JSON.stringify(tours));
        
        this.currentTourId = tour.id;
    }

    // Показать результаты
    showResults() {
        this.hideAllScreens();
        document.getElementById('resultScreen').style.display = 'flex';
        this.currentScreen = 'results';
        
        this.playSound('success');
        this.showToast('План помещения успешно создан!', 'success');
        this.voiceGuide.speak('Ваш тур готов! Вы можете просмотреть его, отредактировать план или поделиться с другими.');
    }

    // Просмотр тура
    viewTour() {
        this.hideAllScreens();
        document.getElementById('tourViewerScreen').style.display = 'flex';
        this.currentScreen = 'viewer';
        
        this.loadTourViewer();
    }

    // Загрузка просмотрщика тура
    loadTourViewer() {
        const tourContainer = document.getElementById('tourContainer');
        const hotspotsContainer = document.getElementById('tourHotspots');
        
        // Симуляция загрузки
        tourContainer.innerHTML = `
            <div class="tour-loading">
                <p>Загрузка 3D тура...</p>
                <div class="loader"></div>
            </div>
        `;
        
        // Через 2 секунды "загружаем" тур
        setTimeout(() => {
            tourContainer.innerHTML = `
                <div class="tour-content">
                    <img src="${this.capturedImages[0]?.data}" alt="3D тур" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
            `;
            
            // Добавляем горячие точки
            hotspotsContainer.innerHTML = `
                <div class="hotspot-item" data-target="living-room">Гостиная</div>
                <div class="hotspot-item" data-target="kitchen">Кухня</div>
                <div class="hotspot-item" data-target="bedroom">Спальня</div>
                <div class="hotspot-item" data-target="bathroom">Ванная</div>
            `;
            
            // Добавляем обработчики для горячих точек
            document.querySelectorAll('.hotspot-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.voiceGuide.speak(`Переходим к ${item.textContent}`);
                    this.showToast(`Переход к ${item.textContent}`, 'info');
                });
            });
        }, 2000);
    }

    // Увеличение
    zoomIn() {
        this.showToast('Увеличиваем', 'info');
    }

    // Уменьшение
    zoomOut() {
        this.showToast('Уменьшаем', 'info');
    }

    // Полноэкранный режим
    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
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
                const result = await exporter.exportTour(this.capturedImages, this.roomData);
                this.showToast(`Тур подготовлен для ${platform}`, 'success');
                
                // Предложить скачать или скопировать ссылку
                if (result.url) {
                    window.open(result.url, '_blank');
                }
            } else {
                this.showToast(`Экспорт на ${platform} пока не поддерживается`, 'error');
            }
        } catch (error) {
            this.showToast(`Ошибка экспорта на ${platform}`, 'error');
            console.error('Export error:', error);
        }
    }

    // Редактирование плана
    editPlan() {
        document.getElementById('editModal').style.display = 'flex';
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
        document.querySelectorAll('.edit-tool').forEach(t => t.classList.remove('active'));
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
        document.getElementById('editModal').style.display = 'none';
    }

    // Сохранение изменений
    saveEdit() {
        // Здесь будет логика сохранения изменений
        this.showToast('Изменения сохранены', 'success');
        this.closeModal();
        
        // Перерисовываем план с изменениями
        this.drawFloorPlan();
    }

    // Назад
    goBack() {
        switch (this.currentScreen) {
            case 'camera':
                this.stopCamera();
                this.showHomeScreen();
                break;
            case 'processing':
                this.stopProcessing();
                this.showCameraScreen();
                break;
            case 'results':
                this.showHomeScreen();
                break;
            case 'viewer':
                this.showResultScreen();
                break;
            case 'tours':
                this.showHomeScreen();
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

// Базовый класс для экспорта на платформы
class PlatformExporter {
    constructor() {
        this.platforms = {
            'cian': { name: 'Циан', format: 'jpg', maxSize: 50 },
            'avito': { name: 'Авито', format: 'jpg', maxSize: 30 },
            'domclick': { name: 'ДомКлик', format: 'png', maxSize: 40 }
        };
    }

    async exportTour(images, roomData) {
        // Базовая реализация, должна быть переопределена в дочерних классах
        return {
            success: true,
            message: 'Тур подготовлен для экспорта',
            url: null
        };
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
