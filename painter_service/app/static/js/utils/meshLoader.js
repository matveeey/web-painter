export function loadMesh(scene, texturePath, meshPath, onLoad) {
    const loader = new THREE.GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    textureLoader.load(texturePath, (texture) => {
        loader.load(meshPath, (gltf) => {
            const mesh = gltf.scene;
            mesh.name = `mesh`
                
            mesh.side = THREE.DoubleSide;
            // Apply the texture to the mesh material
            mesh.traverse((child) => {
                if (child.isMesh) {
                    console.log(`setted side to doubleside on `, child);
                    child.material.map = texture;
                    child.material.needsUpdate = true;
                    child.material.side = THREE.DoubleSide;
                }
            });

            // Add the mesh to the scene
            scene.add(mesh);

            // Call the onLoad callback with the loaded mesh
            if (onLoad)
                onLoad(mesh);

        }, undefined, (error) => {
            console.error('An error occurred while loading the mesh', error);
        });
    });
}

export function loadCanvasMesh(scene, meshPath, onLoad) {
    const loader = new THREE.GLTFLoader();

    loader.load(meshPath, (gltf) => {
        const mesh = gltf.scene;
        mesh.name = `canvasMesh`

        mesh.scale.set(1.05, 1.05, 1.05); // 5% difference from original model

        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        mesh.side = THREE.DoubleSide;
        mesh.traverse((child) => {
            if (child.isMesh) {
                child.material.map = texture;
                child.material.needsUpdate = true;
            }
        });
        
        scene.add(mesh);

        if (onLoad) {
            onLoad(mesh, texture);
        }

    }, undefined, (error) => {
        console.error('An error occurred while loading the canvas mesh', error);
    });
}