class YandexRealtyExporter {
    constructor() {
        this.requirements = {
            maxImageSize: 2048,
            formats: ['jpg', 'png'],
            maxFileSize: 10 * 1024 * 1024, // 10MB
            supportedTypes: ['virtual_tour', 'panorama', '3d_model']
        };
    }

    async prepareForYandex(tourData) {
        // Оптимизация изображений под требования Яндекс.Недвижимость
        const optimizedImages = await this.optimizeImages(tourData.images, {
            maxWidth: 2048,
            maxHeight: 2048,
            quality: 0.9,
            format: 'jpg'
        });

        // Создание метаданных специфичных для Яндекс
        const metadata = {
            platform: 'yandex_realty',
            version: '1.0',
            created: new Date().toISOString(),
            tour_id: this.generateTourId(),
            requirements: {
                image_format: 'jpg',
                max_size: '2048x2048',
                compression: 'high'
            }
        };

        return {
            images: optimizedImages,
            metadata: metadata,
            room_data: tourData.rooms,
            tour_info: this.generateTourInfo(tourData)
        };
    }

    async exportToYandex(tourData) {
        try {
            const preparedData = await this.prepareForYandex(tourData);
            
            // Создание ZIP архива для Яндекс
            const zipBlob = await this.createYandexZipArchive(preparedData);
            
            // Сохранение на устройство
            const downloadUrl = await this.saveToDevice(zipBlob, 'yandex-export.zip');
            
            return {
                success: true,
                downloadUrl: downloadUrl,
                message: 'Тур подготовлен для Яндекс.Недвижимость'
            };
        } catch (error) {
            console.error('Yandex export error:', error);
            return {
                success: false,
                message: 'Ошибка при подготовке для Яндекс: ' + error.message
            };
        }
    }

    async createYandexZipArchive(tourData) {
        const zip = new JSZip();
        
        // Добавляем оптимизированные изображения
        tourData.images.forEach((image, index) => {
            const imgData = image.data.split(',')[1];
            zip.file(`images/room-${index}.jpg`, imgData, { base64: true });
        });
        
        // Добавляем метаданные
        zip.file('metadata.json', JSON.stringify(tourData.metadata, null, 2));
        
        // Добавляем информацию о туре
        zip.file('tour-info.json', JSON.stringify(tourData.tour_info, null, 2));
        
        // Добавляем HTML просмотрщик
        zip.file('viewer.html', this.generateViewerHtml(tourData));
        
        return await zip.generateAsync({ type: 'blob' });
    }
}
