class TourNavigation {
  constructor() {
    this.currentPosition = null;
    this.roomPositions = {
      livingroom: [
        { id: 'center', x: 0, y: 0, z: 0 },
        { id: 'corner1', x: -5, y: 0, z: -5 },
        { id: 'corner2', x: 5, y: 0, z: -5 },
        { id: 'corner3', x: -5, y: 0, z: 5 },
        { id: 'corner4', x: 5, y: 0, z: 5 }
      ],
      kitchen: [
        // Аналогичные координаты для кухни
      ]
    };
  }

  // Перемещение между точками комнаты
  moveToPosition(room, positionId) {
    const targetPosition = this.roomPositions[room].find(p => p.id === positionId);
    if (targetPosition) {
      this.currentPosition = targetPosition;
      this.updateCameraPosition();
      this.updateNavigationUI();
    }
  }

  // Обновление позиции камеры
  updateCameraPosition() {
    if (window.camera && this.currentPosition) {
      gsap.to(window.camera.position, {
        x: this.currentPosition.x,
        y: this.currentPosition.y,
        z: this.currentPosition.z,
        duration: 1.0
      });
    }
  }

  // Обновление интерфейса навигации
  updateNavigationUI() {
    const navElements = document.querySelectorAll('.nav-point');
    navElements.forEach(el => {
      el.classList.remove('active');
      if (el.dataset.position === this.currentPosition.id) {
        el.classList.add('active');
      }
    });
  }

  // Инициализация навигации
  initNavigation() {
    this.createNavigationUI();
    this.setupEventListeners();
  }

  // Создание UI элементов навигации
  createNavigationUI() {
    const navContainer = document.createElement('div');
    navContainer.className = 'navigation-ui';
    
    // Добавление кнопок для каждой точки навигации
    this.roomPositions.livingroom.forEach(point => {
      const btn = document.createElement('button');
      btn.className = 'nav-point';
      btn.dataset.position = point.id;
      btn.textContent = this.getPositionName(point.id);
      navContainer.appendChild(btn);
    });
    
    document.body.appendChild(navContainer);
  }

  getPositionName(positionId) {
    const names = {
      center: 'Центр',
      corner1: 'Угол 1',
      corner2: 'Угол 2',
      corner3: 'Угол 3',
      corner4: 'Угол 4'
    };
    return names[positionId] || positionId;
  }
}
