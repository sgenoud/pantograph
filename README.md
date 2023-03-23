# pantograph

A pure JS 2D CAD library, for all your programatic 2D precision drawing needs.

## Example.

```js
import { draw, cut, fuseAll, exportSVG } from "pantograph";

const drawPolygon = (radius, sides) => {
    const angle = 360 / sides;
    const pen = draw([radius, 0]);
    for (let i = 1; i < sides; i++) {
        pen.polarLineTo([radius, angle * i]);
    }
    return pen.close().rotate(90);
};

const drawStrokedPolygon = (radius, sides, strokeWidth) => {
    const outerPolygon = drawPolygon(radius + strokeWidth / 2, sides);
    const innerPolygon = drawPolygon(radius - strokeWidth / 2, sides);
    return cut(outerPolygon, innerPolygon);
};

const polarCopy = (drawing, radius, count) => {
    const angle = 360 / count;

    const copies = [];
    for (let i = 0; i < count; i++) {
        copies.push(drawing.translateY(radius).rotate(angle * i));
    }
    return copies;
};

const shape = drawStrokedPolygon(50, 6, 5).rotate(45);
const output = fuseAll(polarCopy(shape, 60, 12)));
```

![image](https://user-images.githubusercontent.com/263325/230384681-ef34bada-bc33-479a-8741-58011812886d.svg)
