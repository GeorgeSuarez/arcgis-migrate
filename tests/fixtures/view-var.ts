import MapView from "@arcgis/core/views/MapView.js";

const v = new MapView({ container: "viewDiv" });

v.when(() => {
  v.on("click", () => {
    console.log("clicked");
  });
});
