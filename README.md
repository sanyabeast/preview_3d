# Preview3D

A modern, lightweight 3D model viewer built with Three.js and Electron. Preview3D allows you to easily view and inspect 3D models in various formats.

![Preview3D](assets/app.ico)

## Features

- Support for multiple 3D file formats: GLB, GLTF, FBX, OBJ, and HDR
- Advanced rendering options with customizable lighting and environment settings
- Model inspection tools to explore scene hierarchy and properties
- Export capabilities for screenshots and model conversion
- Multiple window support for comparing different models
- File association for seamless integration with your OS

## Usage

### Running from Source

```bash
# Clone the repository
git clone https://github.com/sanyabeast/preview_3d.git
cd preview_3d

# Install dependencies
npm install

# Start the application
npm start

# Start with a sample model
npm run start-sample
```

### Opening Files

- Drag and drop 3D files onto the application window
- Use the file menu to open models
- Associate 3D files with Preview3D to open them directly from your file explorer

## Building

```bash
# Create a distributable package
npm run bundle
```

## Development

Preview3D is built with:
- Electron for cross-platform desktop integration
- Three.js for 3D rendering
- Custom shaders for advanced lighting effects

## License

MIT © [@sanyabeast](https://github.com/sanyabeast)
