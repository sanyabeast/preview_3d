import { notifications, set_loader } from './gui.js'
import { renderer } from './render.js'
import { state } from './state.js';
import { loaders } from './loaders.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { get_mime, logd } from './util.js';

const gltf_exporter = new GLTFExporter();
const GltfExportMode = {
    GLTF: 0,
    GLB: 1
}

const exporting_settings = {
    gltf: {
        mode: GltfExportMode.GLB,
        texture_size: 1024,
    },
    image: {
        format: 'png',
        quality: 1
    }
}

let gltf_export_state = {
    last_scene_src: '',
    last_scene_data: null
}

function init_exporting() {
    /** */
}

function export_frame_as_image() {
    return new Promise((resolve, reject) => {
        try {
            // console.log(renderer)
            // let blob = renderer.domElement.toBlob((data) => {

            //     console.log(blob)
            //     console.log(data)
            //     _download_blob(blob)
            //     resolve(data)
            // })
            let canvas = renderer.domElement;

            let fs = OS_TOOLS.fs;
            let base_path = OS_TOOLS.path.dirname(state.scene_src)
            let file_name = OS_TOOLS.path.basename(state.scene_src).replace(OS_TOOLS.path.extname(state.scene_src), '')
            let timestamp = (+new Date()).toString()
            timestamp = timestamp.substring(timestamp.length - 5, timestamp.length)
            let file_path = OS_TOOLS.path.join(base_path, `${file_name}_f${timestamp}.png`)
            console.log(file_path)
            const url = canvas.toDataURL('image/png');

            // remove Base64 stuff from the Image
            const base64Data = url.replace(/^data:image\/png;base64,/, "");
            fs.writeFile(file_path, base64Data, 'base64', function (err) {
                console.log(err);
            });

            notifications.open({
                type: 'info',
                message: `Frame successfully saved as\n${file_path}`,
            })
            resolve(file_path)
        } catch (err) {
            console.error(err)
            notifications.open({
                type: 'error',
                message: `${err.message}`,
            })
            reject(err)
        }
    })
}

function export_scene_as_gltf() {
    return new Promise(async (resolve, reject) => {
        set_loader(true)
        logd('export_scene_as_gltf', `begin exporting ${state.scene_src} as gltf`)
        try {
            let base_path = OS_TOOLS.path.dirname(state.scene_src)
            let file_name = OS_TOOLS.path.basename(state.scene_src).replace(OS_TOOLS.path.extname(state.scene_src), '')
            let file_path = OS_TOOLS.path.join(base_path, `${file_name}_t${exporting_settings.gltf.texture_size.toString()}.${exporting_settings.gltf.mode === GltfExportMode.GLB ? 'glb' : 'gltf'}`)
            console.log(file_path)

            if (gltf_export_state.last_scene_data === null || gltf_export_state.last_scene_src !== state.scene_src) {
                logd('export_scene_as_gltf', 'reloading original model from disk...')
                gltf_export_state.last_scene_data = await loaders[get_mime(state.scene_src)](state.scene_src)
            }

            let last_scene_data = gltf_export_state.last_scene_data
            gltf_exporter.parse(
                last_scene_data.scene,
                // called when the gltf has been generated
                async function (result) {
                    if (result instanceof ArrayBuffer) {
                        // saveArrayBuffer( result, 'scene.glb' );
                        let buffer = Buffer.from(result)
                        await OS_TOOLS.fs.createWriteStream(file_path).write(buffer)
                        notifications.open({
                            type: 'info',
                            message: `Scene successfully exported as\n${file_path}`,
                        })
                    } else {
                        const output = JSON.stringify(result, null, 2);
                        OS_TOOLS.fs.writeFileSync(file_path, output, 'utf-8')
                        notifications.open({
                            type: 'info',
                            message: `Scene successfully exported as\n${file_path}`,
                        })
                        //saveString( output, 'scene.gltf' );
                    }
                    resolve(file_path)
                    set_loader(false)
                },
                // called when there is an error in the generation
                function (error) {
                    console.log('An error happened');
                    notifications.open({
                        type: 'error',
                        message: `${error.message || error}`,
                    })
                    reject(error)
                    set_loader(false)
                },
                {
                    animations: last_scene_data.animations,
                    binary: exporting_settings.gltf.mode === GltfExportMode.GLB,
                    maxTextureSize: exporting_settings.gltf.texture_size
                }
            );
            console.log(last_scene_data)
        } catch (err) {
            console.error(err)
            notifications.open({
                type: 'error',
                message: `${err.message}`,
            })
            reject(err)
            set_loader(false)
        }
    })

}

export {
    init_exporting,
    export_frame_as_image,
    export_scene_as_gltf,
    exporting_settings,
    GltfExportMode
}