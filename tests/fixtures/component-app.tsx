import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-search";
import "@arcgis/map-components/components/arcgis-legend";

export function App() {
  return (
    <arcgis-map item-id="02b37471d5d84cacbebcccd785460e94" basemap="topo-vector">
      <arcgis-search slot="top-right" />
      <arcgis-legend slot="bottom-left" />
    </arcgis-map>
  );
}
