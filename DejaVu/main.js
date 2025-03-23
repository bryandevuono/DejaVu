import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { createText } from './src/internal_models/createText';

let scene, camera, renderer, car, light;
let roadGeometry, roadMesh;
let obstacles = [];
let keys = {};
let speed = 0;
let driftMode = false;
let cameraOffset = new THREE.Vector3(0, 5, -10);

init();
animate();

function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lighting
    light = new THREE.PointLight(0xffffff, 500, 100);
    light.position.set(0, 20, 0);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040, 100));
    // text
    createText(scene, "DejaVu", 2, 0.5);
    // Model Loader
    const loader = new GLTFLoader().setPath('./public/mazda/');
    loader.load('scene.gltf', (gltf) => {
          const model = gltf.scene;
          car = model;
          scene.add(car);
          car.position.set(5, 15, 1);
          car.scale.set(1, 1, 1);
          
          // Camera position
          camera.position.copy(car.position.clone().add(cameraOffset));
          camera.lookAt(car.position);
        },
        (error) => {
          // Error handling
          console.error('Error loading GLTF model:', error);
        }
      );

    // NOTE: This is how to make a placeholder
    // const carGeometry = new THREE.BoxGeometry(1, 0.5, 2);
    // const carMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    // car = new THREE.Mesh(carGeometry, carMaterial);
    // scene.add(car);

    // Road
    createRoad();
    createCityEnvironment();

    // Obstacles
    setInterval(createObstacle, 3000);

    // Event listeners
    window.addEventListener('keydown', (e) => keys[e.key] = true);
    window.addEventListener('keyup', (e) => keys[e.key] = false);
}

function createRoad() {
    const roadShape = new THREE.Shape();
    roadShape.moveTo(0, 20); // (z, x)
    roadShape.lineTo(2, 5);
    roadShape.lineTo(0, 0);
    roadShape.lineTo(0, 0);
    roadShape.lineTo(0, 0);

    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 100),
        new THREE.Vector3(-150, 0, 200),
        new THREE.Vector3(25, 0, 300),
        new THREE.Vector3(0, 0, 400),
        new THREE.Vector3(0, 0, 120)
    ]);

    const extrudeSettings = {
        steps: 100,
        bevelEnabled: true,
        extrudePath: curve
    };

    roadGeometry = new THREE.ExtrudeGeometry(roadShape, extrudeSettings);
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
    scene.add(roadMesh);
}

function createCityEnvironment() {
    for(let i = 0; i < 20; i++) {
        const building = new THREE.Mesh(
            new THREE.BoxGeometry(5, Math.random()*20 + 10, 5),
            new THREE.MeshStandardMaterial({ color: 0x555555 })
        );
        building.position.x = (Math.random() - 0.5) * 100;
        building.position.y = building.geometry.parameters.height/2;
        building.position.z = i * 50 - 200;
        scene.add(building);
    }
}

function createObstacle() {
    const obstacle = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0xffff00 })
    );
    obstacle.position.x = (Math.random() - 0.5) * 4;
    obstacle.position.y = 0.5;
    obstacle.position.z = car.position.z + 50;
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function checkCollisions() {
    obstacles.forEach((obstacle, index) => {
        if(car.position.distanceTo(obstacle.position) < 1.5) {
            speed *= 0.5;
            scene.remove(obstacle);
            obstacles.splice(index, 1);
        }
    });
}

function updateCamera() {
    if (car) {
        const idealPosition = car.position.clone().add(cameraOffset);
        camera.position.lerp(idealPosition, 0.1);
        camera.lookAt(car.position);

        light.position.copy(camera.position);
    }
}

function animate() {
    requestAnimationFrame(animate);

    // Controls
    if(keys['ArrowUp']) speed += 0.02;
    // if(keys['ArrowDown']) speed -= 0.02; NOTE: makes the car go back (disabled now)
    speed *= 0.98;

    if (keys['ArrowLeft'] && driftMode) {
        car.rotation.y += 0.03 * 2.1;
        speed -= 0.02
        car.position.x += Math.sin(car.rotation.y) * speed;
    }
    else if(keys['ArrowLeft']) {
        car.rotation.y += 0.03;
    }

    if (keys['ArrowRight'] && driftMode) {
        car.rotation.y -= 0.03 * 2.1;
        speed -= 0.02;
        car.position.x += Math.sin(car.rotation.y) * speed;
    }
    else if(keys['ArrowRight']) {
        car.rotation.y -= 0.03;
    }
    
    driftMode = keys[' '];
    if (car) {
        car.position.x += Math.sin(car.rotation.y) * speed;
        car.position.z += Math.cos(car.rotation.y) * speed;
    }
    // Update camera and check collisions
    updateCamera();
    checkCollisions();

    // Update obstacles
    obstacles.forEach(obstacle => {
        obstacle.position.z -= speed * 2;
        if(obstacle.position.z < car.position.z - 20) {
            scene.remove(obstacle);
            obstacles.splice(obstacles.indexOf(obstacle), 1);
        }
    });

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});