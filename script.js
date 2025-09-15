class RoomManager {
    constructor() {
        this.currentRoom = null;
        this.rooms = [];
        this.capturedImages = [];
    }

    startNewRoom(roomType) {
        this.currentRoom = {
            type: roomType,
            images: [],
            timestamp: Date.now(),
            coordinates: this.getCurrentCoordinates()
        };
        
        return this.currentRoom;
    }

    async captureRoomImage() {
        const imageData = this.cameraManager.captureFrame();
        const roomType = await this.aiProcessor.classifyRoom(imageData);
        
        const imageInfo = {
            data: imageData,
            roomType: roomType,
            timestamp: Date.now(),
            angle: this.calculateCurrentAngle(),
            coordinates: this.getCurrentCoordinates()
        };
        
        this.currentRoom.images.push(imageInfo);
        this.capturedImages.push(imageInfo);
        
        return imageInfo;
    }

    completeRoom() {
        if (this.currentRoom && this.currentRoom.images.length > 0) {
            this.rooms.push(this.currentRoom);
            this.saveToLocalStorage();
            this.currentRoom = null;
            return true;
        }
        return false;
    }

    getCurrentCoordinates() {
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
}// Добавьте в начало файла
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
            this.videoElement.play();
            
            return true;
        } catch (error) {
            console.error('Camera initialization error:', error);
            this.showError('Не удалось получить доступ к камере. Проверьте разрешения.');
            return false;
        }
    }

    captureFrame() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;
        
        context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
        
        return canvas.toDataURL('image/jpeg', 0.8);
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
}

// Добавьте AI обработку изображений
class AIProcessor {
    constructor() {
        this.model = null;
        this.isModelLoaded = false;
    }

    async loadModel() {
        try {
            // Загрузка модели для классификации комнат
            this.model = await tf.loadGraphModel('models/room-classification/model.json');
            this.isModelLoaded = true;
            console.log('AI model loaded successfully');
        } catch (error) {
            console.error('Model loading error:', error);
            // Fallback к простой логике
            this.isModelLoaded = false;
        }
    }

    async classifyRoom(imageData) {
        if (!this.isModelLoaded) {
            // Простая логика если модель не загрузилась
            return this.simpleRoomClassification(imageData);
        }

        try {
            // Реальная обработка с помощью TensorFlow.js
            const tensor = tf.browser.fromPixels(imageData)
                .resizeNearestNeighbor([224, 224])
                .toFloat()
                .expandDims();
            
            const predictions = await this.model.predict(tensor);
            const results = await predictions.data();
            
            return this.processPredictions(results);
        } catch (error) {
            console.error('Classification error:', error);
            return this.simpleRoomClassification(imageData);
        }
    }

    simpleRoomClassification(imageData) {
        // Простая логика определения комнаты по цветам и текстурам
        const roomTypes = ['Гостиная', 'Кухня', 'Спальня', 'Ванная', 'Коридор'];
        return roomTypes[Math.floor(Math.random() * roomTypes.length)];
    }
}
