class YandexExporter extends PlatformExporter {
    async exportTour(images, roomData) {
        try {
            // Логика подготовки тура для Яндекс.Недвижимость
            const preparedTour = await this.prepareForYandex(images, roomData);
            
            return {
                success: true,
                message: 'Тур подготовлен для Яндекс.Недвижимость',
                url: this.generateYandexUrl(preparedTour),
                downloadLink: this.createDownloadLink(preparedTour, 'yandex')
            };
        } catch (error) {
            console.error('Yandex export error:', error);
            return {
                success: false,
                message: 'Ошибка подготовки для Яндекс.Недвижимость'
            };
        }
    }
    
    async prepareForYandex(images, roomData) {
        // Приведение изображений к требованиям Яндекс.Недвижимость
        const optimizedImages = await this.optimizeImages(images, {
            maxWidth: 2048,
            maxHeight: 2048,
            quality: 0.9,
            format: 'jpg'
        });
        
        // Создание описания тура
        const description = this.generateDescription(roomData);
        
        // Добавление специфичных метаданных для Яндекс
        const yandexMetadata = {
            ...roomData,
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
    
    generateYandexUrl(tourData) {
        // Генерация URL для загрузки на Яндекс.Недвижимость
        return `https://realty.yandex.ru/add/?tourData=${encodeURIComponent(JSON.stringify(tourData))}`;
    }
    
    createDownloadLink(tourData, platform) {
        // Создание ссылки для скачивания подготовленных файлов
        const dataStr = JSON.stringify(tourData);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        return URL.createObjectURL(dataBlob);
    }
    
    // Уникальный метод для Яндекс - создание архива с туром
    async createTourArchive(tourData) {
        const zip = new JSZip();
        
        // Добавляем изображения
        tourData.images.forEach((img, index) => {
            zip.file(`images/room-${index}.jpg`, img.data.split(',')[1], {base64: true});
        });
        
        // Добавляем метаданные
        zip.file('tour-data.json', JSON.stringify(tourData, null, 2));
        
        // Добавляем HTML-просмотрщик
        const viewerHtml = this.generateViewerHtml(tourData);
        zip.file('viewer.html', viewerHtml);
        
        // Генерируем архив
        return await zip.generateAsync({type: 'blob'});
    }
    
    generateViewerHtml(tourData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>3D Тур - ${tourData.description}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { margin: 0; overflow: hidden; }
                .viewer-container { width: 100vw; height: 100vh; }
            </style>
        </head>
        <body>
            <div class="viewer-container" id="tourViewer"></div>
            <script>
                // Код просмотрщика тура
                const tourData = ${JSON.stringify(tourData)};
                // ... реализация просмотрщика ...
            </script>
        </body>
        </html>`;
    }
}

// Добавляем экспортер в глобальную область видимости
window.yandexExporter = new YandexExporter();
