
import * as THREE from 'three';
import { texture_loader } from './loaders.js';

/** inspection materials */
let matcaps = {
    'AAA': '0A0A0A_A9A9A9_525252_747474-512px',
    'AAB': '0F0F0F_4B4B4B_1C1C1C_2C2C2C-512px',
    'AAC': '1A2461_3D70DB_2C3C8F_2C6CAC-512px',
    'AAD': '1B1B1B_515151_7E7E7E_6C6C6C-512px',
    'AAE': '2D2D2A_74716E_8F8C8C_92958E-512px',
    'AAF': '2D2D2F_C6C2C5_727176_94949B-512px',
    'AAG': '2E763A_78A0B7_B3D1CF_14F209-512px',
    'AAH': '2EAC9E_61EBE3_4DDDD1_43D1C6-512px',
    'AAJ': '0404E8_0404B5_0404CB_3333FC-512px',
    'AAK': '15100F_241D1B_292424_2C2C27-512px',
    'AAL': '191514_6D5145_4E3324_3B564D-512px'
}
let override_materials = {
    wireframe: new THREE.MeshBasicMaterial({ wireframe: true }),
    matcap: new THREE.MeshMatcapMaterial({
        matcap: texture_loader.load(`./assets/matcap/${matcaps.AAA}.png`)
    }),
    normal: new THREE.MeshNormalMaterial()
}

export {
    matcaps,
    override_materials
}