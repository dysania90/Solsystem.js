// This includes assignment 2 and 5

var gl;

window.onload = function init() {
    "use strict";

    var canvas = document.getElementById("canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    // Use this object to listen for key inputs
    var keyboardState = new THREEx.KeyboardState();

    // The camera object control's the position and orientation of the... camera
    var camera = new Camera(keyboardState);

    // Create the root SceneNode of the scene graph.
    var scene = new SceneNode(null);

    //
    // Set up our models
    //

    camera.setPosition(vec3(0, 5, 10));
    camera.forwardDirection = subtract(vec3(0,0,-1), camera.position);

    var ProjectionMatrix = perspective(60, canvas.width/canvas.height, 0.01, 100);


    // SCENE GRAPH CODE

    //Create the sphere and add it to the scene graph
    var sphereData = generateSphere(128, 128);
    var sphereNode = new SceneNode(scene);	// scene as parent
    sphereNode.scale([0.7,0.7,0.7]); // Make it half the size of sphereNode

    // Create a non-drawable node rotating all its children around the node's point
    // in space (in this case the origo since we do not translate it). This will let us controll 
    // the oribit speed instead of it following the rotation of the parent (the sun).
    var orbitNode = new SceneNode(scene);


    // var skyNode = new SceneNode(scene);

    // Create another sphereNode using the same data, and set it as a child of the orbitNode
    // so it will orbit around the orbitNode's position (0,0,0).
    var cubeData = generateSphere(128, 128);
    var cubeNode = new SceneNode(orbitNode);
    cubeNode.translate([3,0,0]); // Translate relative to sphereNode 1.
    cubeNode.scale([0.35,0.35,0.35]); // Make it half the size of sphereNode

    var moonData = generateSphere(128, 128);
    var moon = new SceneNode(cubeNode);
    moon.translate([4,0,0]);
    moon.scale([0.6,0.6,0.6]);

    var metalData = generateSphere(128, 128);
    var metal = new SceneNode(sphereNode);
    metal.translate([7.5,0,0]);
    metal.scale([0.15,0.15,0.15]);

    var moonSatelliteData = generateSphere(128, 128);
    var moonSatellite = new SceneNode(moon);
    moonSatellite.translate([2,0,0]);
    moonSatellite.scale([0.5,0.5,0.5]);

    
    //
    //  Configure WebGL
    //

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);


    //  Load shaders and initialize attribute buffers

    var program = initShaders(gl, "vertex-shader", "fragment-shader");

    gl.useProgram(program);

    // Get all relevant uniform locations
    var ProjectionMatLocation = gl.getUniformLocation(program, "ProjectionMatrix");
    var ViewMatLocation = gl.getUniformLocation(program, "ViewMatrix");
    var ColorLocation = gl.getUniformLocation(program, "Color");
    var WorldMatLocation = gl.getUniformLocation(program, "WorldMatrix");
    var NormalMatLocation = gl.getUniformLocation(program, "NormalMatrix");
    var TextureLocation = gl.getUniformLocation(program, "texture");
    var UsingLightLocation = gl.getUniformLocation(program, "usingLight");
    var LightLocation = gl.getUniformLocation(program, "light");

    var AmbientLocation = gl.getUniformLocation(program, "ambient");
    var DiffuseLocation = gl.getUniformLocation(program, "diffuse");
    var SpecularLocation = gl.getUniformLocation(program, "specular");

    // Get all relevant attribute locations
    var vPositionLocation = gl.getAttribLocation(program, "vPosition");
    var vNormalLocation = gl.getAttribLocation(program, "vNormal");
    var vTexCoordLocation = gl.getAttribLocation(program, "vTexCoord");

    var programInfo = {
        program: program,
        attributeLocations: {
            vPosition: vPositionLocation,
            vNormal: vNormalLocation,
            vTexCoord: vTexCoordLocation
        },
        uniformLocations: {
            // Uniforms set once during lifetime?
            projectionMatrix: ProjectionMatLocation,
            light: LightLocation,

            // Set once per per program
            viewMatrix: ViewMatLocation,

            // Uniforms set every draw call
            worldMatrix: WorldMatLocation,
            normalMatrix: NormalMatLocation,
            texture: TextureLocation,
            color: ColorLocation,
            usingLight: UsingLightLocation,

            // Materials
            ambientLocation: AmbientLocation,
            diffuseLocation: DiffuseLocation,
            specularLocation: SpecularLocation
        }
    };

    // Usually only need to set the projection matrix once
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, flatten(ProjectionMatrix));

    // Point light
    gl.uniform4fv(programInfo.uniformLocations.light, flatten(vec4(0, 0, 0, 1)));
    // Directional light
    //gl.uniform4fv(programInfo.uniformLocations.light, flatten(vec4(1, 1, 0, 0)));

    /* Load the data into the GPU in 2 separate buffers.
     * Avoid creation of unnecessary buffers (containing exactly the same data). */


    //SKYBOX MIGHT NEED BUFFER AND BUFFERINFO!?!?!?!?!?!?!?!?!?!?!?!?!?!?!?
    var buffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer1);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten([].concat(sphereData.points, sphereData.normals, sphereData.texCoords))), gl.STATIC_DRAW);

    var sphereBufferInfo = {
        buffer: buffer1,
        numVertices: sphereData.numVertices
    };

    var buffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten([].concat(cubeData.points, cubeData.normals, cubeData.texCoords))), gl.STATIC_DRAW);


    var cubeBufferInfo = {
        buffer: buffer2,
        numVertices: cubeData.numVertices
    };

    var buffer3 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer3);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten([].concat(moonData.points, moonData.normals, moonData.texCoords))), gl.STATIC_DRAW);

    var moonBufferInfo = {
        buffer: buffer3,
        numVertices: moonData.numVertices
    };

    var buffer4 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer4);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten([].concat(moonSatelliteData.points, moonSatelliteData.normals, moonSatelliteData.texCoords))), gl.STATIC_DRAW);

    var moonSatelliteBufferInfo = {
        buffer: buffer4,
        numVertices: moonSatelliteData.numVertices
    };

    var metalBufferInfo = {
        buffer: buffer4,
        numVertices: metalData.numVertices
    };

    // Load textures
    var sunTexture = configureTexture(document.getElementById("sunTexture"));
    var earthTexture = configureTexture(document.getElementById("earthTexture"));
    var moonTexture = configureTexture(document.getElementById("moonTexture"));
    var moonSatelliteTexture = configureTexture(document.getElementById("satelliteTexture"));
    var skybox = createSkybox(
        document.getElementById("skyboxNX"), document.getElementById("skyboxPX"),
        document.getElementById("skyboxNY"), document.getElementById("skyboxPY"),
        document.getElementById("skyboxNZ"), document.getElementById("skyboxPZ")
    );

    //
    // Add drawinfo to the SceneNodes
    //

    //THIS WON'T WORK!!! FIX IT!!!
  /*  skyNode.addDrawable({
        bufferInfo: sphereBufferInfo,
        programInfo: programInfo,
        // Will be uploaded as uniforms
        uniformInfo: {
            color: vec4(0, 1, 1, 1),
            texture: sunTexture,
            usingLight: false,

            ambient: vec3(0, 0, 0),
            diffuse: vec3(1, 1, 1),
            specular: vec3(0, 0, 0)
        }
    }) */

    sphereNode.addDrawable({
    	bufferInfo: sphereBufferInfo,
        programInfo: programInfo,
        // Will be uploaded as uniforms
        uniformInfo: {
            color: vec4(0, 1, 1, 1),
            texture: sunTexture,
            usingLight: false,

            ambient: vec3(0, 0, 0),
            diffuse: vec3(1, 1, 1),
            specular: vec3(0, 0, 0)
        }
    });

    metal.addDrawable({
        bufferInfo: metalBufferInfo,
        programInfo: programInfo,
        // Will be uploaded as uniforms
        uniformInfo: {
            color: vec4(0, 1, 1, 1),
            usingLight: true,

            ambient: vec3(0.2125, 0.1275, 0.054),
            diffuse: vec3(0.714, 0.4284, 0.18144),
            specular: vec3(0, 0, 0)
        }
    });

    cubeNode.addDrawable({
    	bufferInfo: cubeBufferInfo,
        programInfo: programInfo,
        // Will be uploaded as uniforms
        uniformInfo: {
            color: vec4(0, 1, 1, 1),
            texture: earthTexture,
            usingLight: true,

            ambient: vec3(0.01, 0.0, 0.0),
            diffuse: vec3(2, 2, 2),
            specular: vec3(0, 0, 0)
        }
    });

    moon.addDrawable({
        bufferInfo: moonBufferInfo,
        programInfo: programInfo,
        // Will be uploaded as uniforms
        uniformInfo: {
            color: vec4(0, 1, 0, 1),
            texture: moonTexture,
            usingLight: true,

            ambient: vec3(0.01, 0.0, 0.0),
            diffuse: vec3(1, 1, 1),
            specular: vec3(0, 0, 0)
        }
    });

    moonSatellite.addDrawable({
        bufferInfo: moonSatelliteBufferInfo,
        programInfo: programInfo,
        // Will be uploaded as uniforms
        uniformInfo: {
            color: vec4(0, 1, 0, 1),
            texture: moonSatelliteTexture,
            usingLight: true,

            ambient: vec3(0.01, 0, 0),
            diffuse: vec3(1, 1, 1),
            specular: vec3(0, 0, 0)
        }
    });



    //
    // Set up and start the render loop
    //

    var prevTimestamp = 0;

    function step(timestamp) {
        var deltaTimestamp = timestamp - prevTimestamp;
        prevTimestamp = timestamp;

        var seconds = timestamp/1000;
        var diffSeconds = deltaTimestamp/1000;

        camera.update(deltaTimestamp);
        var ViewMatrix = camera.getViewMatrix();


        // Rotate sphereNode around itself
        sphereNode.rotate([0, 3600/60*diffSeconds,0]);

        // Rotate the orbitNode around itself. This will propagate to all its children(cubeNode)
        // so they will orbit the orbitNode. 
        orbitNode.rotate([0, 3600/60*diffSeconds,0]);

        // Rotate cubeNode around itself
        cubeNode.rotate([0, -3*3600/60*diffSeconds,0]);
        moon.rotate([0, -3*3600/60*diffSeconds,0]);
        moonSatellite.rotate([0, -3*3600/60*diffSeconds,0]);
        metal.rotate([0, -3*3600/60*diffSeconds,0]);

        // Update the world matrices of the entire scene graph (Since we are starting at the root node).
        scene.updateMatrices();

        render(SceneNode.getDrawableNodes(), ViewMatLocation, ViewMatrix);

        // Ask the the browser to draw when it's convenient
        window.requestAnimationFrame(step);
    }

    // Ask the the browser to draw when it's convenient
    window.requestAnimationFrame(step);
};

