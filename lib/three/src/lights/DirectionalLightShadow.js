import { LightShadow } from './LightShadow.js';
import { OrthographicCamera } from '../cameras/OrthographicCamera.js';

class DirectionalLightShadow extends LightShadow {

	constructor() {

		/** MODIFIED SOURCE */
		super( new OrthographicCamera( - 5, 5, 5, - 5, 0.01, 500 ) );

		this.isDirectionalLightShadow = true;

	}

}

export { DirectionalLightShadow };
