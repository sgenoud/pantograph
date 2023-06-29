import { importSVG } from "./importSVG";
import { cut, exportSVG } from "../src/main";
import { drawRect } from "../src/api/drawShape";

let rawImg = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
<circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
</svg>
`;

let parsedImg = importSVG(rawImg, { width: 100 });

export default function svgEdit(element) {
  element.innerHTML = `
  <div style="display: flex; flex-direction: column; align-items: center;">
  <input type="file" id="myfile" accept="image/*" />
  <div id="images" style="display: flex; flex-direction: column; max-height: 60vh; gap: 1em;"/>
  </div>
  `;

  const rect = drawRect(80, 25, 5).rotate(33);

  function addImages() {
    const imgCenter = parsedImg.slice(1).reduce((bbox, img) => {
      bbox = bbox.merge(img.boundingBox);
      return bbox;
    }, parsedImg[0].boundingBox).center;

    const mvRect = rect.translateTo(imgCenter);

    document.getElementById("images").innerHTML = `
      ${rawImg}
      ${exportSVG(parsedImg)}
      ${exportSVG(parsedImg.map((i) => cut(i, mvRect)))}
  `;
  }

  addImages();

  const reader = new FileReader();

  reader.onload = (loaded) => {
    if (!loaded.target.result) return;
    rawImg = loaded.target.result;
    parsedImg = importSVG(rawImg, { width: 100 });
    addImages();
  };
  document.getElementById("myfile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) reader.readAsText(file);
  });
}
