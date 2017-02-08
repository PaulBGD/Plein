export const pointSize = /* 1 / */ 72.27; // point size compared to inch
export const pixelSize = /* 1 / */ 96; // pixel size compared to inch

export function pixelToPoint(px) {
    return (px / pixelSize) * pointSize;
}

export function pointToPixel(pt) {
    return (pt / pointSize) * pixelSize;
}