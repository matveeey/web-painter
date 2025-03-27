import { loadMesh } from '../utils/meshLoader.js';
import { loadCanvasMesh } from '../utils/meshLoader.js';

const defaultCamDistance = 300
const maxCamDistance = 5000
const defaultClipDistance = 10

export class SceneModel {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, defaultClipDistance, maxCamDistance);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement)
        this.loadedMesh = null;
        this.currentTool = 'rotate';
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.currentColor = '#000000';
        this.isZooming = false;
        this.initialDistance = 0;
        this.initialCameraZ = this.camera.position.z;


        // Создание линии для визуализации луча рейкастера
        this.raycasterLine = new THREE.Line(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0xff0000 })
        );
        this.raycasterLine.visible = false;
        this.scene.add(this.raycasterLine);
    }

    loadMeshAndTexture(texturePath, meshPath) {
        loadMesh(this.scene, texturePath, meshPath, (mesh) => {
            this.loadedMesh = mesh;
            this.camera.position.z = defaultCamDistance;
        });
    }

    loadCanvasMesh(meshPath) {
        loadCanvasMesh(this.scene, meshPath, (mesh, texture) => {
            this.canvasMesh = mesh;
            this.canvasTexture = texture;
            this.canvasMesh.traverse((child) => {
                if (child.isMesh) {
                    console.log('Mesh position:', child.position);
                }
            });
        });
    }

    addLights() {
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1);
        this.scene.add(light);

        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
    }

    setTool(tool) {
        this.currentTool = tool;
    }

    setColor(color) {
        this.currentColor = color;
    }

    handleMouseDown(e) {
        this.isMouseDown = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }

    handleMouseUp() {
        this.isMouseDown = false;
    }

    handleMouseMove(e) {
        if (!this.isMouseDown) return;

        if (this.currentTool === 'rotate') {
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;
            if (this.loadedMesh) {
                this.loadedMesh.rotation.y += deltaX * 0.01;
                this.loadedMesh.rotation.x += deltaY * 0.01;
            }
        } else if (this.currentTool === 'brush') {
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1
            );
            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.scene.children);

            // Визуализация луча рейкастера
            let origin = new THREE.Vector3();
            let direction = new THREE.Vector3();
            // raycaster.ray.origin.toArray(origin.toArray());
            // raycaster.ray.direction.multiplyScalar(1000).toArray(direction.toArray());

            origin = raycaster.ray.origin;
            direction = raycaster.ray.direction;

            this.raycasterLine.geometry.setFromPoints([origin, direction]);
            this.raycasterLine.visible = true;
            console.log('this.scene.children:', this.scene.children);
            if (intersects.length > 0) {
                console.log('intersecting'); // Логирование для отладки
                // const uv = intersects[0].uv;
                // const material = intersects[0].object.material;
                // const canvas = material.map.image;
                // const ctx = canvas.getContext('2d');
                // ctx.fillStyle = this.currentColor;
                // ctx.beginPath();
                // ctx.arc(uv.x * canvas.width, (1 - uv.y) * canvas.height, 5, 0, Math.PI * 2);
                // ctx.fill();
                // material.map.needsUpdate = true;
                const intersect = intersects[0];
                if (intersect.object === this.canvasMesh) {
                    console.log('brushing'); // Логирование для отладки
                    const uv = intersect.uv;
                    const canvas = this.canvasTexture.image;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = this.currentColor;
                    ctx.beginPath();
                    ctx.arc(uv.x * canvas.width, (1 - uv.y) * canvas.height, 5, 0, Math.PI * 2);
                    ctx.fill();
                    this.canvasTexture.needsUpdate = true;
                }
            }
        }

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }

    handleWheel(e) {
        const zoomFactor = 0.1;
        this.camera.position.z += e.deltaY * zoomFactor;
        this.camera.position.z = Math.max(1, Math.min(maxCamDistance, this.camera.position.z));
    }

    handleTouchStart(e) {
        if (e.touches.length === 2) {
            this.isZooming = true;
            this.initialDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            this.initialCameraZ = this.camera.position.z;
        }
    }

    handleTouchMove(e) {
        if (this.isZooming && e.touches.length === 2) {
            const currentDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const zoomFactor = 0.01;
            this.camera.position.z = this.initialCameraZ * (1 + (currentDistance - this.initialDistance) * zoomFactor);
            this.camera.position.z = Math.max(1, Math.min(maxCamDistance, this.camera.position.z));
        }
    }

    handleTouchEnd() {
        this.isZooming = false;
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}