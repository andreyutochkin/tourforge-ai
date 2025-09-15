class DomClickExporter extends PlatformExporter {
    async exportTour(images, roomData) {
        try {
            const preparedTour = await this.prepareForDomClick(images, roomData);
            
            return {
                success: true,
                message: 'Тур подготовлен для ДомКлик',
                url: this.generateDomClickUrl(preparedTour),
                downloadLink: this.createDownloadLink(preparedTour, 'domclick')
            };
        } catch (error) {
            console.error('DomClick export error:', error);
            return {
                success: false,
                message: 'Ошибка подготовки для ДомКлик'
            };
        }
    }
    
    async prepareForDomClick(images, roomData) {
        const optimizedImages = await this.optimizeImages(images, {
            maxWidth: 2048,
            maxHeight: 1536,
            quality: 0.85,
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
    
    generateDomClickUrl(tourData) {
        return `https://domclick.ru/add-property?tour=${encodeURIComponent(JSON.stringify(tourData))}`;
    }
    
    createDownloadLink(tourData, platform) {
        const dataStr = JSON.stringify(tourData);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        return URL.createObjectURL(dataBlob);
    }
}

window.domclickExporter = new DomClickExporter();
