

const CD = 0.0006;
const rho = 1.204;

const convertRocketData = (() => {
    let rocketData = rawEngineData;
    let smoothRocketData = [0];
    const rocketBias = Math.max.apply(Math, rocketData.slice(0,20));
    rocketData = rocketData.map((x) => -x + rocketBias);
    //const xData = [0];
    const tiny = 1 / 50;
    smoothRocketData[1] = tiny*rocketData[1] + (1.0-tiny)*0;
    for (let i=1; i <= rocketData.length; i += 1){
        smoothRocketData[i+1] = tiny*rocketData[i+1] + (1.0-tiny)*smoothRocketData[i];
        //xData.push(i);
    }
    return smoothRocketData;
});;


const physicsRun = (() => {

    var canvas = document.getElementById("renderCanvas"); // Get the canvas element 
    var engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

    const rocketData = convertRocketData();
    const slicedRocketData = rocketData.slice(7600, rocketData.length);

    // Create the scene space
    var scene = new BABYLON.Scene(engine);
    
    var gravityVector = new BABYLON.Vector3(0,-9.81, 0);
    var physicsPlugin = new BABYLON.CannonJSPlugin();
    scene.enablePhysics(gravityVector, physicsPlugin);
    // Add a camera to the scene and attach it to the canvas
    var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, new BABYLON.Vector3(0,0,20), scene);
    camera.attachControl(canvas, true);

    // Add lights to the scene
    var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
    var light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 1, -1), scene);

    // Add and manipulate meshes in the scene
    var cone = BABYLON.MeshBuilder.CreateCylinder("cone", {diameterTop: 0, height: 0.3, diameterBottom: 0.2, tessellation: 4}, scene);
    var ground = BABYLON.MeshBuilder.CreateGround("gd", {width: 20, height: 20, subdivisions: 5}, scene);
    ground.position.y = -1;

    cone.physicsImposter = new BABYLON.PhysicsImpostor(cone, BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 0.098 }, scene);
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.PlaneImpostor, { mass: 0 }, scene);



    // Register a render loop to repeatedly render the scene
    let i = 0;

    const data = {
        // A labels array that can contain any sort of values
        labels: [0],
        // Our series array that contains series objects or in this case series data arrays
        series: [
          [0]
        ]
      };

    const positionChart = new Chartist.Line('.ct-chart', data);
    
    const startTime = Date.now();
    engine.runRenderLoop(function () { 
            const timeDiff = Date.now() - startTime;
            const i = Math.round(timeDiff)
            var forceDirection = new BABYLON.Vector3(0, 1, 0);
            var forceMagnitude = slicedRocketData[i];
            var contactLocalRefPoint = BABYLON.Vector3.Zero();

            var dragDirection = new BABYLON.Vector3(0, -1, 0);
            var dragMagnitude = CD * rho * (1/2) * cone.physicsImposter.getLinearVelocity().y ** 2;

            
            cone.physicsImposter.applyForce(forceDirection.scale(forceMagnitude), cone.getAbsolutePosition().add(contactLocalRefPoint));
            cone.physicsImposter.applyForce(dragDirection.scale(dragMagnitude), cone.getAbsolutePosition().add(contactLocalRefPoint));

            console.log(`index = ${i}  Force = ${forceMagnitude} velocity = ${cone.physicsImposter.getLinearVelocity().y}  position = ${cone.getAbsolutePosition().y}`);

            data.labels.push(i / 1000);
            data.series[0].push(cone.getAbsolutePosition().y);
            console.log(data);
            positionChart.update();



            scene.render();
          



    });

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () { 
            engine.resize();
    });

});


window.addEventListener('DOMContentLoaded', (event) => {
    physicsRun();
});


