import * as THREE from 'three';
import {TTFLoader} from 'three/examples/jsm/loaders/TTFLoader.js';
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader.js';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';

export function createText(scene, text, size, height, textFormPos, textPos) {
    const loader = new TTFLoader();
    loader.load('../public/fonts/PixeloidMono-d94EV.ttf', function (json) {
        const geometry = new TextGeometry(text, {
            font: new FontLoader().parse(json),
            size: size,
            height: height,
            curveSegments: 8,
            bevelEnabled: false
        });
        const material = new THREE.MeshBasicMaterial({
            color: "white",
            wireframe: false,
            transparent: false,
            opacity: 1,
            side: THREE.DoubleSide
        });

        geometry.scale(textFormPos.x, textFormPos.y, textFormPos.z); // form of text
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(textPos.x, textPos.y, textPos.z); //position of text
        scene.add(mesh);
    });
}