function render(drawableObjects, viewMatLocation, ViewMatrix) {
    "use strict";

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(viewMatLocation, false, flatten(ViewMatrix));

    drawableObjects.forEach(function(object) {
        renderDrawable(object, ViewMatrix); // Render a drawable.
    });
}

function renderDrawable(drawable, ViewMatrix) {
    "use strict";

    var programInfo = drawable.drawInfo.programInfo;
    var attributeLocations = programInfo.attributeLocations;
    var uniformLocations = programInfo.uniformLocations;

    var bufferInfo = drawable.drawInfo.bufferInfo;
    var uniformInfo = drawable.drawInfo.uniformInfo;

    // We will use out program on a given buffer
    gl.useProgram(programInfo.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.buffer);

    // Set up the vertex attributes
    gl.vertexAttribPointer(attributeLocations.vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attributeLocations.vPosition);

    if (attributeLocations.vNormal > -1) {
        // Does shader make use of normals?
        gl.vertexAttribPointer(attributeLocations.vNormal, 3, gl.FLOAT, false, 0, sizeof.vec4*bufferInfo.numVertices);
        gl.enableVertexAttribArray(attributeLocations.vNormal);
    }

    if (attributeLocations.vTexCoord > -1) {
        // Does the shader make use of texture corrdinates?
        gl.vertexAttribPointer(attributeLocations.vTexCoord, 2, gl.FLOAT, false, 0, (sizeof.vec4 + sizeof.vec3)*bufferInfo.numVertices);
        gl.enableVertexAttribArray(attributeLocations.vTexCoord);
    }

    // Upload uniforms

    // Pass the world matrix of the current object to the shader.
    gl.uniformMatrix4fv(uniformLocations.worldMatrix, false, flatten(drawable._worldMatrix));

    gl.uniform4fv(uniformLocations.color, new Float32Array(uniformInfo.color));

    var NormalMatrix = transpose(inverse4(mult(ViewMatrix, drawable._worldMatrix)));
    var NormalMatrix3 = mat3(vec3(NormalMatrix[0]), vec3(NormalMatrix[1]), vec3(NormalMatrix[2]));

    gl.uniformMatrix3fv(uniformLocations.normalMatrix, false, flatten(NormalMatrix3));

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, uniformInfo.texture);
    //gl.bindTexture(gl.TEXTURE_CUBE_MAP, textureObject);

    gl.uniform1i(uniformLocations.texture, 0);
    gl.uniform1i(uniformLocations.usingLight, uniformInfo.usingLight);

    // Set materials
    gl.uniform3fv(uniformLocations.ambientLocation, new Float32Array(uniformInfo.ambient));
    gl.uniform3fv(uniformLocations.diffuseLocation, new Float32Array(uniformInfo.diffuse));
    gl.uniform3fv(uniformLocations.specularLocation, new Float32Array(uniformInfo.specular));

    // Then draw
    gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numVertices);
}

