const data = {
    default_params: {
        env_enabled: true,
        env_texture_src: 'assets/hdr/atelier.hdr',
        env_default_background: null,
        env_default_texture: null,
        env_texture: null,
        postfx_enabled: false,
        postfx_bloom_exposure: 1,
        postfx_bloom_strength: 0.2,
        postfx_bloom_treshold: 0.5,
        postfx_bloom_radius: 0.2,
        camera_fov: 45,
        scene_src: window.file_to_open || '',
        resolution_scale: 1,
        active_scene: null,
        show_gizmo: true,
        torch_light: false,
        application_has_updates: '',
        check_updates: true,
        inspect_mode: '',
        inspect_matcap_mode: 'AAA',
    },
    about_text: `Feature-rich meshes preview
    for Windows, Macos and Linux.
    
    Updates:
        * https://github.com/sanyabeast/preview_3d
    
    Authors:
      * Prototyped and implemented: 
        - @sanyabeast
      * Icon: 
        - @nataleesha
    
    Credids:
      * Mr. Doob & THREE.js team
      * Electron team
      * Tweakpane team
    
    Kyiv, Ukraine, 2023;
    `,
    info_text: `Keycodes:
    * Frame scene:
      - F
      - Space
      - Numpad .
      - \
    * Open file:
      - Enter
    * Reload scene:
      - R
    * Collapse GUI:
      - Esc
    `
}

export default data