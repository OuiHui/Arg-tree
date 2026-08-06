import type { Point } from '../types/argtree'

export function computeDragEdgePath(
  origin: Point,
  target: Point,
  snapOrigin = true,
  snapTarget = false,
  boxWidth = 280,
  boxHeight = 140
): string {
  const dx = target.x - origin.x
  const dy = target.y - origin.y

  let startX = origin.x
  let startY = origin.y
  let endX = target.x
  let endY = target.y

  const halfW = boxWidth / 2
  const halfH = boxHeight / 2

  if (snapOrigin) {
    if (dy > 30) {
      startX = origin.x
      startY = origin.y + halfH
    } else if (dy < -30) {
      startX = origin.x
      startY = origin.y - halfH
    } else if (dx >= 0) {
      startX = origin.x + halfW
      startY = origin.y
    } else {
      startX = origin.x - halfW
      startY = origin.y
    }
  }

  if (snapTarget) {
    if (dy > 30) {
      endX = target.x
      endY = target.y - halfH
    } else if (dy < -30) {
      endX = target.x
      endY = target.y + halfH
    } else if (dx >= 0) {
      endX = target.x - halfW
      endY = target.y
    } else {
      endX = target.x + halfW
      endY = target.y
    }
  }

  const deltaX = endX - startX
  const deltaY = endY - startY

  if (Math.abs(deltaY) >= Math.abs(deltaX)) {
    const controlY1 = startY + deltaY * 0.45
    const controlY2 = endY - deltaY * 0.45
    return `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`
  } else {
    const controlX1 = startX + deltaX * 0.45
    const controlX2 = endX - deltaX * 0.45
    return `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`
  }
}

export function computeEdgePath(
  origin: Point,
  target: Point,
  boxWidth = 280,
  boxHeight = 140,
  isConnection = false
): string {
  const dx = target.x - origin.x
  const dy = target.y - origin.y

  if (dx === 0 && dy === 0) {
    return `M ${origin.x} ${origin.y} L ${target.x} ${target.y}`
  }

  const halfW = boxWidth / 2
  const halfH = boxHeight / 2

  let startX: number
  let startY: number
  let endX: number
  let endY: number

  if (dy > 40) {
    startX = origin.x
    startY = origin.y + halfH
    endX = target.x
    endY = target.y - halfH - 6
  } else if (dy < -40) {
    startX = origin.x
    startY = origin.y - halfH
    endX = target.x
    endY = target.y + halfH + 6
  } else if (dx >= 0) {
    startX = origin.x + halfW
    startY = origin.y
    endX = target.x - halfW - 6
    endY = target.y
  } else {
    startX = origin.x - halfW
    startY = origin.y
    endX = target.x + halfW + 6
    endY = target.y
  }

  if (isConnection) {
    const deltaX = endX - startX
    const controlX = startX + deltaX * 0.4
    const controlY1 = startY - 60
    const controlY2 = endY - 30
    return `M ${startX} ${startY} C ${controlX} ${controlY1}, ${endX - deltaX * 0.15} ${controlY2}, ${endX} ${endY}`
  }

  const deltaY = endY - startY
  const controlY1 = startY + deltaY * 0.45
  const controlY2 = endY - deltaY * 0.45

  return `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`
}
