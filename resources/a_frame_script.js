AFRAME.registerComponent('escena', {
    init: function(){
        let aRenderer = this.el.renderer;
        aRenderer.antialias = true
        aRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        // aRenderer.physicallyCorrectLights = true
        aRenderer.outputEncoding = THREE.sRGBEncoding
    }
});

AFRAME.registerComponent('player_controls', {

	schema: 
	{
		/*
			Default key assignments: WASDQERFTG. 
			(Pronounced: "wahz-dee-kerf-tig")
			WASD: standard forward/left/backward/right movement
			Mnemonics:
			QE: turn left/right (positioned above move left/right keys)
			RF: move up/down ("R"ise / "F"all)
			TG: look up/down (look at "T"ower / "G"round.
		*/
		moveForwardKey:  {type: 'string', default: "W"},
		moveBackwardKey: {type: 'string', default: "S"},
		turnLeftKey:     {type: 'string', default: "A"},
		turnRightKey:    {type: 'string', default: "D"},
		
  		flyEnabled:  {type: 'boolean', default: true},
  		turnEnabled: {type: 'boolean', default: true},

  		moveSpeed: {type: 'number', default: 5},  // A-Frame units/second
		turnSpeed: {type: 'number', default: 30}, // degrees/second

		// use keyboard or other (e.g. joystick) to activate these controls
		inputType: {type: 'string', default: "keyboard"}
	},

	convertKeyName: function(keyName)
	{
		if (keyName == " ")
			return "Space";
		else if (keyName.length == 1)
			return keyName.toUpperCase();
		else
			return keyName;
	},

	registerKeyDown: function(keyName)
	{
		// avoid adding duplicates of keys
		if ( !this.keyPressedSet.has(keyName) )
        	this.keyPressedSet.add(keyName);
	},

	registerKeyUp: function(keyName)
	{
       	this.keyPressedSet.delete(keyName);
	},

	isKeyPressed: function(keyName)
	{
       	return this.keyPressedSet.has(keyName);
	},

	init: function()
	{
		// register key down/up events 
		//  and keep track of all keys currently pressed
		this.keyPressedSet = new Set();
				
		let self = this;
		
		document.addEventListener( "keydown", 
			function(eventData) 
			{ 
				self.registerKeyDown( self.convertKeyName(eventData.key) );
			}
		);
		
		document.addEventListener( "keyup", 
			function(eventData) 
			{ 
				self.registerKeyUp( self.convertKeyName(eventData.key) );
			} 
		);

		// movement-related data

		this.moveVector  = new THREE.Vector3(0,0,0);
		this.movePercent = new THREE.Vector3(0,0,0);
		// z = forward/backward
		// x = left/right
		// y = up/down

		this.rotateVector  = new THREE.Vector2(0,0);
		this.rotatePercent = new THREE.Vector2(0,0);
		// y = turn angle
		// x = look angle

		// used as reference vector when turning
		this.upVector = new THREE.Vector3(0,1,0);
		
		// current rotation amounts
		this.turnAngle = 0; // around global Y axis
		this.lookAngle = 0; // around local X axis

		// this will = null or an object
		this.lookControls = this.el.components["look-controls"];
		
		// allows easy extraction of turn angle
		this.el.object3D.rotation.order = 'YXZ';
	},
	

	tick: function (time, timeDelta) 
	{
		let moveAmount = (timeDelta/1000) * this.data.moveSpeed;
		// need to convert angle measures from degrees to radians
		let turnAmount = (timeDelta/1000) * THREE.Math.degToRad(this.data.turnSpeed);
		
		// rotations
		
		// reset values
		let totalTurnAngle = 0;

		// look-controls and extended-wasd-controls are compatible
		//   with desktop/mouse combo but not for tablet/gyroscope combo ("magic window" effect)
		//   (at least not with this code)
		// thus, look/turn automatically disabled when look-controls present

		if ( this.lookControls ) // take into account look-controls, if they exist
		{
			// this code is only useful when trying to combine 
			//   look-controls with extended-wasd rotation
			// totalTurnAngle += this.lookControls.yawObject.rotation.y;
			// totalLookAngle += this.lookControls.pitchObject.rotation.x;
		}
		else
		{
			if (this.data.inputType == "keyboard")
			{
				// need to reset rotatePercent values
				//   when querying which keys are currently pressed
				this.rotatePercent.set(0,0);

				if (this.isKeyPressed(this.data.turnLeftKey))
					this.rotatePercent.y += 1;
				if (this.isKeyPressed(this.data.turnRightKey))
					this.rotatePercent.y -= 1;

			}
			else // other, e.g. "joystick"
			{
				// assume this.rotatePercent values have been set/reset elsewhere (outside of this function)
			}

			if ( this.data.turnEnabled )
			{
				this.turnAngle += this.rotatePercent.y * turnAmount;
				this.el.object3D.rotation.y = this.turnAngle;
			}

		}

		// translations

		// this only works when rotation order = "YXZ"
		let finalTurnAngle = this.el.object3D.rotation.y;
        let model = document.getElementById("character")
		
		let c = Math.cos(finalTurnAngle);
		let s = Math.sin(finalTurnAngle);

		if (this.data.inputType == "keyboard")
		{
			// need to reset movePercent values
			//   when querying which keys are currently pressed
			this.movePercent.set(0,0,0)

			if (this.isKeyPressed(this.data.moveForwardKey)){
				this.movePercent.z -= 1;
                model.setAttribute('animation-mixer',{
                    clip: "Walk",
                    loop: 'repeat',
                    crossFadeDuration: 0.3,
                })
            }else{
                model.setAttribute('animation-mixer',{
                    clip: "Idle",
                    loop: 'repeat',
                    crossFadeDuration: 0.3,
                })
            }

			if (this.isKeyPressed(this.data.moveBackwardKey))
				this.movePercent.z += 1;
		}
		else // other, e.g. "joystick"
		{
			// assume this.movePercent values have been set/reset elsewhere (outside of this function)
		}

		// forward(z) direction: [ -s,  0, -c ]
		//   right(x) direction: [  c,  0, -s ]
		//      up(y) direction: [  0,  1,  0 ]
		// multiply each by (maximum) movement amount and percentages (how much to move in that direction)

		this.moveVector.set( -s * this.movePercent.z + c * this.movePercent.x,
							  1 * this.movePercent.y,
							 -c * this.movePercent.z - s * this.movePercent.x ).multiplyScalar( moveAmount );

		this.el.object3D.position.add( this.moveVector );
	}
});


