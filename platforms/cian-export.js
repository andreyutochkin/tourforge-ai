class CianExporter extends PlatformExporter {
    async exportTour(images, roomData) {
        try {
            // Логика подготовки тура для Циан
            const preparedTour = await this.prepareForCian(images, roomData);
            
            return {
                success: true,
                message: 'Тур подготовлен для Циан',
                url: this.generateCianUrl(preparedTour),
                downloadLink: this.createDownloadLink(preparedTour, 'cian')
            };
        } catch (error) {
            console.error('Cian export error:', error);
            return {
                success: false,
                message: 'Ошибка подготовки для Циан'
            };
        }
    }
    
    async prepareForCian(images, roomData) {
        // Приведение изображений к требованиям Циан
        const optimizedImages = await this.optimizeImages(images, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            format: 'jpg'
        });
        
        // Создание описания тура
        const description = this.generateDescription(roomData);
        
        return {
            images: optimizedImages,
            description: description,
            roomData: roomData,
            type: 'virtual_tour'
        };
    }
    
    generateCianUrl(tourData) {
        // Генерация URL для загрузки на Циан
        return `https://www.cian.ru/add-object/?type=virtual_tour&data=${encodeURIComponent(JSON.stringify(tourData))}`;
    }
    
    createDownloadLink(tourData, platform) {
        // Создание ссылки для скачивания подготовленных файлов
        const dataStr = JSON.stringify(tourData);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        return URL.createObjectURL(dataBlob);
    }
}

// Добавляем экспортер в глобальную область видимости
window.cianExporter = new CianExporter();
