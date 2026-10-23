import Map from "@arcgis/core/Map.js";
import MapView from "@arcgis/core/views/MapView.js";
import Search from "@arcgis/core/widgets/Search.js";
import Legend from "@arcgis/core/widgets/Legend.js";
import SearchViewModel from "@arcgis/core/widgets/Search/SearchViewModel.js";
import "@arcgis/core/assets/esri/themes/light/main.css";

const map = new Map({ basemap: "topo-vector" });
const view = new MapView({
  container: "viewDiv",
  map,
  center: [-118, 34],
  zoom: 8,
});

const search = new Search({
  view,
  position: "top-right",
  viewModel: new SearchViewModel({ view }),
});

const legend = new Legend({ view });

view.ui.add(search, "top-right");
view.ui.add(legend, "bottom-left");

view.when(() => {
  view.on("click", (event) => {
    console.log(event.mapPoint);
  });
});

const vm: __esri.SearchViewModel = search.viewModel;
const element = document.createElement("div");
element.classList.add("esri-widget");

export { map, view, search, legend, vm, element };