AFRAME.registerComponent('character', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let model = el.getObject3D('mesh');
            model.traverse((node) => {
                if (node.isMesh) {
                  node.frustumCulled = false;
                }
              });
        });
    }
});

AFRAME.registerComponent('entorno', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/Entorno_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('terreno', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/Terreno_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('arboles', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/Arboles_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('lamparas', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/Lamparas_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('autos_01', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/Autos_Fila_A_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('autos_02', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/Autos_Fila_B_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('fabrica', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/Fabrica_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('letrero_01', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/Letrero_01_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('letrero_02', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/Letrero_02_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('extras', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/Extras_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('torre', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/Torre_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('luces_torre', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/Luz_tanques_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('tanque_01', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/Tanque_01_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('tanque_02', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/Tanque_02_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('tanque_03', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/Tanque_03_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('camion', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/Camion_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
            //console.log(el.components.animation__drive.initialized)
        });
    }
});

AFRAME.registerComponent('sonido_camion', {
    dependencies: ['animation__drive', 'animation__turning', 'animation__park'],
    init: function(){
        let el = this.el;
        // console.log(el.components)
        el.addEventListener('animationbegin', function(e) {
            console.log(e.detail.name, 'begin');
          });
        // console.log(el.components.animation__drive)
        // el.addEventListener("model-loaded", e =>{
        //     let tree3D = el.getObject3D('mesh');
        //     console.log("info",tree3D)
        // });
        // el.addEventListener("loaded", e=>{
            
        // })
    }
});

AFRAME.registerComponent('talksign', {
    // schema: {
    //     icon: {default: 'resources/Textures/Chat_icon.png'}
    // },

    init: function(){
        let el = this.el;
        el.addEventListener("loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const textureLoader = new THREE.TextureLoader();
            const signTexture = textureLoader.load('resources/Textures/Chat_icon.png');
            const signAlphaTexture = textureLoader.load('resources/Textures/Chat_icon_alpha.png')
            signTexture.encoding = THREE.sRGBEncoding
            const signMaterial = new THREE.MeshBasicMaterial()
            signMaterial.map = signTexture
            signMaterial.alphaMap = signAlphaTexture
            signMaterial.transparent = true
            signMaterial.side = THREE.DoubleSide
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  signMaterial
                }
            });
            //console.log(el.components.animation__drive.initialized)
        });
        el.addEventListener("mouseenter", function(){
            el.setAttribute('scale',{x: 1.1, y: 1.1, z: 1.1})
        })
        el.addEventListener("mouseleave", function(){
            el.setAttribute('scale',{x: 1, y: 1, z: 1})
        })
    }
});

// Inside scene components

AFRAME.registerComponent('habitacion', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/JPG/Habitacion_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('luces', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/JPG/Lamparas_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('mesa_01', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/JPG/Mesa_01_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('mesa_02', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/JPG/Mesa_02_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('mesa_03', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/JPG/Mesa_03_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('silla_01', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/JPG/Silla_01_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('silla_02', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/JPG/Silla_02_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material=  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('computador_01', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/JPG/Computador_01_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material=  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('computador_02', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/JPG/Computador_02_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material=  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('caja_arroz', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/JPG/CA_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material=  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('caja_chocolate_01', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/JPG/CC_01_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material=  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('caja_chocolate_02', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/JPG/CC_02_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material=  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('caja_refresco', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/JPG/CR_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material=  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('metro', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/JPG/Metro_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material=  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('calibre', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/JPG/Calibre_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material=  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('poster', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/JPG/Poster_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material=  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('transportadora', {
    init: function(){
        let el = this.el;
        el.addEventListener("model-loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const BakedTexture = new THREE.TextureLoader().load( "resources/Textures/JPG/Transportadora_bake.jpg");
            BakedTexture.flipY = false
            BakedTexture.encoding = THREE.sRGBEncoding
            const bakedMaterial = new THREE.MeshBasicMaterial({map: BakedTexture})
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material=  bakedMaterial
                }
            });
        });
    }
});

AFRAME.registerComponent('tasksign', {
    init: function(){
        let el = this.el;
        el.addEventListener("loaded", e =>{
            let tree3D = el.getObject3D('mesh');
            const textureLoader = new THREE.TextureLoader();
            const signTexture = textureLoader.load( "resources/Textures/JPG/Task_icon.png");
            const signAlphaTexture = textureLoader.load('resources/Textures/JPG/Task_icon_alpha.png')
            signTexture.encoding = THREE.sRGBEncoding
            const signMaterial = new THREE.MeshBasicMaterial()
            signMaterial.map = signTexture
            signMaterial.alphaMap = signAlphaTexture
            signMaterial.transparent = true
            signMaterial.side = THREE.DoubleSide
            if (!tree3D){return;}                   
            tree3D.traverse(function(node){
                if (node.isMesh){                           
                    node.material =  signMaterial
                }
            });
            //console.log(el.components.animation__drive.initialized)
        });
        el.addEventListener("mouseenter", function(){
            el.setAttribute('scale',{x: 1.1, y: 1.1, z: 1.1})
        })
        el.addEventListener("mouseleave", function(){
            el.setAttribute('scale',{x: 1, y: 1, z: 1})
        })
    }
});

function show(){
    let information = document.getElementById("container");
    information.style.display = "flex"
}
