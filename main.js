import * as THREE from "three";
import countries from "./countryData.json";
import gsap from "gsap";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import atmosphereVertexShader from "./shaders/atmosphereVertex.glsl";
import atmosphereFragmentShader from "./shaders/atmosphereFragment.glsl";

//Texture Loader
const textureLoader = new THREE.TextureLoader();
const globeTexture = textureLoader.load("./img/globe.jpeg");

const container = document.querySelector("#canvasContainer");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  container.offsetWidth / container.offsetHeight,
  0.1,
  1000
);
camera.position.z = 15;
camera.position.y = 1;
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: document.querySelector("canvas"),
});

renderer.setSize(container.offsetWidth, container.offsetHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Create sphere
const sphere = new THREE.Mesh(
  new THREE.SphereBufferGeometry(5, 50, 50),
  new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      globeTexture: { value: globeTexture },
    },
  })
);
sphere.rotation.y = -Math.PI / 2;

// Create Atmosphere
const atmosphere = new THREE.Mesh(
  new THREE.SphereBufferGeometry(5, 50, 50),
  new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  })
);

atmosphere.scale.set(1.1, 1.1, 1.1);

scene.add(atmosphere);

const group = new THREE.Group();
group.add(sphere);
scene.add(group);

// Stars
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });

const starVertices = [];
for (let i = 0; i < 10000; i++) {
  const x = (Math.random() - 0.5) * 2000;
  const y = (Math.random() - 0.5) * 2000;
  const z = -Math.random() * 2000;
  starVertices.push(x, y, z);
}

starGeometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(starVertices, 3)
);

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Location Points

const createLabel = ({ lat, lng, country, population }) => {
  const scale = parseInt(population) / 1000000000;
  const zScale = 0.8 * scale;

  const labelGeometry = new THREE.BoxBufferGeometry(
    Math.max(0.1, 0.2 * scale),
    Math.max(0.1, 0.2 * scale),
    Math.max(zScale, 0.4 * Math.random())
  );
  const labelMaterial = new THREE.MeshBasicMaterial({
    color: 0x3bf7ff,
    transparent: true,
    opacity: 0.4,
  });

  const label = new THREE.Mesh(labelGeometry, labelMaterial);

  const latitude = (lat / 180) * Math.PI;
  const longitude = (lng / 180) * Math.PI;
  const radius = 5;

  //23.6345° N, 102.5528° W
  const labelX = radius * Math.cos(latitude) * Math.sin(longitude);
  const labelY = radius * Math.sin(latitude);
  const labelZ = radius * Math.cos(latitude) * Math.cos(longitude);

  label.position.set(labelX, labelY, labelZ);
  label.lookAt(0, 0, 0);
  label.geometry.applyMatrix4(
    new THREE.Matrix4().makeTranslation(0, 0, -zScale / 2)
  );

  gsap.to(label.scale, {
    z: 1.4,
    duration: 2,
    yoyo: true,
    repeat: -1,
    ease: "linear",
    delay: Math.random(),
  });

  label.country = country;
  label.population = population;

  group.add(label);
};

countries.forEach((country) => {
  createLabel({
    lat: country.latlng[0],
    lng: country.latlng[1],
    country: country.name,
    population: parseInt(country.population).toLocaleString(),
  });
});

const mouse = {
  x: 0,
  y: 0,
};

// Raycaster
const raycaster = new THREE.Raycaster();
const popupElement = document.querySelector("#popup");
const populationHeader = document.querySelector("#populationHeader");
const populationValue = document.querySelector("#populationValue");

const animate = () => {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  group.rotation.y += 0.002;

  // gsap.to(group.rotation, {
  //   x: -mouse.y * 1.8,
  //   y: mouse.x * 1.8,
  //   duration: 2,
  // });

  gsap.set(popupElement, {
    display: "none",
  });

  // update the picking ray with the camera and pointer position
  raycaster.setFromCamera(mouse, camera);

  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(
    group.children.filter((mesh) => mesh.geometry.type === "BoxGeometry")
  );

  group.children.forEach((mesh) => (mesh.material.opacity = 0.4));

  for (let i = 0; i < intersects.length; i++) {
    const currentItem = intersects[i].object;
    currentItem.material.opacity = 1;

    gsap.set(popupElement, {
      display: "block",
    });

    populationHeader.innerHTML = currentItem.country;
    populationValue.innerHTML = currentItem.population;
  }
};

animate();

window.addEventListener("mousemove", (e) => {
  mouse.x = ((e.clientX - innerWidth / 2) / (innerWidth / 2)) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;

  gsap.set(popupElement, {
    x: e.clientX,
    y: e.clientY,
  });
});
