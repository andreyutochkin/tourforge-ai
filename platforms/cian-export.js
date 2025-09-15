class CianExporter extends PlatformExporter {
    async exportTour(tourData) {
        try {
            // Логика подготовки тура для Циан
            const preparedTour = await this.prepareForCian(tourData);
            
            return {
                success: true,
                message: 'Тур подготовлен для Циан',
                downloadLink: this.createDownloadLink(preparedTour)
            };
        } catch (error) {
            console.error('Cian export error:', error);
            return {
                success: false,
                message: 'Ошибка подготовки для Циан'
            };
        }
    }
    
    async prepareForCian(tourData) {
        // Приведение изображений к требованиям Циан
        const optimizedImages = await this.optimizeImages(tourData.images, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            format: 'jpg'
        });
        
        // Создание описания тура
        const description = this.generateDescription(tourData.rooms);
        
        return {
            images: optimizedImages,
            description: description,
            roomData: tourData.rooms,
            type: 'virtual_tour'
        };
    }
    
    createDownloadLink(tourData) {
        // Создание ссылки для скачивания подготовленных файлов
        const dataStr = JSON.stringify(tourData);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        return URL.createObjectURL(dataBlob);
    }
}

// Добавляем экспортер в глобальную область видимости
window.cianExporter = new CianExporter();
