

const CD = 0.0006;
const rho = 1.204;





const convertRocketData = (() => {
    let rocketData = rawEngineData;
    let smoothRocketData = [0];
    const rocketBias = Math.max.apply(Math, rocketData.slice(0,20));
    rocketData = rocketData.map((x) => -x + rocketBias);
    //const xData = [0];
    const tiny = 1 / 40;
    smoothRocketData[1] = tiny*rocketData[1] + (1.0-tiny)*0;
    for (let i=1; i <= rocketData.length; i += 1){
        smoothRocketData[i+1] = tiny*rocketData[i+1] + (1.0-tiny)*smoothRocketData[i];
        //xData.push(i);
    }
    return smoothRocketData;
});;


const physicsRun = (() => {

    const forceCanvas = document.querySelector('.forceCanvas');
    const forceCtx = forceCanvas.getContext('2d');

    const forceData = {
        label: 'Rocket Force (N)',
        labels: [0],
        datasets: [
            {
                fillColor: "rgba(0,0,0,0.2)",
                strokeColor: "rgba(0,0,0,1)",
                pointStrokeColor: "#267361",
                data: [0],
                pointRadius: 0,
                showXLabels: 10,
            },
        ]
    };

    const forceChart = new Chart(forceCtx, {type: 'line',
     data: forceData,
     options: { legend: {display: false}, responsive: true, maintainAspectRatio: false,
        title: {
            display: true,
            text: 'Engine Force [N]'
        }
    }});

    const dragCanvas = document.querySelector('.dragCanvas');
    const dragCtx = dragCanvas.getContext('2d');

    const dragData = {
        label: 'Rocket drag (N)',
        labels: [0],
        datasets: [
            {
                fillColor: "rgba(0,0,0,0.2)",
                strokeColor: "rgba(0,0,0,1)",
                pointStrokeColor: "#267361",
                data: [0],
                pointRadius: 0,
                showXLabels: 10,
            },
        ]
    };

    const dragChart = new Chart(dragCtx, {type: 'line',
     data: dragData,
     options: { legend: {display: false}, responsive: true, maintainAspectRatio: false,
        title: {
            display: true,
            text: 'Rocket Drag [N]'
        }
    }});

    const positionCanvas = document.querySelector('.positionCanvas');
    const positionCtx = positionCanvas.getContext('2d');

    const positionData = {
        label: 'Height (m)',
        labels: [0],
        datasets: [
            {
                fillColor: "rgba(0,0,0,0.2)",
                strokeColor: "rgba(0,0,0,1)",
                pointStrokeColor: "#267361",
                data: [0],
                pointRadius: 0,
                showXLabels: 10,
            },
        ]
    };

    const positionChart = new Chart(positionCtx, {type: 'line', data: positionData,
    options: { legend: {display: false},responsive: true,  maintainAspectRatio: false,
    title: {
        display: true,
        text: 'Position [m]'
    }
}});

    const velocityCanvas = document.querySelector('.velocityCanvas');
    const velocityCtx = velocityCanvas.getContext('2d');

    const velocityData = {
        label: 'Vertical Velocity (m/s)',
        labels: [0],
        datasets: [
            {
                fillColor: "rgba(0,0,0,0.2)",
                strokeColor: "rgba(0,0,0,1)",
                pointStrokeColor: "#267361",
                data: [0],
                pointRadius: 0,
                showXLabels: 10,
            },
        ]
    };

    const velocityChart = new Chart(velocityCtx, {type: 'line', data: velocityData,
    options: { legend: {display: false},responsive: true,  maintainAspectRatio: false,
    title: {
        display: true,
        text: 'Velocity [m/s]'
    }
}});

    var canvas = document.getElementById("renderCanvas"); // Get the canvas element 
    var engine = new BABYLON.Engine(canvas, true , {
        deterministicLockstep: true,
        lockstepMaxSteps: 4
      }); // Generate the BABYLON 3D engine

    const rocketData = convertRocketData();
    const slicedRocketData = rocketData.slice(6000, rocketData.length);

    // Create the scene space
    var scene = new BABYLON.Scene(engine);

 
    
    var gravityVector = new BABYLON.Vector3(0,-9.81, 0);
    var physicsPlugin = new BABYLON.CannonJSPlugin(false);
    scene.enablePhysics(gravityVector, physicsPlugin);
    physicsPlugin.setTimeStep(1/60);

    var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, new BABYLON.Vector3(0,3,10), scene);
    camera.attachControl(canvas, true);

    // Add lights to the scene
    var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
    var light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 1, -1), scene);

    // Add and manipulate meshes in the scene
    var cone = BABYLON.MeshBuilder.CreateCylinder("cone", {diameterTop: 0, height: 0.3, diameterBottom: 0.2, tessellation: 4}, scene);
    var ground = BABYLON.MeshBuilder.CreateGround("gd", {width: 100, height: 100, subdivisions: 5}, scene);
    ground.position.y = -0.1;

    cone.physicsImposter = new BABYLON.PhysicsImpostor(cone, BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 0.098 }, scene);
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.PlaneImpostor, { mass: 0 }, scene);

    var blueMaterial = new BABYLON.StandardMaterial("blueMaterial", scene);

    blueMaterial.diffuseColor = new BABYLON.Color3(0, 0.1, 0.9);
    blueMaterial.specularColor = new BABYLON.Color3(0.0, 0.2, 0.8);
    blueMaterial.emissiveColor = new BABYLON.Color3(0, 0, 0);
    blueMaterial.ambientColor = new BABYLON.Color3(0.0, 0.1, 0.9);

    ground.material = blueMaterial;


    var particleSystem = new BABYLON.ParticleSystem("particles", 200000, scene);
    //var particleSystem = new BABYLON.GPUParticleSystem("particles", { capacity:1000000 }, scene);
    particleSystem.particleTexture = new BABYLON.Texture("flameParticle.png", scene);

    particleSystem.emitter = cone;
    particleSystem.minEmitBox = new BABYLON.Vector3(0, -1, 0); 
    particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);

    particleSystem.color1 = new BABYLON.Color4(1, 1, 0, 1.0);
    particleSystem.color2 = new BABYLON.Color4(1, 0, 0, 1.0);
    particleSystem.colorDead = new BABYLON.Color4(0.2, 0, 0, 0.0);
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 2;
    particleSystem.minSize = 0.03;
    particleSystem.maxSize = 0.15;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    particleSystem.direction1 = new BABYLON.Vector3(-0.9, -2, -0.9);
    particleSystem.direction2 = new BABYLON.Vector3(0.9, -2, 0.9);
    particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
    particleSystem.minAngularSpeed = 0;
    particleSystem.maxAngularSpeed = Math.PI;
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 2;
    particleSystem.updateSpeed = 0.005;
    particleSystem.addDragGradient(0, -0.2);
    particleSystem.addDragGradient(1.0, 1);
    particleSystem.start();

  

    let count = 0;
    const startTime = Date.now();
    engine.runRenderLoop(function () { 
            count += 1;
            const timeDiff = Date.now() - startTime;
            const i = Math.round(timeDiff)
            var forceDirection = new BABYLON.Vector3(0, 1, 0);
            var forceMagnitude = slicedRocketData[i] < 1 ? 0 : slicedRocketData[i] ;
            var contactLocalRefPoint = BABYLON.Vector3.Zero();

            particleSystem.emitRate = 1000 * forceMagnitude;

            var dragDirection = new BABYLON.Vector3(0, -1, 0);
            var dragMagnitude = CD * rho * (1/2) * cone.physicsImposter.getLinearVelocity().y ** 2;

            
            cone.physicsImposter.applyForce(forceDirection.scale(forceMagnitude), cone.getAbsolutePosition().add(contactLocalRefPoint));
            cone.physicsImposter.applyForce(dragDirection.scale(dragMagnitude), cone.getAbsolutePosition().add(contactLocalRefPoint));

            //console.log(`index = ${i}  Force = ${forceMagnitude} velocity = ${cone.physicsImposter.getLinearVelocity().y}  position = ${cone.getAbsolutePosition().y}`);

         
            scene.render();
          
            if (timeDiff < 17 * 1000){
                forceData.labels.push(timeDiff / 1000);
                forceData.datasets[0].data.push(forceMagnitude);

                dragData.labels.push(timeDiff / 1000);
                dragData.datasets[0].data.push(dragMagnitude);

                positionData.labels.push(timeDiff / 1000);
                positionData.datasets[0].data.push(cone.getAbsolutePosition().y);

                velocityData.labels.push(timeDiff / 1000);
                velocityData.datasets[0].data.push(cone.physicsImposter.getLinearVelocity().y);
    
                forceChart.update();
                positionChart.update();
                velocityChart.update();
                dragChart.update();



            };



    });

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () { 
            engine.resize();
    });

});


window.addEventListener('DOMContentLoaded', (event) => {
    physicsRun();
});


