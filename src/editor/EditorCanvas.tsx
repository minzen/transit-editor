import { useState } from 'react'
import { screenToWorld } from '../viewport/coordinates'
import './EditorCanvas.css'

type Viewport = {
  zoom: number
  offsetX: number
  offsetY: number
}

export function EditorCanvas() {
  const [viewport] = useState<Viewport>({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  })

  return (
    <div className="editor-canvas">
      <svg
        width="100%"
        height="100%"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()

          const x = event.clientX - rect.left
          const y = event.clientY - rect.top

          const point = screenToWorld(x, y, viewport)

          console.log('world point:', point)
        }}
      >
        <rect
          width="100%"
          height="100%"
          fill="#f5f5f5"
        />

        <g
          transform={`
            translate(${viewport.offsetX} ${viewport.offsetY})
            scale(${viewport.zoom})
          `}
        >
          <circle
            cx={200}
            cy={200}
            r={8}
            fill="#111"
          />
        </g>
      </svg>
    </div>
  )
}