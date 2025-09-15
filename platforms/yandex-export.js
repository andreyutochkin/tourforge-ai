class YandexExporter extends PlatformExporter {
    async exportTour(tourData) {
        try {
            // Логика подготовки тура для Яндекс.Недвижимость
            const preparedTour = await this.prepareForYandex(tourData);
            
            return {
                success: true,
                message: 'Тур подготовлен для Яндекс.Недвижимость',
                downloadLink: this.createDownloadLink(preparedTour)
            };
        } catch (error) {
            console.error('Yandex export error:', error);
            return {
                success: false,
                message: 'Ошибка подготовки для Яндекс.Недвижимость'
            };
        }
    }
    
    async prepareForYandex(tourData) {
        // Приведение изображений к требованиям Яндекс.Недвижимость
        const optimizedImages = await this.optimizeImages(tourData.images, {
            maxWidth: 2048,
            maxHeight: 2048,
            quality: 0.9,
            format: 'jpg'
        });
        
        // Создание описания тура
        const description = this.generateDescription(tourData.rooms);
        
        // Добавление специфичных метаданных для Яндекс
        const yandexMetadata = {
            ...tourData.rooms,
            platform: 'yandex_realty',
            version: '1.0',
            requirements: {
                image_format: 'jpg',
                max_size: '2048x2048',
                compression: 'high'
            }
        };
        
        return {
            images: optimizedImages,
            description: description,
            roomData: yandexMetadata,
            type: 'virtual_tour'
        };
    }
    
    createDownloadLink(tourData) {
        // Создание ссылки для скачивания подготовленных файлов
        const dataStr = JSON.stringify(tourData);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        return URL.createObjectURL(dataBlob);
    }
    
    // Уникальный метод для Яндекс - создание архива с туром
    async createTourArchive(tourData) {
        // В реальном приложении здесь будет создание ZIP архива
        // с использованием библиотеки JSZip
        return new Blob([JSON.stringify(tourData)], { type: 'application/zip' });
    }
}

// Добавляем экспортер в глобальную область видимости
window.yandexExporter = new YandexExporter();
