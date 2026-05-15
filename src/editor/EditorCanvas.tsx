import { useEffect, useState } from 'react'
import type {
  Viewport,
} from '../viewport/coordinates'
import { screenToWorld } from '../viewport/coordinates'

import { useEditorStore } from '../store/editorStore'
import { snapPointToGrid } from '../geometry/snap'

import { GridLayer } from '../renderer/GridLayer'

import './EditorCanvas.css'

export function EditorCanvas() {
  const stations = useEditorStore((s) => s.stations)
  const addStation = useEditorStore((s) => s.addStation)
  const moveStation = useEditorStore(
    (s) => s.moveStation
  )

  const [viewport, setViewport] =
    useState<Viewport>({
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    })

  const [draggingStationId, setDraggingStationId] =
    useState<string | null>(null)

  const [isPanning, setIsPanning] =
    useState(false)

  const [spacePressed, setSpacePressed] =
    useState(false)

  const [lastPointer, setLastPointer] =
    useState({
      x: 0,
      y: 0,
    })

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(true)
      }
    }

    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false)
      }
    }

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)

    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  return (
    <div className="editor-canvas">
      <svg
        width="100%"
        height="100%"
        style={{
          cursor: isPanning
            ? 'grabbing'
            : spacePressed
            ? 'grab'
            : 'default',
        }}
        onWheel={(event) => {
          event.preventDefault()

          const rect =
            event.currentTarget.getBoundingClientRect()

          const mouseX =
            event.clientX - rect.left

          const mouseY =
            event.clientY - rect.top

          const worldBefore =
            screenToWorld(
              mouseX,
              mouseY,
              viewport
            )

          const zoomFactor =
            event.deltaY > 0 ? 0.9 : 1.1

          const newZoom =
            viewport.zoom * zoomFactor

          const newOffsetX =
            mouseX -
            worldBefore.x * newZoom

          const newOffsetY =
            mouseY -
            worldBefore.y * newZoom

          setViewport({
            zoom: newZoom,
            offsetX: newOffsetX,
            offsetY: newOffsetY,
          })
        }}
        onPointerDown={(event) => {
          if (spacePressed) {
            setIsPanning(true)

            setLastPointer({
              x: event.clientX,
              y: event.clientY,
            })
          }
        }}
        onPointerMove={(event) => {
          if (isPanning) {
            const dx =
              event.clientX - lastPointer.x

            const dy =
              event.clientY - lastPointer.y

            setViewport((v) => ({
              ...v,
              offsetX: v.offsetX + dx,
              offsetY: v.offsetY + dy,
            }))

            setLastPointer({
              x: event.clientX,
              y: event.clientY,
            })

            return
          }

          if (!draggingStationId) return

          const rect =
            event.currentTarget.getBoundingClientRect()

          const x =
            event.clientX - rect.left

          const y =
            event.clientY - rect.top

          const point = screenToWorld(
            x,
            y,
            viewport
          )

          const snapped =
            snapPointToGrid(
              point.x,
              point.y,
              40
            )

          moveStation(
            draggingStationId,
            snapped.x,
            snapped.y
          )
        }}
        onPointerUp={() => {
          setDraggingStationId(null)
          setIsPanning(false)
        }}
        onClick={(event) => {
          if (spacePressed) return

          const rect =
            event.currentTarget.getBoundingClientRect()

          const x =
            event.clientX - rect.left

          const y =
            event.clientY - rect.top

          const point = screenToWorld(
            x,
            y,
            viewport
          )

          const snapped =
            snapPointToGrid(
              point.x,
              point.y,
              40
            )

          addStation(
            snapped.x,
            snapped.y
          )
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
          <GridLayer
            width={4000}
            height={4000}
            gridSize={40}
          />

          {Object.values(stations).map((s) => (
            <circle
              key={s.id}
              cx={s.x}
              cy={s.y}
              r={8}
              fill="#111"
              style={{
                cursor: 'pointer',
              }}
              onPointerDown={(event) => {
                event.stopPropagation()

                setDraggingStationId(s.id)
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
