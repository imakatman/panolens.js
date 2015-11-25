( function () {

	/**
	 * Skeleton panorama derived from THREE.Mesh
	 * @constructor
	 * @param {THREE.Geometry} [geometry=THREE.SphereGeometry] - The geometry for this panorama
	 * @param {THREE.Material} [material=new THREE.MeshBasicMaterial] - The material for this panorama
	 * @param {number} [orbitRadius=100] - The minimum radius for this panoram
	 */
	PANOLENS.Panorama = function ( geometry, material, orbitRadius ) {

		THREE.Mesh.call( this );

		this.type = 'panorama';

		this.ImageQualityLow = 1;
		this.ImageQualityFair = 2;
		this.ImageQualityMedium = 3;
		this.ImageQualityHigh = 4;
		this.ImageQualitySuperHigh = 5;

		this.MaxCacheTextureNumber = 5;

		this.animationDuration = 500;

		this.defaultInfospotSize = 7;

		this.loaded = false;

		this.orbitRadius = orbitRadius || 100;

		this.linkedSpots = [];

		this.isChildrenVisible = false;
		this.linkingImageURL = undefined;

		this.geometry = geometry || new THREE.SphereGeometry( this.orbitRadius, 60, 40 );
		this.material = material || new THREE.MeshBasicMaterial( { opacity: 0, transparent: true } );

		this.material.side = THREE.DoubleSide;

		this.material.depthWrite = false;
		this.material.depthTest = false;
		this.scale.x *= -1;

		this.addEventListener( 'load', this.fadeIn.bind( this ) );

	}

	PANOLENS.Panorama.prototype = Object.create( THREE.Mesh.prototype );

	PANOLENS.Panorama.prototype.constructor = PANOLENS.Panorama;

	PANOLENS.Panorama.prototype.add = function ( object ) {

		if ( arguments.length > 1 ) {

			for ( var i = 0; i < arguments.length; i ++ ) {

				this.add( arguments[ i ] );

			}

			return this;

		}

		THREE.Object3D.prototype.add.call( this, object );

		object.traverse( function ( obj ) {

			obj.scale.x *= -1;

		});

	};

	PANOLENS.Panorama.prototype.onLoad = function () {

		this.toggleChildrenVisibility( true );

		this.loaded = true;

		this.dispatchEvent( { type: 'load' } );

	};

	PANOLENS.Panorama.prototype.onProgress = function ( progress ) {

		this.dispatchEvent( { type: 'progress', progress: progress } );

	};

	PANOLENS.Panorama.prototype.onError = function () {

		this.dispatchEvent( { type: 'error' } );

	};

	PANOLENS.Panorama.prototype.getZoomLevel = function () {

		var zoomLevel;

		if ( window.innerWidth > 800 && window.innerWidth < 1920 ) {

			zoomLevel = this.ImageQualityHigh;

		} else if ( window.innerWidth >= 1920 ) {

			zoomLevel = this.ImageQualitySuperHigh;

		} else {

			zoomLevel = this.ImageQualityMedium;

		}

		return zoomLevel;

	};

	PANOLENS.Panorama.prototype.updatePanoObjectTexture = function ( texture ) {

		this.material.map = texture;

		this.material.needsUpdate = true;

	};

	PANOLENS.Panorama.prototype.toggleChildrenVisibility = function ( force, delay ) {

		delay = ( delay !== undefined ) ? delay : 0;

		var scope = this, 
			visible = ( force !== undefined ) ? force : ( this.isChildrenVisible ? false : true );

		this.traverse( function ( object ) {

			if ( object instanceof PANOLENS.Infospot ) {

				visible ? object.show( delay ) : object.hide( delay );

			}

		} );

		this.isChildrenVisible = visible;

	};

	PANOLENS.Panorama.prototype.setLinkingImage = function ( url ) {

		this.linkingImageURL = url;

	};

	PANOLENS.Panorama.prototype.link = function ( pano, ended ) {

		var scope = this, spot, raycaster, intersect, point;

		raycaster = new THREE.Raycaster();
		raycaster.set( this.position, pano.position.clone().sub( this.position ).normalize() );
		intersect = raycaster.intersectObject( this );

		if ( intersect.length > 0 ) {

			point = intersect[ intersect.length - 1 ].point.clone().multiplyScalar( 0.99 );

		} else {

			console.warn( 'Panoramas should be at different position' );
			return;

		}

		spot = new PANOLENS.Infospot( this.defaultInfospotSize, pano.linkingImageURL || PANOLENS.ArrowIcon );
        spot.position.copy( point );
        spot.toPanorama = pano;
        spot.addEventListener( 'click', function () {

        	scope.dispatchEvent( { type : 'panolens-viewer-handler', method: 'setPanorama', data: pano } );

        } );

        this.linkedSpots.push( spot );

        this.add( spot );

        if ( !ended ) {

        	pano.link( this, true );

        }

	};

	PANOLENS.Panorama.prototype.reset = function () {

		this.children.length = 0;	

	};

	PANOLENS.Panorama.prototype.fadeIn = function () {

		new TWEEN.Tween( this.material )
		.to( { opacity: 1 }, this.animationDuration )
		.easing( TWEEN.Easing.Quartic.Out )
		.start();

	};

	PANOLENS.Panorama.prototype.fadeOut = function () {

		new TWEEN.Tween( this.material )
		.to( { opacity: 0 }, this.animationDuration )
		.easing( TWEEN.Easing.Quartic.Out )
		.start();

	};

	PANOLENS.Panorama.prototype.onEnter = function () {

		new TWEEN.Tween( this )
		.to( {}, this.animationDuration )
		.easing( TWEEN.Easing.Quartic.Out )
		.onStart( function () {

			this.dispatchEvent( { type: 'enter-start' } );

			if ( this.loaded ) {

				this.fadeIn();
				this.toggleChildrenVisibility( true, this.animationDuration );

			} else {

				this.load();

			}

			this.visible = true;
		} )
		.delay( this.animationDuration )
		.start();

		this.dispatchEvent( { type: 'enter' } );

	};

	PANOLENS.Panorama.prototype.onLeave = function () {

		new TWEEN.Tween( this )
		.to( {}, this.animationDuration )
		.easing( TWEEN.Easing.Quartic.Out )
		.onStart( function () {

			this.fadeOut();
			this.toggleChildrenVisibility( false );

		} )
		.onComplete( function () {

			this.visible = false;

		} )
		.start();

		this.dispatchEvent( { type: 'leave' } );

	};

} )();