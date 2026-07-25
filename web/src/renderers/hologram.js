import * as THREE from "three";

export function initializeHologram() {
  const canvas = document.querySelector("#mission-hologram");
  if (!canvas) return;

  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.1, 5.2);

    const ambient = new THREE.HemisphereLight(0xbdeee9, 0x5a211b, 2.2);
    const sun = new THREE.DirectionalLight(0xffd0a8, 2.6);
    sun.position.set(2.5, 2.4, 4);
    scene.add(ambient, sun);

    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = 256;
    textureCanvas.height = 128;
    const context = textureCanvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D rendering is unavailable.");
    context.fillStyle = "#7f3728";
    context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
    for (let index = 0; index < 80; index += 1) {
      const x = (index * 37) % textureCanvas.width;
      const y = (index * 61) % textureCanvas.height;
      const radius = 3 + ((index * 13) % 12);
      context.fillStyle =
        index % 3 === 0 ? "rgba(247, 170, 103, .35)" : "rgba(61, 26, 30, .24)";
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }

    const mars = new THREE.Mesh(
      new THREE.SphereGeometry(1.16, 48, 48),
      new THREE.MeshStandardMaterial({
        map: new THREE.CanvasTexture(textureCanvas),
        roughness: 0.88,
        metalness: 0.04,
      }),
    );
    scene.add(mars);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.205, 48, 48),
      new THREE.MeshBasicMaterial({
        color: 0x7eeadd,
        transparent: true,
        opacity: 0.13,
        side: THREE.BackSide,
      }),
    );
    scene.add(atmosphere);

    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(1.52, 0.012, 8, 100),
      new THREE.MeshBasicMaterial({ color: 0x76d7c9, transparent: true, opacity: 0.68 }),
    );
    orbit.rotation.x = 1.15;
    orbit.rotation.z = -0.25;
    scene.add(orbit);

    const marker = new THREE.Group();
    const markerCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 18, 18),
      new THREE.MeshBasicMaterial({ color: 0xf7c56e }),
    );
    const markerHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.1, 0.19, 28),
      new THREE.MeshBasicMaterial({
        color: 0xf7c56e,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
      }),
    );
    markerHalo.rotation.x = Math.PI / 2;
    marker.add(markerCore, markerHalo);
    scene.add(marker);

    const starGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    for (let index = 0; index < 110; index += 1) {
      starPositions.push(
        ((index * 47) % 19) - 9.5,
        ((index * 71) % 11) - 5.5,
        -3 - ((index * 29) % 9),
      );
    }
    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starPositions, 3),
    );
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        color: 0xd4fff8,
        size: 0.025,
        transparent: true,
        opacity: 0.7,
      }),
    );
    scene.add(stars);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let telemetry = window.missionTelemetry ?? {
      x: 4,
      y: 4,
      width: 8,
      height: 8,
      fuel: 100,
      maxFuel: 100,
      missionComplete: false,
      autopilot: false,
    };

    function updateMarker(nextTelemetry) {
      telemetry = nextTelemetry;
      const longitude =
        (telemetry.x / Math.max(telemetry.width - 1, 1) - 0.5) * Math.PI * 1.2;
      const latitude =
        (telemetry.y / Math.max(telemetry.height - 1, 1) - 0.5) * Math.PI * 0.86;
      const radius = 1.29;
      marker.position.set(
        Math.cos(latitude) * Math.sin(longitude) * radius,
        Math.sin(latitude) * radius,
        Math.cos(latitude) * Math.cos(longitude) * radius,
      );
      marker.lookAt(0, 0, 0);
      const color = telemetry.missionComplete
        ? 0xf7c56e
        : telemetry.autopilot
          ? 0x76d7c9
          : 0xff8b70;
      markerCore.material.color.setHex(color);
      markerHalo.material.color.setHex(color);
      markerHalo.material.opacity =
        (telemetry.fuel / Math.max(telemetry.maxFuel, 1)) * 0.65 + 0.15;
    }

    function resize() {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    window.addEventListener("mission-update", (event) => updateMarker(event.detail));
    new ResizeObserver(resize).observe(canvas);
    updateMarker(telemetry);
    resize();

    let previousTime = 0;
    function render(time) {
      const delta = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
      if (!reducedMotion) {
        mars.rotation.y += delta * 0.26;
        atmosphere.rotation.y += delta * 0.12;
        orbit.rotation.z += delta * 0.1;
        stars.rotation.y += delta * 0.016;
        markerHalo.scale.setScalar(1 + Math.sin(time * 0.006) * 0.1);
      }
      renderer.render(scene, camera);
      if (!reducedMotion) window.requestAnimationFrame(render);
    }
    window.requestAnimationFrame(render);
  } catch {
    const card = canvas.closest(".holo-card");
    if (card) {
      card.classList.add("is-unavailable");
      const label = card.querySelector(".holo-card__label");
      if (label) label.textContent = "NAV PREVIEW OFFLINE";
    }
  }
}
