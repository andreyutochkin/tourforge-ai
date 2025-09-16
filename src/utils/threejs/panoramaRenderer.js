import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class PanoramaRenderer {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.controls = null;
    this.sphere = null;
    
    this.init();
  }
  
  init() {
    // Настройка рендерера
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
    
    // Настройка камеры
    this.camera.position.set(0, 0, 0.1);
    
    // Настройка элементов управления
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.rotateSpeed = 0.5;
    
    // Добавление освещения
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    
    // Обработка изменения размера окна
    window.addEventListener('resize', () => this.onWindowResize());
    
    // Запуск анимации
    this.animate();
  }
  
  loadPanorama(imageUrl) {
    // Очистка предыдущей панорамы
    if (this.sphere) {
      this.scene.remove(this.sphere);
    }
    
    // Создание текстуры из изображения
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageUrl, (texture) => {
      // Создание сферы для панорамы
      const geometry = new THREE.SphereGeometry(50, 60, 40);
      geometry.scale(-1, 1, 1); // Инвертируем геометрию для корректного отображения
      
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide
      });
      
      this.sphere = new THREE.Mesh(geometry, material);
      this.scene.add(this.sphere);
    });
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  
  dispose() {
    window.removeEventListener('resize', () => this.onWindowResize());
    this.renderer.dispose();
  }
}
