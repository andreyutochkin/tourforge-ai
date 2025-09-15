class AvitoExporter extends PlatformExporter {
    async exportTour(tourData) {
        try {
            const preparedTour = await this.prepareForAvito(tourData);
            
            return {
                success: true,
                message: 'Тур подготовлен для Авито',
                downloadLink: this.createDownloadLink(preparedTour)
            };
        } catch (error) {
            console.error('Avito export error:', error);
            return {
                success: false,
                message: 'Ошибка подготовки для Авито'
            };
        }
    }
    
    async prepareForAvito(tourData) {
        const optimizedImages = await this.optimizeImages(tourData.images, {
            maxWidth: 1600,
            maxHeight: 1200,
            quality: 0.75,
            format: 'jpg'
        });
        
        const description = this.generateDescription(tourData.rooms);
        
        return {
            images: optimizedImages,
            description: description,
            roomData: tourData.rooms,
            type: 'virtual_tour'
        };
    }
    
    createDownloadLink(tourData) {
        const dataStr = JSON.stringify(tourData);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        return URL.createObjectURL(dataBlob);
    }
}

window.avitoExporter = new AvitoExporter();
