class AvitoExporter extends PlatformExporter {
    async exportTour(images, roomData) {
        try {
            const preparedTour = await this.prepareForAvito(images, roomData);
            
            return {
                success: true,
                message: 'Тур подготовлен для Авито',
                url: this.generateAvitoUrl(preparedTour),
                downloadLink: this.createDownloadLink(preparedTour, 'avito')
            };
        } catch (error) {
            console.error('Avito export error:', error);
            return {
                success: false,
                message: 'Ошибка подготовки для Авито'
            };
        }
    }
    
    async prepareForAvito(images, roomData) {
        const optimizedImages = await this.optimizeImages(images, {
            maxWidth: 1600,
            maxHeight: 1200,
            quality: 0.75,
            format: 'jpg'
        });
        
        const description = this.generateDescription(roomData);
        
        return {
            images: optimizedImages,
            description: description,
            roomData: roomData,
            type: 'virtual_tour'
        };
    }
    
    generateAvitoUrl(tourData) {
        return `https://www.avito.ru/add-item?tourData=${encodeURIComponent(JSON.stringify(tourData))}`;
    }
    
    createDownloadLink(tourData, platform) {
        const dataStr = JSON.stringify(tourData);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        return URL.createObjectURL(dataBlob);
    }
}

window.avitoExporter = new AvitoExporter();
