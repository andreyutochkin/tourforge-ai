class DomClickExporter extends PlatformExporter {
    async exportTour(tourData) {
        try {
            const preparedTour = await this.prepareForDomClick(tourData);
            
            return {
                success: true,
                message: 'Тур подготовлен для ДомКлик',
                downloadLink: this.createDownloadLink(preparedTour)
            };
        } catch (error) {
            console.error('DomClick export error:', error);
            return {
                success: false,
                message: 'Ошибка подготовки для ДомКлик'
            };
        }
    }
    
    async prepareForDomClick(tourData) {
        const optimizedImages = await this.optimizeImages(tourData.images, {
            maxWidth: 2048,
            maxHeight: 1536,
            quality: 0.85,
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

window.domclickExporter = new DomClickExporter();
