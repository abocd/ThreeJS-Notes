/**
 * @author alteredq / http://alteredqualia.com/
 * @author mrdoob / http://mrdoob.com/
 * @author Daosheng Mu / https://github.com/DaoshengMu/
 */
/**
 * @classdesc 图片对象工具集<br />
 * 注释内容部分参照 http://blog.csdn.net/omni360
 * @constructor
 */
THREE.ImageUtils = {
	/**
	 * @desc 跨域加载
	 */
	crossOrigin: undefined,
	/**
	 * @desc 加载纹理
	 * @param {string} url 图片url
	 * @param {number} mapping 图片映射方式
	 * @param {*} onLoad 加载回调函数
	 * @param {*} onError 错误回调函数
	 * @returns {THREE.Texture}
	 */
	loadTexture: function ( url, mapping, onLoad, onError ) {
		// 图片加载器
		var loader = new THREE.ImageLoader();
		loader.crossOrigin = this.crossOrigin;

		// 创建纹理
		var texture = new THREE.Texture( undefined, mapping );

		// 加载图片
		loader.load( url, function ( image ) {

			texture.image = image;
			texture.needsUpdate = true;
			// 完成回调
			if ( onLoad ) onLoad( texture );

		}, undefined, function ( event ) {
			// 错误回调
			if ( onError ) onError( event );

		} );
		// 图片源路径
		texture.sourceFile = url;

		return texture;

	},
	/**
	 * @desc 加载立方体纹理
	 * @param {string[]} array 图片url
	 * @param {number} mapping 图片映射方式
	 * @param {*} onLoad 加载回调函数
	 * @param {*} onError 错误回调函数
	 * @returns {THREE.CubeTexture}
	 */
	loadTextureCube: function ( array, mapping, onLoad, onError ) {

		var images = [];

		var loader = new THREE.ImageLoader();
		loader.crossOrigin = this.crossOrigin;

		var texture = new THREE.CubeTexture( images, mapping );

		// no flipping needed for cube textures

		texture.flipY = false;

		var loaded = 0;

		var loadTexture = function ( i ) {

			loader.load( array[ i ], function ( image ) {

				texture.images[ i ] = image;

				loaded += 1;

				if ( loaded === 6 ) {

					texture.needsUpdate = true;

					if ( onLoad ) onLoad( texture );

				}

			} );

		}

		for ( var i = 0, il = array.length; i < il; ++ i ) {

			loadTexture( i );

		}

		return texture;

	},
	/**
	 * @ignore
	 */
	loadCompressedTexture: function () {

		console.error( 'THREE.ImageUtils.loadCompressedTexture has been removed. Use THREE.DDSLoader instead.' )

	},
	/**
	 * @ignore
	 */
	loadCompressedTextureCube: function () {

		console.error( 'THREE.ImageUtils.loadCompressedTextureCube has been removed. Use THREE.DDSLoader instead.' )

	},
	/**
	 * @desc 通过参数image(图像对象),参数(深度信息),获得法线贴图
	 * @param {Image} image 图片对象
	 * @param {float} depth 深度信息 [0 ,1]
	 * @returns {THREE.Texture}
	 */
	getNormalMap: function ( image, depth ) {

		// Adapted from http://www.paulbrunt.co.uk/lab/heightnormal/

		var cross = function ( a, b ) {

			return [ a[ 1 ] * b[ 2 ] - a[ 2 ] * b[ 1 ], a[ 2 ] * b[ 0 ] - a[ 0 ] * b[ 2 ], a[ 0 ] * b[ 1 ] - a[ 1 ] * b[ 0 ] ];

		}

		var subtract = function ( a, b ) {

			return [ a[ 0 ] - b[ 0 ], a[ 1 ] - b[ 1 ], a[ 2 ] - b[ 2 ] ];

		}

		var normalize = function ( a ) {

			var l = Math.sqrt( a[ 0 ] * a[ 0 ] + a[ 1 ] * a[ 1 ] + a[ 2 ] * a[ 2 ] );
			return [ a[ 0 ] / l, a[ 1 ] / l, a[ 2 ] / l ];

		}

		depth = depth | 1;

		var width = image.width;
		var height = image.height;

		var canvas = document.createElement( 'canvas' );
		canvas.width = width;
		canvas.height = height;

		var context = canvas.getContext( '2d' );
		context.drawImage( image, 0, 0 );

		var data = context.getImageData( 0, 0, width, height ).data;
		var imageData = context.createImageData( width, height );
		var output = imageData.data;

		for ( var x = 0; x < width; x ++ ) {

			for ( var y = 0; y < height; y ++ ) {

				var ly = y - 1 < 0 ? 0 : y - 1;
				var uy = y + 1 > height - 1 ? height - 1 : y + 1;
				var lx = x - 1 < 0 ? 0 : x - 1;
				var ux = x + 1 > width - 1 ? width - 1 : x + 1;

				var points = [];
				var origin = [ 0, 0, data[ ( y * width + x ) * 4 ] / 255 * depth ];
				points.push( [ - 1, 0, data[ ( y * width + lx ) * 4 ] / 255 * depth ] );
				points.push( [ - 1, - 1, data[ ( ly * width + lx ) * 4 ] / 255 * depth ] );
				points.push( [ 0, - 1, data[ ( ly * width + x ) * 4 ] / 255 * depth ] );
				points.push( [  1, - 1, data[ ( ly * width + ux ) * 4 ] / 255 * depth ] );
				points.push( [ 1, 0, data[ ( y * width + ux ) * 4 ] / 255 * depth ] );
				points.push( [ 1, 1, data[ ( uy * width + ux ) * 4 ] / 255 * depth ] );
				points.push( [ 0, 1, data[ ( uy * width + x ) * 4 ] / 255 * depth ] );
				points.push( [ - 1, 1, data[ ( uy * width + lx ) * 4 ] / 255 * depth ] );

				var normals = [];
				var num_points = points.length;

				for ( var i = 0; i < num_points; i ++ ) {

					var v1 = points[ i ];
					var v2 = points[ ( i + 1 ) % num_points ];
					v1 = subtract( v1, origin );
					v2 = subtract( v2, origin );
					normals.push( normalize( cross( v1, v2 ) ) );

				}

				var normal = [ 0, 0, 0 ];

				for ( var i = 0; i < normals.length; i ++ ) {

					normal[ 0 ] += normals[ i ][ 0 ];
					normal[ 1 ] += normals[ i ][ 1 ];
					normal[ 2 ] += normals[ i ][ 2 ];

				}

				normal[ 0 ] /= normals.length;
				normal[ 1 ] /= normals.length;
				normal[ 2 ] /= normals.length;

				var idx = ( y * width + x ) * 4;

				output[ idx ] = ( ( normal[ 0 ] + 1.0 ) / 2.0 * 255 ) | 0;
				output[ idx + 1 ] = ( ( normal[ 1 ] + 1.0 ) / 2.0 * 255 ) | 0;
				output[ idx + 2 ] = ( normal[ 2 ] * 255 ) | 0;
				output[ idx + 3 ] = 255;

			}

		}

		context.putImageData( imageData, 0, 0 );

		return canvas;

	},
	/**
	 * @desc 生成DataTexture对象使用的图像数据
	 * @param {number} width 宽度
	 * @param {number} height 高度
	 * @param {THREE.Color} color 颜色
	 * @returns {THREE.DataTexture}
	 */
	generateDataTexture: function ( width, height, color ) {

		var size = width * height;
		var data = new Uint8Array( 3 * size );

		var r = Math.floor( color.r * 255 );
		var g = Math.floor( color.g * 255 );
		var b = Math.floor( color.b * 255 );

		for ( var i = 0; i < size; i ++ ) {

			data[ i * 3 ] 	   = r;
			data[ i * 3 + 1 ] = g;
			data[ i * 3 + 2 ] = b;

		}

		var texture = new THREE.DataTexture( data, width, height, THREE.RGBFormat );
		texture.needsUpdate = true;

		return texture;

	}

};
