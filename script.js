document.addEventListener('DOMContentLoaded', function() {
    // Находим кнопки на странице
    const startButton = document.getElementById('startButton');
    const examplesButton = document.getElementById('examplesButton');
    
    // 1. Обработчик для кнопки "Начать создание тура"
    if (startButton) {
        startButton.addEventListener('click', function(event) {
            event.preventDefault(); // Отменяем стандартное поведение ссылки
            alert('Раздел "Создание тура" находится в активной разработке! Скоро здесь можно будет загружать 360° фото и создавать туры с помощью ИИ.');
        });
    }
    
    // 2. Обработчик для кнопки "Примеры работ"
    if (examplesButton) {
        examplesButton.addEventListener('click', function(event) {
            event.preventDefault();
            alert('Здесь скоро появятся лучшие примеры 3D-туров, созданных нашими пользователями.');
        });
    }
    
    console.log('TourForge AI инициализирован!');
});