/**
 * Load an image. If a HTML-supplied image is used the width and height attributes are optional.
 * @param image {array|html img} an image to load
 * @param [width] {Number} the width of the image, optional if image is html image
 * @param [height] {Number} the heihgt of the image, optional if image is html image
 * @returns {WebGLTexture}
 */
function configureTexture(image, width, height) {
    "use strict";

    var texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    if (arguments.length > 1) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    } else {
        // We've probably been given a HTML image
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }

    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

    return texture;
}


//create skybox function
function createSkybox (imageNX, imagePX, imageNY, imagePY, imageNZ, imagePZ) {
    "use strict"

    var texture = gl.createTexture();
    //List of all the pictures, N = Negative P = Positive
    var img = [imageNX, imagePX, imageNY, imagePY, imageNZ, imagePZ];
    var target = [gl.TEXTURE_CUBE_MAP_NEGATIVE_X,gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, gl.TEXTURE_CUBE_MAP_POSITIVE_Z];

    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    for (var i = 0; i < 6; i++) {
        gl.bindTexture( gl.TEXTURE_CUBE_MAP, texture );
        gl.texImage2D(target[i], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img[i]);
    }

    gl.generateMipmap( gl.TEXTURE_CUBE_MAP );
    gl.texParameteri( gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

    return texture;
}