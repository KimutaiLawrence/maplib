import { Map, RasterLayer } from '../index';
const map = new Map({
    container: 'map',
    center: { lng: 8.6753, lat: 67.6588 },
    zoom: 13
});
const rasterLayer = new RasterLayer({
    id: 'osm',
    tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
    minZoom: 0,
    maxZoom: 19,
    visible: true,
    opacity: 1.0
});
map.addLayer(rasterLayer);
document.getElementById('zoomIn')?.addEventListener('click', () => {
    const currentZoom = map.getZoom();
    map.setZoom(currentZoom + 1);
});
document.getElementById('zoomOut')?.addEventListener('click', () => {
    const currentZoom = map.getZoom();
    map.setZoom(currentZoom - 1);
});
document.getElementById('reset')?.addEventListener('click', () => {
    map.setCenter({ lng: 8.6753, lat: 67.6588 });
    map.setZoom(13);
});
//# sourceMappingURL=demo.js.map