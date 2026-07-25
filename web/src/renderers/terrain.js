import * as THREE from "three";

export function initializeTerrain() {
  const canvas = document.querySelector("#mars-grid-3d");
  const hint = document.querySelector("#terrain-hint");
  if (!canvas) return;

  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x12161c, 0.052);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    const terrain = new THREE.Group();
    const sky = new THREE.Group();
    scene.add(terrain, sky);

    const hemisphere = new THREE.HemisphereLight(0xafe9df, 0x3a1718, 2.3);
    const sun = new THREE.DirectionalLight(0xffc690, 3.4);
    sun.position.set(-4, 9, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(hemisphere, sun);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(6.35, 6.75, 0.34, 64),
      new THREE.MeshStandardMaterial({ color: 0x15242b, roughness: 0.78, metalness: 0.22 }),
    );
    base.position.y = -0.18;
    base.receiveShadow = true;
    scene.add(base);

    const grid = new THREE.GridHelper(10, 10, 0x5fb7ae, 0x284249);
    grid.position.y = 0.02;
    grid.material.transparent = true;
    grid.material.opacity = 0.2;
    scene.add(grid);

    const tileGeometry = new THREE.BoxGeometry(0.88, 0.22, 0.88);
    const rockGeometry = new THREE.DodecahedronGeometry(0.29, 0);
    const startGeometry = new THREE.TorusGeometry(0.31, 0.018, 8, 30);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x263d45,
      roughness: 0.78,
      metalness: 0.12,
    });
    const exploredMaterial = new THREE.MeshStandardMaterial({
      color: 0x276a68,
      emissive: 0x0b4e4c,
      emissiveIntensity: 0.55,
      roughness: 0.58,
      metalness: 0.2,
    });
    const obstacleMaterial = new THREE.MeshStandardMaterial({
      color: 0x4e2d30,
      roughness: 0.92,
      metalness: 0.03,
    });
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x9f5342,
      roughness: 0.94,
      metalness: 0.02,
    });
    const startMaterial = new THREE.MeshBasicMaterial({
      color: 0xf7c66e,
      transparent: true,
      opacity: 0.9,
    });
    const hoverMaterial = new THREE.MeshBasicMaterial({
      color: 0x9ff5e5,
      transparent: true,
      opacity: 0.6,
    });

    const rover = new THREE.Group();
    const roverBody = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.19, 0.26, 8, 16),
      new THREE.MeshStandardMaterial({
        color: 0xf6c56c,
        emissive: 0x754416,
        emissiveIntensity: 0.55,
        roughness: 0.35,
        metalness: 0.48,
      }),
    );
    roverBody.rotation.z = Math.PI / 2;
    roverBody.castShadow = true;
    const roverDeck = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.07, 0.27),
      new THREE.MeshStandardMaterial({ color: 0xdceeea, roughness: 0.32, metalness: 0.86 }),
    );
    roverDeck.position.y = 0.14;
    roverDeck.castShadow = true;
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.3, 10),
      new THREE.MeshStandardMaterial({
        color: 0x9cfff0,
        emissive: 0x2a867b,
        emissiveIntensity: 1.1,
        roughness: 0.3,
        metalness: 0.7,
      }),
    );
    antenna.position.y = 0.34;
    const beacon = new THREE.PointLight(0x7ff6e4, 1.8, 2.5);
    beacon.position.y = 0.47;
    const roverRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.013, 6, 30),
      hoverMaterial,
    );
    roverRing.rotation.x = Math.PI / 2;
    roverRing.position.y = 0.03;
    rover.add(roverBody, roverDeck, antenna, beacon, roverRing);
    scene.add(rover);

    const selection = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.012, 6, 30),
      hoverMaterial,
    );
    selection.rotation.x = Math.PI / 2;
    selection.visible = false;
    scene.add(selection);

    const dustGeometry = new THREE.BufferGeometry();
    const dust = [];
    for (let index = 0; index < 180; index += 1) {
      dust.push(
        ((index * 47) % 17) - 8.5,
        0.8 + ((index * 31) % 38) / 10,
        ((index * 79) % 17) - 8.5,
      );
    }
    dustGeometry.setAttribute("position", new THREE.Float32BufferAttribute(dust, 3));
    const dustCloud = new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({
        color: 0x8de5d5,
        size: 0.025,
        transparent: true,
        opacity: 0.48,
      }),
    );
    sky.add(dustCloud);

    let mapSignature = "";
    let latestMap = null;
    const tileMeshes = new Map();
    const pickables = [];
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let yaw = -0.68;
    let pitch = 0.82;
    let radius = 16;
    let pointerStart = null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function tilePosition(x, y, width, height) {
      return new THREE.Vector3(x - (width - 1) / 2, 0.14, y - (height - 1) / 2);
    }

    function setHint(message) {
      if (hint) hint.textContent = message;
    }

    function updateCamera() {
      camera.position.set(
        radius * Math.cos(pitch) * Math.sin(yaw),
        radius * Math.sin(pitch),
        radius * Math.cos(pitch) * Math.cos(yaw),
      );
      camera.lookAt(0, 0, 0);
    }

    function buildTerrain(state) {
      terrain.clear();
      tileMeshes.clear();
      pickables.length = 0;

      for (let y = 0; y < state.height; y += 1) {
        for (let x = 0; x < state.width; x += 1) {
          const key = `${x},${y}`;
          const obstacle = state.tiles[y][x] === "obstacle";
          const tile = new THREE.Mesh(
            tileGeometry,
            obstacle ? obstacleMaterial : groundMaterial,
          );
          tile.position.copy(tilePosition(x, y, state.width, state.height));
          tile.receiveShadow = true;
          tile.userData.gridPosition = { x, y, key };
          terrain.add(tile);
          tileMeshes.set(key, tile);
          pickables.push(tile);

          if (obstacle) {
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            const scale = 0.72 + ((x * 17 + y * 11) % 22) / 50;
            rock.scale.set(scale, 1.3 + ((x + y) % 3) * 0.18, scale);
            rock.position.set(
              ((x * 7 + y * 3) % 9 - 4) / 45,
              0.34,
              ((x * 5 + y * 9) % 9 - 4) / 45,
            );
            rock.rotation.set(x * 0.22, y * 0.34, (x + y) * 0.16);
            rock.castShadow = true;
            tile.add(rock);
          }

          if (x === state.start.x && y === state.start.y) {
            const startRing = new THREE.Mesh(startGeometry, startMaterial);
            startRing.rotation.x = Math.PI / 2;
            startRing.position.y = 0.125;
            tile.add(startRing);
          }
        }
      }
    }

    function updateTerrain(state) {
      latestMap = state;
      const longestEdge = Math.max(state.width, state.height);
      const terrainScale = Math.max(1, (longestEdge + 1) / 13.5);
      base.scale.set(terrainScale, 1, terrainScale);
      grid.scale.set(
        Math.max(1, longestEdge / 10),
        1,
        Math.max(1, longestEdge / 10),
      );
      radius = Math.max(16, longestEdge * 1.5);
      updateCamera();
      const signature = state.tiles.map((row) => row.join("")).join("|");
      if (signature !== mapSignature) {
        mapSignature = signature;
        buildTerrain(state);
      }

      const explored = new Set(state.exploredTiles);
      for (const [key, tile] of tileMeshes) {
        if (tile.userData.gridPosition.key === state.collisionKey) {
          tile.material = obstacleMaterial;
          tile.scale.set(1.06, 1.2, 1.06);
        } else {
          tile.scale.setScalar(1);
          const obstacle =
            state.tiles[tile.userData.gridPosition.y][tile.userData.gridPosition.x] ===
            "obstacle";
          tile.material = explored.has(key)
            ? exploredMaterial
            : obstacle
              ? obstacleMaterial
              : groundMaterial;
        }
      }

      const position = tilePosition(
        state.spaceship.x,
        state.spaceship.y,
        state.width,
        state.height,
      );
      rover.position.set(position.x, 0.36, position.z);
      const collision = state.collisionKey === `${state.spaceship.x},${state.spaceship.y}`;
      roverBody.material.color.setHex(collision ? 0xff8d80 : 0xf6c56c);
      beacon.color.setHex(collision ? 0xff8d80 : 0x7ff6e4);
      selection.visible = false;
      renderScene(performance.now());
    }

    function renderScene(time) {
      if (!reducedMotion) {
        rover.rotation.y = Math.sin(time * 0.0012) * 0.08;
        roverRing.scale.setScalar(1 + Math.sin(time * 0.004) * 0.06);
        dustCloud.rotation.y = time * 0.000025;
      }
      renderer.render(scene, camera);
    }

    function resize() {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      updateCamera();
      renderScene(performance.now());
    }

    function resolveGridHit(event) {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pickables, false)[0];
      return hit?.object.userData.gridPosition ?? null;
    }

    function commandForTarget(target) {
      if (!latestMap) return null;
      const dx = target.x - latestMap.spaceship.x;
      const dy = target.y - latestMap.spaceship.y;
      if (Math.abs(dx) + Math.abs(dy) !== 1) return null;
      if (dx === 1) return "ArrowRight";
      if (dx === -1) return "ArrowLeft";
      return dy === 1 ? "ArrowDown" : "ArrowUp";
    }

    canvas.addEventListener("pointerdown", (event) => {
      pointerStart = { x: event.clientX, y: event.clientY, yaw, pitch };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!pointerStart) return;
      const deltaX = event.clientX - pointerStart.x;
      const deltaY = event.clientY - pointerStart.y;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 4) {
        yaw = pointerStart.yaw - deltaX * 0.008;
        pitch = Math.max(0.38, Math.min(1.18, pointerStart.pitch + deltaY * 0.006));
        updateCamera();
        renderScene(performance.now());
      }
    });
    canvas.addEventListener("pointerup", (event) => {
      if (!pointerStart) return;
      const distance = Math.hypot(
        event.clientX - pointerStart.x,
        event.clientY - pointerStart.y,
      );
      pointerStart = null;
      if (distance > 5) return;
      const target = resolveGridHit(event);
      const command = target && commandForTarget(target);
      if (command && typeof window.marsMissionMove === "function") {
        window.marsMissionMove(command);
        setHint("Movement command sent to rover.");
      } else if (target && latestMap) {
        const targetPosition = tilePosition(
          target.x,
          target.y,
          latestMap.width,
          latestMap.height,
        );
        selection.position.set(targetPosition.x, 0.28, targetPosition.z);
        selection.visible = true;
        setHint("Select a tile directly adjacent to the rover.");
        renderScene(performance.now());
      }
    });

    window.addEventListener("mission-map-update", (event) => updateTerrain(event.detail));
    new ResizeObserver(resize).observe(canvas);
    updateCamera();
    if (window.missionMap) updateTerrain(window.missionMap);
    resize();

    if (!reducedMotion) {
      const animate = (time) => {
        renderScene(time);
        window.requestAnimationFrame(animate);
      };
      window.requestAnimationFrame(animate);
    }
  } catch {
    canvas.closest(".map-stage")?.classList.add("is-unavailable");
    if (hint) {
      hint.textContent =
        "3D terrain preview is unavailable. Keyboard navigation remains active.";
    }
  }
}
