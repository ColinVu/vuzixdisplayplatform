# Vuzix Dev UI

A React-based canvas editor using react-konva for creating and managing visual elements with time-based attributes.

## Features

- **640x480 Canvas**: Fixed-size canvas for precise element positioning
- **Element Types**: Support for text, rectangles, lines, and images
- **Attribute Editing**: Real-time editing of element properties
- **Time-based Elements**: Start and end time attributes for each element
- **JSON Export**: Export all elements and their attributes as JSON

## Element Types & Attributes

### Text Elements
- ID (auto-generated)
- Text content
- X, Y position
- Alignment (left, center, right)
- Start time, End time
- Font size: Fixed at 30px

### Rectangle Elements
- ID (auto-generated)
- X, Y position
- Width, Height
- Corner radius
- Border width
- Start time, End time

### Line Elements
- ID (auto-generated)
- X1, Y1 (start position)
- X2, Y2 (end position)
- Line width
- Start time, End time

### Image Elements
- ID (auto-generated)
- X, Y position
- Width, Height (native size, read-only)
- Start time, End time

## Getting Started

### Prerequisites

Make sure you have Node.js and npm installed on your system.

### Installation

1. Clone or download this repository
2. Navigate to the project directory
3. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

### Running the Application

\`\`\`bash
npm run dev
\`\`\`

This will start the development server. Open your browser and navigate to the provided localhost URL (typically http://localhost:5173).

### Building for Production

\`\`\`bash
npm run build
\`\`\`

## Usage

1. **Creating Elements**: Click the corresponding button in the sidebar (Add Text, Add Rectangle, Add Line, Add Image)
2. **Placing Elements**: After selecting a tool, click on the canvas to place the element
3. **Selecting Elements**: Click on any element in the canvas to select it
4. **Moving Elements**: Drag any element to reposition it on the canvas
5. **Resizing Elements**: 
   - **Lines**: Drag the red circle endpoints to reshape lines
   - **Rectangles**: Drag the red square handles on the edges to resize width/height
6. **Editing Attributes**: Use the attribute editor panel that appears when an element is selected
7. **Exporting Data**: Click the "Export to JSON" button to download all elements as a JSON file

## Project Structure

- `src/App.jsx` - Main application component
- `src/main.jsx` - React application entry point
- `src/index.css` - Application styles
- `package.json` - Project dependencies and scripts

## Dependencies

- React 18.2.0
- react-konva 18.2.10
- konva 9.2.0
- use-image 1.1.1
- Vite (build tool) 