
let CD = 0.0006;
const rho = 1.204;

const convertRocketData = (() => {
  //rawEngineData comes from engineData.js script containing all data points.
  let rocketData = rawEngineData;
  const smoothRocketData = [0];
  const rocketBias = Math.max.apply(Math, rocketData.slice(0,20));
  rocketData = rocketData.map((x) => -x + rocketBias);
  const tiny = 1 / 40;
  smoothRocketData[1] = tiny * rocketData[1] + (1.0 - tiny) * 0;
  for (let i = 1; i <= rocketData.length; i += 1) {
    smoothRocketData[i + 1] = tiny * rocketData[i + 1] + (1.0 - tiny) * smoothRocketData[i];
  }
  return smoothRocketData;
});

const physicsRun = (() => {
  const forceCanvas = document.querySelector('.forceCanvas');
  const forceCtx = forceCanvas.getContext('2d');
  const dragCanvas = document.querySelector('.dragCanvas');
  const dragCtx = dragCanvas.getContext('2d');
  const positionCanvas = document.querySelector('.positionCanvas');
  const positionCtx = positionCanvas.getContext('2d');
  const velocityCanvas = document.querySelector('.velocityCanvas');
  const velocityCtx = velocityCanvas.getContext('2d');

  const forceData = {
    label: 'Rocket Force (N)',
    labels: [0],
    datasets: [
      {
        fillColor: 'rgba(0,0,0,0.2)',
        strokeColor: 'rgba(0,0,0,1)',
        pointStrokeColor: '#267361',
        data: [0],
        pointRadius: 0,
        showXLabels: 10,
      },
    ],
  };

  const forceChart = new Chart(forceCtx, {
    type: 'line',
    data: forceData,
    options: {
      legend: { display: false },
      responsive: true,
      maintainAspectRatio: false,
      title: {
        display: true,
        text: 'Engine Force [N]',
      },
    },
  });

  const dragData = {
    label: 'Rocket drag (N)',
    labels: [0],
    datasets: [
      {
        fillColor: 'rgba(0,0,0,0.2)',
        strokeColor: 'rgba(0,0,0,1)',
        pointStrokeColor: '#267361',
        data: [0],
        pointRadius: 0,
        showXLabels: 10,
      },
    ],
  };

  const dragChart = new Chart(dragCtx, {
    type: 'line',
    data: dragData,
    options: {
      legend: { display: false },
      responsive: true,
      maintainAspectRatio: false,
      title: {
        display: true,
        text: 'Rocket Drag [N]',
      },
    },
  });

  const positionData = {
    label: 'Height (m)',
    labels: [0],
    datasets: [
      {
        fillColor: 'rgba(0,0,0,0.2)',
        strokeColor: 'rgba(0,0,0,1)',
        pointStrokeColor: '#267361',
        data: [0],
        pointRadius: 0,
        showXLabels: 10,
      },
    ],
  };

  const positionChart = new Chart(positionCtx, {
    type: 'line',
    data: positionData,
    options: {
      legend: { display: false },
      responsive: true,
      maintainAspectRatio: false,
      title: {
        display: true,
        text: 'Position [m]',
      },
    },
  });

  const velocityData = {
    label: 'Vertical Velocity (m/s)',
    labels: [0],
    datasets: [
      {
        fillColor: 'rgba(0,0,0,0.2)',
        strokeColor: 'rgba(0,0,0,1)',
        pointStrokeColor: '#267361',
        data: [0],
        pointRadius: 0,
        showXLabels: 10,
      },
    ],
  };

  const velocityChart = new Chart(velocityCtx, {
    type: 'line',
    data: velocityData,
    options: {
      legend: { display: false },
      responsive: true,
      maintainAspectRatio: false,
      title: {
        display: true,
        text: 'Velocity [m/s]',
      },
    },
  });
  const canvas = document.getElementById('renderCanvas');

  const engine = new BABYLON.Engine(canvas, true, {
    deterministicLockstep: true,
    timeStep: 0.010,
  });
  const scene = new BABYLON.Scene(engine);

  const rocketData = convertRocketData();
  const slicedRocketData = rocketData.slice(6000, rocketData.length);

  const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
  const physicsPlugin = new BABYLON.CannonJSPlugin(false);
  scene.enablePhysics(gravityVector, physicsPlugin);

  // const camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 2, 1,
  //   new BABYLON.Vector3(0, 3, 25), scene);
  // camera.attachControl(canvas, true);

  const camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -10), scene);
  camera.radius = 15;
  camera.heightOffset = 20;
  camera.rotationOffset = 0;
  camera.cameraAcceleration = 0.1;
  camera.maxCameraSpeed = 200;
  camera.attachControl(canvas, true);


  const light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(1, 1, 0), scene);
  const light2 = new BABYLON.PointLight('light2', new BABYLON.Vector3(0, 1, -1), scene);

  const cone = BABYLON.MeshBuilder.CreateCylinder('cone', { diameterTop: 0, height: 2, diameterBottom: 0.7, tessellation: 10 }, scene);
  const ground = BABYLON.MeshBuilder.CreateGround('gd', { width: 100, height: 100, subdivisions: 5 }, scene);
  ground.position.y = -2;

  camera.lockedTarget = cone;

  //camera.setPosition(cone.getAbsolutePosition());

  cone.physicsImposter = new BABYLON.PhysicsImpostor(cone,
    BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 0.098 }, scene);
  ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground,
    BABYLON.PhysicsImpostor.PlaneImpostor, { mass: 0 }, scene);

  const groundMaterial = new BABYLON.StandardMaterial('groundMaterial', scene);
  groundMaterial.diffuseTexture = new BABYLON.Texture('grassTexture.jpg', scene);
  ground.material = groundMaterial;

  const particleSystem = new BABYLON.ParticleSystem('particles', 2000, scene);
  //const particleSystem = new BABYLON.GPUParticleSystem('particles', { capacity: 1000000 }, scene);

  particleSystem.particleTexture = new BABYLON.Texture('flameParticle.png', scene);
  particleSystem.emitter = cone;
  particleSystem.minEmitBox = new BABYLON.Vector3(0, -1, 0);
  particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
  particleSystem.color1 = new BABYLON.Color4(1, 1, 0, 1.0);
  particleSystem.color2 = new BABYLON.Color4(0, 0, 0, 1.0);
  particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.2);
  particleSystem.minLifeTime = 1;
  particleSystem.maxLifeTime = 2;
  particleSystem.minSize = 0.03;
  particleSystem.maxSize = 0.2;
  particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
  particleSystem.direction1 = new BABYLON.Vector3(-2, -2, -2);
  particleSystem.direction2 = new BABYLON.Vector3(2, -2, 2);
  particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
  particleSystem.minAngularSpeed = 0;
  particleSystem.maxAngularSpeed = Math.PI;
  particleSystem.minEmitPower = 3;
  particleSystem.maxEmitPower = 5;
  particleSystem.updateSpeed = 0.005;
  particleSystem.addDragGradient(0, 0.4);
  particleSystem.addDragGradient(1.0, 0.4);
  particleSystem.start();

  engine.runRenderLoop(() => {
    scene.render();
  });

  const startTime = Date.now();
  let maxPos = -Infinity;
  let count = 0;

  

  const maxHeightElement = document.querySelector('.maxHeight');
  scene.onBeforePhysicsObservable.add(() => {
    const timeDiff = Date.now() - startTime;
    //camera.setPosition(cone.getAbsolutePosition());
    count += 10;
    const i = count;
    const rocketVelocity = cone.physicsImposter.getLinearVelocity().y;
    const rocketPosition = cone.getAbsolutePosition();
    const forceDirection = new BABYLON.Vector3(0, 1, 0);
    const forceMagnitude = slicedRocketData[i] < 1 ? 0 : slicedRocketData[i];
    const contactLocalRefPoint = BABYLON.Vector3.Zero();
    const dragDirection = new BABYLON.Vector3(0, -1, 0);
    const dragMagnitude = CD * rho * (1 / 2) * rocketVelocity ** 2;
    particleSystem.emitRate = 1000 * forceMagnitude;

    cone.physicsImposter.applyForce(forceDirection.scale(forceMagnitude),
      rocketPosition.add(contactLocalRefPoint));
    cone.physicsImposter.applyForce(dragDirection.scale(dragMagnitude),
      rocketPosition.add(contactLocalRefPoint));

    if (rocketPosition.y > maxPos) {
      maxPos = rocketPosition.y;
      maxHeightElement.innerText = `Max Height = ${maxPos} m`;
    }

    if (timeDiff < 17 * 1000) {
      positionData.labels.push(timeDiff / 1000);
      positionData.datasets[0].data.push(rocketPosition.y);

      velocityData.labels.push(timeDiff / 1000);
      velocityData.datasets[0].data.push(rocketVelocity);

      forceData.labels.push(timeDiff / 1000);
      forceData.datasets[0].data.push(forceMagnitude);

      dragData.labels.push(timeDiff / 1000);
      dragData.datasets[0].data.push(dragMagnitude);

      positionChart.update();
      velocityChart.update();
      forceChart.update();
      dragChart.update();
    }
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });
});


window.addEventListener('DOMContentLoaded', (event) => {

  document.querySelector('.launchButton').onclick = function runAll() {
    const cdInputElement = document.querySelector('.cdInput');
    if (cdInputElement.value) {
      CD = cdInputElement.value;
    }
    physicsRun();
  };
});
