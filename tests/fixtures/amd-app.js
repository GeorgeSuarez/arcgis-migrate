require(["esri/Map", "esri/views/MapView"], function (Map, MapView) {
  const map = new Map({ basemap: "topo-vector" });
  const view = new MapView({ container: "viewDiv", map });

  view.when(function () {
    console.log("ready");
  });
});
