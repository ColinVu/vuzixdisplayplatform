import React, { useState, useRef, useCallback } from 'react'
import { Stage, Layer, Text, Image, Line, Rect, Transformer, Circle } from 'react-konva'
import useImage from 'use-image'
import questionSignImage from './assets/question-sign.png'

const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 480

// Image component for Konva
const ImageElement = ({ element, onClick, onMouseEnter, onMouseLeave, onDragStart, onDragMove, onDragEnd }) => {
  const [image] = useImage(element.src)
  return (
    <Image
      image={image}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      draggable
      onClick={onClick}
      onMouseEnter={(e) => {
        onMouseEnter()
        e.target.getStage().container().style.cursor = 'pointer'
      }}
      onMouseLeave={(e) => {
        onMouseLeave()
        e.target.getStage().container().style.cursor = 'default'
      }}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    />
  )
}

function App() {
  const [elements, setElements] = useState([])
  const [selectedElement, setSelectedElement] = useState(null)
  const [hoveredElement, setHoveredElement] = useState(null)
  const [draggedElement, setDraggedElement] = useState(null)
  const [tool, setTool] = useState(null)
  const [imageUpload, setImageUpload] = useState(null)
  const stageRef = useRef()
  const transformerRef = useRef()
  const fileInputRef = useRef()
  const jsonInputRef = useRef()
  const imageReplaceInputRef = useRef()

  // Generate unique ID for elements
  const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Handle stage click for creating elements
  const handleStageClick = useCallback((e) => {
    const pos = e.target.getStage().getPointerPosition()
    
    if (tool && pos) {
      let newElement = null
      
      switch (tool) {
        case 'text':
          newElement = {
            id: generateId(),
            type: 'text',
            text: 'Sample Text',
            x: pos.x,
            y: pos.y,
            alignment: 'left',
            startTime: 0,
            endTime: 10
          }
          break
                 case 'rectangle':
           newElement = {
             id: generateId(),
             type: 'rectangle',
             x: pos.x,
             y: pos.y,
             width: 100,
             height: 50,
             cornerRadius: 0,
             borderWidth: 1,
             startTime: 0,
             endTime: 10
           }
          break
        case 'line':
          newElement = {
            id: generateId(),
            type: 'line',
            x1: pos.x,
            y1: pos.y,
            x2: pos.x + 50,
            y2: pos.y + 50,
            width: 2,
            startTime: 0,
            endTime: 10
          }
          break
        case 'image':
          if (imageUpload) {
            newElement = {
              id: generateId(),
              type: 'image',
              x: pos.x,
              y: pos.y,
              src: imageUpload.src,
              width: imageUpload.width,
              height: imageUpload.height,
              filename: imageUpload.filename,
              filepath: imageUpload.filepath,
              startTime: 0,
              endTime: 10
            }
            setImageUpload(null)
          }
          break
        default:
          break
      }
      
      if (newElement) {
        setElements(prev => [...prev, newElement])
        setSelectedElement(newElement)
        setTool(null)
      }
    } else {
      // Deselect if clicking on empty space
      setSelectedElement(null)
    }
  }, [tool])

  // Handle element selection
  const handleElementClick = useCallback((element, e) => {
    e.cancelBubble = true
    setSelectedElement(element)
  }, [])

  // Handle element hover
  const handleElementMouseEnter = useCallback((element) => {
    setHoveredElement(element)
  }, [])

  const handleElementMouseLeave = useCallback(() => {
    setHoveredElement(null)
  }, [])

  // Update element attributes
  const updateElement = useCallback((elementId, updates) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ))
    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement(prev => ({ ...prev, ...updates }))
    }
  }, [selectedElement])

  // Handle element drag start
  const handleElementDragStart = useCallback((element, e) => {
    setDraggedElement({ element, target: e.target })
    setHoveredElement(null) // Clear hover outline when dragging starts
    e.target.getStage().container().style.cursor = 'grabbing'
  }, [])

  // Handle element drag move
  const handleElementDragMove = useCallback((element, e) => {
    if (draggedElement && draggedElement.element.id === element.id) {
      setDraggedElement({ element, target: e.target })
    }
  }, [draggedElement])

  // Handle element drag end
  const handleElementDragEnd = useCallback((element, e) => {
    const newPos = e.target.position()
    
    if (element.type === 'line') {
      // For lines, we need to calculate the offset and update all coordinates
      const offsetX = newPos.x
      const offsetY = newPos.y
      
      updateElement(element.id, {
        x1: element.x1 + offsetX,
        y1: element.y1 + offsetY,
        x2: element.x2 + offsetX,
        y2: element.y2 + offsetY
      })
      
      // Reset the line position to (0,0) since we're managing coordinates manually
      e.target.position({ x: 0, y: 0 })
    } else {
      // For other elements, just update x and y
      updateElement(element.id, {
        x: newPos.x,
        y: newPos.y
      })
    }
    
    setDraggedElement(null)
    e.target.getStage().container().style.cursor = 'default'
  }, [updateElement])

  // Handle line endpoint drag
  const handleLineEndpointDrag = useCallback((element, isStart, e) => {
    const newPos = e.target.position()
    
    if (isStart) {
      // Dragging start point (x1, y1)
      updateElement(element.id, {
        x1: newPos.x,
        y1: newPos.y
      })
    } else {
      // Dragging end point (x2, y2)
      updateElement(element.id, {
        x2: newPos.x,
        y2: newPos.y
      })
    }
  }, [updateElement])

  // Handle line endpoint drag end
  const handleLineEndpointDragEnd = useCallback((e) => {
    e.target.getStage().container().style.cursor = 'default'
  }, [])

  // Handle rectangle edge drag end
  const handleRectangleEdgeDragEnd = useCallback((e) => {
    e.target.getStage().container().style.cursor = 'default'
  }, [])

  // Handle rectangle edge drag
  const handleRectangleEdgeDrag = useCallback((element, edge, e) => {
    const newPos = e.target.position()
    
    switch (edge) {
      case 'top':
        // Dragging top edge - adjust y and height, keep handle centered horizontally
        const newHeight = element.height + (element.y - newPos.y)
        if (newHeight > 5) { // Minimum height
          updateElement(element.id, {
            y: newPos.y,
            height: newHeight
          })
        }
        // Always reset handle to stay centered horizontally, but constrain vertically
        const constrainedY = newHeight > 5 ? newPos.y : element.y - (5 - element.height)
        e.target.position({
          x: element.x + element.width / 2,
          y: constrainedY
        })
        break
      case 'bottom':
        // Dragging bottom edge - adjust height only, keep handle centered horizontally
        const bottomHeight = newPos.y - element.y
        if (bottomHeight > 5) { // Minimum height
          updateElement(element.id, {
            height: bottomHeight
          })
        }
        // Always reset handle to stay centered horizontally, but constrain vertically
        const constrainedBottomY = bottomHeight > 5 ? newPos.y : element.y + 5
        e.target.position({
          x: element.x + element.width / 2,
          y: constrainedBottomY
        })
        break
      case 'left':
        // Dragging left edge - adjust x and width, keep handle centered vertically
        const newWidth = element.width + (element.x - newPos.x)
        if (newWidth > 5) { // Minimum width
          updateElement(element.id, {
            x: newPos.x,
            width: newWidth
          })
        }
        // Always reset handle to stay centered vertically, but constrain horizontally
        const constrainedX = newWidth > 5 ? newPos.x : element.x - (5 - element.width)
        e.target.position({
          x: constrainedX,
          y: element.y + element.height / 2
        })
        break
      case 'right':
        // Dragging right edge - adjust width only, keep handle centered vertically
        const rightWidth = newPos.x - element.x
        if (rightWidth > 5) { // Minimum width
          updateElement(element.id, {
            width: rightWidth
          })
        }
        // Always reset handle to stay centered vertically, but constrain horizontally
        const constrainedRightX = rightWidth > 5 ? newPos.x : element.x + 5
        e.target.position({
          x: constrainedRightX,
          y: element.y + element.height / 2
        })
        break
    }
  }, [updateElement])

  // Delete element
  const deleteElement = useCallback((elementId) => {
    setElements(prev => prev.filter(el => el.id !== elementId))
    setSelectedElement(null)
  }, [])

  // Get element bounds for selection/hover outlines
  const getElementBounds = useCallback((element) => {
    // Check if this element is being dragged
    const isDragged = draggedElement && draggedElement.element.id === element.id
    let currentX = element.x
    let currentY = element.y
    
    if (isDragged) {
      const dragPos = draggedElement.target.position()
      currentX = dragPos.x
      currentY = dragPos.y
    }
    
          switch (element.type) {
        case 'text':
          // Approximate text bounds - this is a rough estimate for size 30 text
          const textWidth = element.text.length * 18; // ~18px per character at size 30
          return { x: currentX, y: currentY, width: textWidth, height: 36 }
      case 'rectangle':
        return { x: currentX, y: currentY, width: element.width, height: element.height }
      case 'line':
        if (isDragged) {
          const dragPos = draggedElement.target.position()
          const offsetX = dragPos.x
          const offsetY = dragPos.y
          const newX1 = element.x1 + offsetX
          const newY1 = element.y1 + offsetY
          const newX2 = element.x2 + offsetX
          const newY2 = element.y2 + offsetY
          const minX = Math.min(newX1, newX2)
          const maxX = Math.max(newX1, newX2)
          const minY = Math.min(newY1, newY2)
          const maxY = Math.max(newY1, newY2)
          return { x: minX - 2, y: minY - 2, width: maxX - minX + 4, height: maxY - minY + 4 }
        } else {
          const minX = Math.min(element.x1, element.x2)
          const maxX = Math.max(element.x1, element.x2)
          const minY = Math.min(element.y1, element.y2)
          const maxY = Math.max(element.y1, element.y2)
          return { x: minX - 2, y: minY - 2, width: maxX - minX + 4, height: maxY - minY + 4 }
        }
      case 'image':
        return { x: currentX, y: currentY, width: element.width, height: element.height }
      default:
        return { x: 0, y: 0, width: 0, height: 0 }
    }
  }, [draggedElement])

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new window.Image()
        img.onload = () => {
          setImageUpload({
            src: e.target.result,
            width: img.naturalWidth,
            height: img.naturalHeight,
            filename: file.name,
            filepath: file.webkitRelativePath || file.name // webkitRelativePath may be empty, fallback to name
          })
          setTool('image')
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle image replacement
  const replaceImage = () => {
    if (selectedElement && selectedElement.type === 'image') {
      imageReplaceInputRef.current.click()
    }
  }

  const handleImageReplacement = (event) => {
    const file = event.target.files[0]
    if (file && selectedElement && selectedElement.type === 'image') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new window.Image()
        img.onload = () => {
          // Update the selected element with the new image data
          updateElement(selectedElement.id, {
            src: e.target.result,
            width: img.naturalWidth,
            height: img.naturalHeight,
            filename: file.name,
            filepath: file.webkitRelativePath || file.name
          })
          
          // Clear the file input
          event.target.value = ''
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  // Export to JSON
  const exportToJSON = () => {
    // Remove src attribute from image elements for export
    const exportData = elements.map(element => {
      if (element.type === 'image') {
        const { src, ...elementWithoutSrc } = element
        return elementWithoutSrc
      }
      return element
    })
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = 'elements.json'
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  // Import from JSON
  const importFromJSON = () => {
    jsonInputRef.current.click()
  }

  const handleJSONFileUpload = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/json') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result)
          
          // Validate that it's an array
          if (!Array.isArray(importedData)) {
            alert('Invalid JSON format. Expected an array of elements.')
            return
          }

          // Process the imported elements
          const processedElements = importedData.map(element => {
            // Generate new IDs to avoid conflicts
            const newElement = {
              ...element,
              id: generateId()
            }

            // Replace image sources with placeholder
            if (element.type === 'image') {
              newElement.src = questionSignImage
              newElement.filename = 'question-sign.png'
              newElement.filepath = 'question-sign.png'
              // Set default dimensions if not present
              if (!newElement.width) newElement.width = 100
              if (!newElement.height) newElement.height = 100
            }

            return newElement
          })

          // Add the processed elements to the canvas
          setElements(prev => [...prev, ...processedElements])
          
          // Clear the file input
          event.target.value = ''
          
          alert(`Successfully imported ${processedElements.length} elements`)
        } catch (error) {
          console.error('Error parsing JSON:', error)
          alert('Error parsing JSON file. Please check the file format.')
        }
      }
      reader.readAsText(file)
    } else {
      alert('Please select a valid JSON file')
    }
  }

  return (
    <div className="app-container">
      <div className="canvas-container">
        <Stage
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleStageClick}
          ref={stageRef}
        >
          <Layer>
            {elements.map((element) => {
              switch (element.type) {
                case 'text':
                  return (
                    <Text
                      key={element.id}
                      text={element.text}
                      x={element.x}
                      y={element.y}
                      fontSize={30}
                      align={element.alignment}
                      fill="black"
                      draggable
                      onClick={(e) => handleElementClick(element, e)}
                      onMouseEnter={(e) => {
                        handleElementMouseEnter(element)
                        e.target.getStage().container().style.cursor = 'pointer'
                      }}
                      onMouseLeave={(e) => {
                        handleElementMouseLeave()
                        e.target.getStage().container().style.cursor = 'default'
                      }}
                      onDragStart={(e) => handleElementDragStart(element, e)}
                      onDragMove={(e) => handleElementDragMove(element, e)}
                      onDragEnd={(e) => handleElementDragEnd(element, e)}
                    />
                  )
                case 'rectangle':
                  return (
                    <Rect
                      key={element.id}
                      x={element.x}
                      y={element.y}
                      width={element.width}
                      height={element.height}
                      cornerRadius={element.cornerRadius}
                      stroke="black"
                      strokeWidth={element.borderWidth || 1}
                      fill="transparent"
                      draggable
                      onClick={(e) => handleElementClick(element, e)}
                      onMouseEnter={(e) => {
                        handleElementMouseEnter(element)
                        e.target.getStage().container().style.cursor = 'pointer'
                      }}
                      onMouseLeave={(e) => {
                        handleElementMouseLeave()
                        e.target.getStage().container().style.cursor = 'default'
                      }}
                      onDragStart={(e) => handleElementDragStart(element, e)}
                      onDragMove={(e) => handleElementDragMove(element, e)}
                      onDragEnd={(e) => handleElementDragEnd(element, e)}
                    />
                  )
                case 'line':
                  return (
                    <>
                      {/* Invisible wider hitbox for easier selection */}
                      <Line
                        key={`${element.id}-hitbox`}
                        points={[element.x1, element.y1, element.x2, element.y2]}
                        stroke="transparent"
                        strokeWidth={Math.max(element.width + 8, 12)} // At least 12px wide, or 8px wider than visible line
                        draggable
                        onClick={(e) => handleElementClick(element, e)}
                        onMouseEnter={(e) => {
                          handleElementMouseEnter(element)
                          e.target.getStage().container().style.cursor = 'pointer'
                        }}
                        onMouseLeave={(e) => {
                          handleElementMouseLeave()
                          e.target.getStage().container().style.cursor = 'default'
                        }}
                        onDragStart={(e) => handleElementDragStart(element, e)}
                        onDragMove={(e) => handleElementDragMove(element, e)}
                        onDragEnd={(e) => handleElementDragEnd(element, e)}
                      />
                      {/* Visible line */}
                      <Line
                        key={element.id}
                        points={[element.x1, element.y1, element.x2, element.y2]}
                        stroke="black"
                        strokeWidth={element.width}
                        listening={false} // Don't handle events on the visible line
                      />
                    </>
                  )
                case 'image':
                  return (
                    <ImageElement
                      key={element.id}
                      element={element}
                      onClick={(e) => handleElementClick(element, e)}
                      onMouseEnter={() => handleElementMouseEnter(element)}
                      onMouseLeave={handleElementMouseLeave}
                      onDragStart={(e) => handleElementDragStart(element, e)}
                      onDragMove={(e) => handleElementDragMove(element, e)}
                      onDragEnd={(e) => handleElementDragEnd(element, e)}
                    />
                  )
                default:
                  return null
              }
            })}
            
            {/* Line endpoint handles */}
            {selectedElement && selectedElement.type === 'line' && (
              <>
                {/* Start point */}
                <Circle
                  x={(() => {
                    // Account for line being dragged
                    const isDragged = draggedElement && draggedElement.element.id === selectedElement.id
                    if (isDragged) {
                      const dragPos = draggedElement.target.position()
                      return selectedElement.x1 + dragPos.x
                    }
                    return selectedElement.x1
                  })()}
                  y={(() => {
                    // Account for line being dragged
                    const isDragged = draggedElement && draggedElement.element.id === selectedElement.id
                    if (isDragged) {
                      const dragPos = draggedElement.target.position()
                      return selectedElement.y1 + dragPos.y
                    }
                    return selectedElement.y1
                  })()}
                  radius={6}
                  fill="red"
                  stroke="white"
                  strokeWidth={2}
                  draggable
                  onDragMove={(e) => handleLineEndpointDrag(selectedElement, true, e)}
                  onMouseEnter={(e) => {
                    e.target.getStage().container().style.cursor = 'grab'
                  }}
                  onMouseLeave={(e) => {
                    e.target.getStage().container().style.cursor = 'default'
                  }}
                  onDragStart={(e) => {
                    e.target.getStage().container().style.cursor = 'grabbing'
                  }}
                  onDragEnd={handleLineEndpointDragEnd}
                />
                {/* End point */}
                <Circle
                  x={(() => {
                    // Account for line being dragged
                    const isDragged = draggedElement && draggedElement.element.id === selectedElement.id
                    if (isDragged) {
                      const dragPos = draggedElement.target.position()
                      return selectedElement.x2 + dragPos.x
                    }
                    return selectedElement.x2
                  })()}
                  y={(() => {
                    // Account for line being dragged
                    const isDragged = draggedElement && draggedElement.element.id === selectedElement.id
                    if (isDragged) {
                      const dragPos = draggedElement.target.position()
                      return selectedElement.y2 + dragPos.y
                    }
                    return selectedElement.y2
                  })()}
                  radius={6}
                  fill="red"
                  stroke="white"
                  strokeWidth={2}
                  draggable
                  onDragMove={(e) => handleLineEndpointDrag(selectedElement, false, e)}
                  onMouseEnter={(e) => {
                    e.target.getStage().container().style.cursor = 'grab'
                  }}
                  onMouseLeave={(e) => {
                    e.target.getStage().container().style.cursor = 'default'
                  }}
                  onDragStart={(e) => {
                    e.target.getStage().container().style.cursor = 'grabbing'
                  }}
                  onDragEnd={handleLineEndpointDragEnd}
                />
              </>
            )}

            {/* Rectangle edge handles */}
            {selectedElement && selectedElement.type === 'rectangle' && (
              <>
                {/* Top edge handle */}
                <Rect
                  x={(() => {
                    const isDragged = draggedElement && draggedElement.element.id === selectedElement.id
                    const currentX = isDragged ? draggedElement.target.position().x : selectedElement.x
                    return currentX + selectedElement.width / 2 - 4
                  })()}
                  y={(() => {
                    const isDragged = draggedElement && draggedElement.element.id === selectedElement.id
                    const currentY = isDragged ? draggedElement.target.position().y : selectedElement.y
                    return currentY - 4
                  })()}
                  width={8}
                  height={8}
                  fill="red"
                  stroke="white"
                  strokeWidth={2}
                  draggable
                  onDragMove={(e) => handleRectangleEdgeDrag(selectedElement, 'top', e)}
                  onMouseEnter={(e) => {
                    e.target.getStage().container().style.cursor = 'ns-resize'
                  }}
                  onMouseLeave={(e) => {
                    e.target.getStage().container().style.cursor = 'default'
                  }}
                  onDragStart={(e) => {
                    e.target.getStage().container().style.cursor = 'ns-resize'
                  }}
                  onDragEnd={handleRectangleEdgeDragEnd}
                />
                
                {/* Bottom edge handle */}
                <Rect
                  x={(() => {
                    const isDragged = draggedElement && draggedElement.element.id === selectedElement.id
                    const currentX = isDragged ? draggedElement.target.position().x : selectedElement.x
                    return currentX + selectedElement.width / 2 - 4
                  })()}
                  y={(() => {
                    const isDragged = draggedElement && draggedElement.element.id === selectedElement.id
                    const currentY = isDragged ? draggedElement.target.position().y : selectedElement.y
                    return currentY + selectedElement.height - 4
                  })()}
                  width={8}
                  height={8}
                  fill="red"
                  stroke="white"
                  strokeWidth={2}
                  draggable
                  onDragMove={(e) => handleRectangleEdgeDrag(selectedElement, 'bottom', e)}
                  onMouseEnter={(e) => {
                    e.target.getStage().container().style.cursor = 'ns-resize'
                  }}
                  onMouseLeave={(e) => {
                    e.target.getStage().container().style.cursor = 'default'
                  }}
                  onDragStart={(e) => {
                    e.target.getStage().container().style.cursor = 'ns-resize'
                  }}
                  onDragEnd={handleRectangleEdgeDragEnd}
                />
                
                {/* Left edge handle */}
                <Rect
                  x={(() => {
                    const isDragged = draggedElement && draggedElement.element.id === selectedElement.id
                    const currentX = isDragged ? draggedElement.target.position().x : selectedElement.x
                    return currentX - 4
                  })()}
                  y={(() => {
                    const isDragged = draggedElement && draggedElement.element.id === selectedElement.id
                    const currentY = isDragged ? draggedElement.target.position().y : selectedElement.y
                    return currentY + selectedElement.height / 2 - 4
                  })()}
                  width={8}
                  height={8}
                  fill="red"
                  stroke="white"
                  strokeWidth={2}
                  draggable
                  onDragMove={(e) => handleRectangleEdgeDrag(selectedElement, 'left', e)}
                  onMouseEnter={(e) => {
                    e.target.getStage().container().style.cursor = 'ew-resize'
                  }}
                  onMouseLeave={(e) => {
                    e.target.getStage().container().style.cursor = 'default'
                  }}
                  onDragStart={(e) => {
                    e.target.getStage().container().style.cursor = 'ew-resize'
                  }}
                  onDragEnd={handleRectangleEdgeDragEnd}
                />
                
                {/* Right edge handle */}
                <Rect
                  x={(() => {
                    const isDragged = draggedElement && draggedElement.element.id === selectedElement.id
                    const currentX = isDragged ? draggedElement.target.position().x : selectedElement.x
                    return currentX + selectedElement.width - 4
                  })()}
                  y={(() => {
                    const isDragged = draggedElement && draggedElement.element.id === selectedElement.id
                    const currentY = isDragged ? draggedElement.target.position().y : selectedElement.y
                    return currentY + selectedElement.height / 2 - 4
                  })()}
                  width={8}
                  height={8}
                  fill="red"
                  stroke="white"
                  strokeWidth={2}
                  draggable
                  onDragMove={(e) => handleRectangleEdgeDrag(selectedElement, 'right', e)}
                  onMouseEnter={(e) => {
                    e.target.getStage().container().style.cursor = 'ew-resize'
                  }}
                  onMouseLeave={(e) => {
                    e.target.getStage().container().style.cursor = 'default'
                  }}
                  onDragStart={(e) => {
                    e.target.getStage().container().style.cursor = 'ew-resize'
                  }}
                  onDragEnd={handleRectangleEdgeDragEnd}
                />
              </>
            )}
            
            {/* Hover outline */}
            {hoveredElement && (
              <Rect
                {...getElementBounds(hoveredElement)}
                stroke="rgba(255, 0, 0, 0.3)"
                strokeWidth={2}
                fill="transparent"
                listening={false}
              />
            )}
            
            {/* Selection outline */}
            {selectedElement && (
              <Rect
                {...getElementBounds(selectedElement)}
                stroke="red"
                strokeWidth={2}
                fill="transparent"
                listening={false}
              />
            )}
          </Layer>
        </Stage>
      </div>
      
      <div className="sidebar">
        <div className="button-group">
          <h3>Create Elements</h3>
          <button 
            className={`btn ${tool === 'text' ? 'active' : ''}`}
            onClick={() => setTool(tool === 'text' ? null : 'text')}
          >
            Add Text
          </button>
          <button 
            className={`btn ${tool === 'rectangle' ? 'active' : ''}`}
            onClick={() => setTool(tool === 'rectangle' ? null : 'rectangle')}
          >
            Add Rectangle
          </button>
          <button 
            className={`btn ${tool === 'line' ? 'active' : ''}`}
            onClick={() => setTool(tool === 'line' ? null : 'line')}
          >
            Add Line
          </button>
          <button 
            className={`btn ${tool === 'image' ? 'active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
          >
            Add Image
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </div>

        {selectedElement && (
          <div className="attribute-editor">
            <h4>Edit {selectedElement.type}</h4>
            
            <div className="form-group">
              <label>ID</label>
              <input 
                type="text" 
                value={selectedElement.id} 
                disabled 
              />
            </div>

            {selectedElement.type === 'text' && (
              <>
                <div className="form-group">
                  <label>Text</label>
                  <input 
                    type="text" 
                    value={selectedElement.text}
                    onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>X Position</label>
                  <input 
                    type="number" 
                    value={selectedElement.x}
                    onChange={(e) => updateElement(selectedElement.id, { x: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Y Position</label>
                  <input 
                    type="number" 
                    value={selectedElement.y}
                    onChange={(e) => updateElement(selectedElement.id, { y: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Alignment</label>
                  <select 
                    value={selectedElement.alignment}
                    onChange={(e) => updateElement(selectedElement.id, { alignment: e.target.value })}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </>
            )}

            {selectedElement.type === 'rectangle' && (
              <>
                <div className="form-group">
                  <label>X Position</label>
                  <input 
                    type="number" 
                    value={selectedElement.x}
                    onChange={(e) => updateElement(selectedElement.id, { x: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Y Position</label>
                  <input 
                    type="number" 
                    value={selectedElement.y}
                    onChange={(e) => updateElement(selectedElement.id, { y: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Width</label>
                  <input 
                    type="number" 
                    value={selectedElement.width}
                    onChange={(e) => updateElement(selectedElement.id, { width: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Height</label>
                  <input 
                    type="number" 
                    value={selectedElement.height}
                    onChange={(e) => updateElement(selectedElement.id, { height: parseFloat(e.target.value) })}
                  />
                </div>
                                 <div className="form-group">
                   <label>Corner Radius</label>
                   <input 
                     type="number" 
                     value={selectedElement.cornerRadius}
                     onChange={(e) => updateElement(selectedElement.id, { cornerRadius: parseFloat(e.target.value) })}
                   />
                 </div>
                 <div className="form-group">
                   <label>Border Width</label>
                   <input 
                     type="number" 
                     value={selectedElement.borderWidth || 1}
                     onChange={(e) => updateElement(selectedElement.id, { borderWidth: parseFloat(e.target.value) })}
                     min="0"
                   />
                 </div>
               </>
             )}

                         {selectedElement.type === 'line' && (
               <>
                 <div className="form-group">
                   <label>X1 Position</label>
                   <input 
                     type="number" 
                     value={selectedElement.x1}
                     onChange={(e) => updateElement(selectedElement.id, { x1: parseFloat(e.target.value) })}
                   />
                 </div>
                 <div className="form-group">
                   <label>Y1 Position</label>
                   <input 
                     type="number" 
                     value={selectedElement.y1}
                     onChange={(e) => updateElement(selectedElement.id, { y1: parseFloat(e.target.value) })}
                   />
                 </div>
                 <div className="form-group">
                   <label>X2 Position</label>
                   <input 
                     type="number" 
                     value={selectedElement.x2}
                     onChange={(e) => updateElement(selectedElement.id, { x2: parseFloat(e.target.value) })}
                   />
                 </div>
                 <div className="form-group">
                   <label>Y2 Position</label>
                   <input 
                     type="number" 
                     value={selectedElement.y2}
                     onChange={(e) => updateElement(selectedElement.id, { y2: parseFloat(e.target.value) })}
                   />
                 </div>
                 <div className="form-group">
                   <label>Line Width</label>
                   <input 
                     type="number" 
                     value={selectedElement.width}
                     onChange={(e) => updateElement(selectedElement.id, { width: parseFloat(e.target.value) })}
                   />
                 </div>
               </>
             )}

             {selectedElement.type === 'image' && (
               <>
                 <div className="form-group">
                   <label>Filename</label>
                   <input 
                     type="text" 
                     value={selectedElement.filename || 'N/A'}
                     disabled
                   />
                 </div>
                 <div className="form-group">
                   <label>Filepath</label>
                   <input 
                     type="text" 
                     value={selectedElement.filepath || 'N/A'}
                     disabled
                   />
                 </div>
                 <button 
                   className="btn change-image-btn" 
                   onClick={replaceImage}
                 >
                   Change Image
                 </button>
                 <div className="form-group">
                   <label>X Position</label>
                   <input 
                     type="number" 
                     value={selectedElement.x}
                     onChange={(e) => updateElement(selectedElement.id, { x: parseFloat(e.target.value) })}
                   />
                 </div>
                 <div className="form-group">
                   <label>Y Position</label>
                   <input 
                     type="number" 
                     value={selectedElement.y}
                     onChange={(e) => updateElement(selectedElement.id, { y: parseFloat(e.target.value) })}
                   />
                 </div>
                 <div className="form-group">
                   <label>Width (Native: {selectedElement.width})</label>
                   <input 
                     type="number" 
                     value={selectedElement.width}
                     disabled
                   />
                 </div>
                 <div className="form-group">
                   <label>Height (Native: {selectedElement.height})</label>
                   <input 
                     type="number" 
                     value={selectedElement.height}
                     disabled
                   />
                 </div>
               </>
             )}

            <div className="form-group">
              <label>Start Time</label>
              <input 
                type="number" 
                value={selectedElement.startTime}
                onChange={(e) => updateElement(selectedElement.id, { startTime: parseFloat(e.target.value) })}
              />
            </div>
                         <div className="form-group">
               <label>End Time</label>
               <input 
                 type="number" 
                 value={selectedElement.endTime}
                 onChange={(e) => updateElement(selectedElement.id, { endTime: parseFloat(e.target.value) })}
               />
             </div>
           </div>
         )}

         {selectedElement && (
           <button 
             className="btn delete-btn" 
             onClick={() => deleteElement(selectedElement.id)}
           >
             Delete Element
           </button>
         )}

         <button className="btn export-btn" onClick={exportToJSON}>
           Export to JSON
         </button>
         
         <button className="btn import-btn" onClick={importFromJSON}>
           Import from JSON
         </button>
         
         <input
           type="file"
           accept=".json"
           ref={jsonInputRef}
           style={{ display: 'none' }}
           onChange={handleJSONFileUpload}
         />
         
         <input
           type="file"
           accept="image/*"
           ref={imageReplaceInputRef}
           style={{ display: 'none' }}
           onChange={handleImageReplacement}
         />
      </div>
    </div>
  )
}

export default App 