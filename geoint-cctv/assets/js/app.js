var map;

$(document).ready(function() {
  getViewport();
});

function getViewport() {
  if (sidebar.isVisible()) {
    map.setActiveArea({
      position: "absolute",
      top: "0px",
      left: $(".leaflet-sidebar").css("width"),
      right: "0px",
      height: $("#map").css("height")
    });
  } else {
    map.setActiveArea({
      position: "absolute",
      top: "0px",
      left: "0px",
      right: "0px",
      height: $("#map").css("height")
    });
  }
  if (document.body.clientWidth <= 767) {
    $(".leaflet-sidebar .close").css("top", "8px");
  } else {
    $(".leaflet-sidebar .close").css("top", "15px");
  }
}

function sidebarClick(id) {
  /* If sidebar takes up entire screen, hide it and go to the map */
  if (document.body.clientWidth <= 767) {
    sidebar.hide();
    getViewport();
  }
  map.addLayer(completeListener).addLayer(incompleteListener);
  var layer = markerClusters.getLayer(id);
  markerClusters.zoomToShowLayer(layer, function() {
    map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 18);
    layer.fire("click");
  })
}

/* Basemap Layers */
var mapboxOSM = L.tileLayer("http://{s}.tiles.mapbox.com/v3/spatialnetworks.map-6l9yntw9/{z}/{x}/{y}.png", {
  maxZoom: 19,
  subdomains: ["a", "b", "c", "d"],
  attribution: 'Basemap <a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox © OpenStreetMap</a>'
});
var mapboxSat = L.tileLayer("http://{s}.tiles.mapbox.com/v3/spatialnetworks.map-xkumo5oi/{z}/{x}/{y}.jpg", {
  maxZoom: 19,
  subdomains: ["a", "b", "c", "d"],
  attribution: 'Basemap <a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox © OpenStreetMap</a>'
});

/* Overlay Layers */
var highlight = L.geoJson(null);

/* Single marker cluster layer to hold all clusters */
var markerClusters = new L.MarkerClusterGroup({
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  disableClusteringAtZoom: 16
});

var completeLayer = L.geoJson(null);
var completeListener= L.geoJson(null);
var incompleteLayer = L.geoJson(null);
var incompleteListener = L.geoJson(null);

var cameras = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
        title: feature.properties.description,
        riseOnHover: true
      });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      if (feature.properties.status === "Complete") {
        layer.setIcon(
          L.icon({
            iconUrl: "assets/img/cctv-complete.png",
            iconSize: [24, 28],
            iconAnchor: [12, 28],
            popupAnchor: [0, -25]
          })
        );
        completeLayer.addLayer(layer);
      }
      if (feature.properties.status === "Incomplete") {
        layer.setIcon(
          L.icon({
            iconUrl: "assets/img/cctv-incomplete.png",
            iconSize: [24, 28],
            iconAnchor: [12, 28],
            popupAnchor: [0, -25]
          })
        );
        incompleteLayer.addLayer(layer);
      }
      function formatValues(value) {
        if (value) {
          return value.toUpperCase();
        } else {
          return "";
        }
      }
      function formatPhotos(value) {
        if (value) {
          return "<a name='photos' photos='" + value + "' href='#'>View Photos</a>";
        } else {
          return "<i>No photos available</i>";
        }
      }
      if (feature.properties.camera_model && feature.properties.camera_model_other) {
        feature.properties.camera_model =  feature.properties.camera_model + ", " + feature.properties.camera_model_other;
      }
      if (feature.properties.camera_model_other && !feature.properties.camera_model) {
        feature.properties.camera_model =  feature.properties.camera_model_other;
      }
      if (feature.properties.platform_type && feature.properties.platform_type_other) {
        feature.properties.platform_type =  feature.properties.platform_type + ", " + feature.properties.platform_type_other;
      }
      if (feature.properties.platform_type_other && !feature.properties.platform_type) {
        feature.properties.platform_type =  feature.properties.platform_type_other;
      }
      var location =  "<tr><th>Description</th><td>" + formatValues(feature.properties.description) + "</td></tr>" +
                      "<tr><th>Coordinates</th><td>" + feature.properties.latitude.toFixed(6) + ", " + feature.properties.longitude.toFixed(6) + "</td></tr>";
      var camera =    "<tr><th>Camera Present?</th><td>" + formatValues(feature.properties.camera_present) + "</td></tr>" +
                      "<tr><th>Camera Model</th><td>" + formatValues(feature.properties.camera_model) + "</td></tr>" +
                      "<tr><th>Coverage Photos</th><td>" + formatPhotos(feature.properties.coverage_photos) + "</td></tr>";
      var platform =  "<tr><th>Platform Type</th><td>" + formatValues(feature.properties.platform_type) + "</td></tr>" +
                      "<tr><th>Platform Height</th><td>" + formatValues(feature.properties.platform_height) + "</td></tr>" +
                      "<tr><th>Platform Photos</th><td>" + formatPhotos(feature.properties.platform_photos) + "</td></tr>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.description);
          $("#location-table").empty().append(location);
          $("#camera-table").empty().append(camera);
          $("#platform-table").empty().append(platform);
          $("#featureModal").modal("show");
          $("[name='photos']").click(function () {
            var photoArray = [];
            $.each($(this).attr("photos").split(","), function(index, photo) {
              photoArray.push({href: "https://web.fulcrumapp.com/shares/b711f907a8d42665/photos/"+photo});
            });
            $.fancybox(photoArray, {
              "type": "image",
              "showNavArrows": true,
              "padding": 0,
              "scrolling": "no",
              beforeShow: function () {
                this.title = "Photo " + (this.index + 1) + " of " + this.group.length + (this.title ? " - " + this.title : "");
              },
              helpers: {
                overlay: {
                  css: {
                    "overflow": "hidden"
                  }
                }
              }
            });
            return false;
          });

          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
            stroke: false,
            fillColor: "#00FFFF",
            fillOpacity: 0.7,
            radius: 10
          }));
        }
      });
      $("#camera-list tbody").append('<tr style="cursor: pointer;" onclick="sidebarClick('+L.stamp(layer)+'); return false;"><td class="camera-name">'+layer.feature.properties.description+'&nbsp;&nbsp;<i class="fa fa-chevron-right pull-right"></i><img class="pull-left" src="assets/img/cctv-'+layer.feature.properties.status.toLowerCase()+'.png" width="12" height="14" style="margin-right: 5px;"></td></tr>');
    }
  }
});
$.getJSON("https://web.fulcrumapp.com/shares/b711f907a8d42665.geojson", function (data) {
  cameras.addData(data);
  markerClusters.addLayer(completeLayer);
  markerClusters.addLayer(incompleteLayer);
});


map = L.map("map", {
  zoom: 15,
  center: [27.948572, -82.455803],
  layers: [mapboxOSM, markerClusters, completeListener, incompleteListener, highlight],
  zoomControl: false,
  attributionControl: false
});

/* Layer control listeners that allow for a single markerClusters layer */
map.on("overlayadd", function(e) {
  if (e.layer === completeListener) {
    markerClusters.addLayer(completeLayer);
  }
  if (e.layer === incompleteListener) {
    markerClusters.addLayer(incompleteLayer);
  }
});

map.on("overlayremove", function(e) {
  if (e.layer === completeListener) {
    markerClusters.removeLayer(completeLayer);
  }
  if (e.layer === incompleteListener) {
    markerClusters.removeLayer(incompleteLayer);
  }
});

map.on("click", function(e) {
  highlight.clearLayers();
});

/* Attribution control */
function updateAttribution(e) {
  $.each(map._layers, function(index, layer) {
    if (layer.getAttribution) {
      $("#attribution").html((layer.getAttribution()));
    }
  });
}
map.on("layeradd", updateAttribution);
map.on("layerremove", updateAttribution);

var attributionControl = L.control({
  position: "bottomright"
});
attributionControl.onAdd = function (map) {
  var div = L.DomUtil.create("div", "leaflet-control-attribution");
  div.innerHTML = "Developed by <a href='http://spatialnetworks.com'>spatialnetworks</a> | <a href='#' onclick='$(\"#attributionModal\").modal(\"show\"); return false;'>Attribution</a>";
  return div;
};
map.addControl(attributionControl);

var zoomControl = L.control.zoom({
  position: "bottomright"
}).addTo(map);

var locateControl = L.control.locate({
  position: "bottomright",
  drawCircle: true,
  follow: true,
  setView: true,
  keepCurrentZoomLevel: true,
  markerStyle: {
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8
  },
  circleStyle: {
    weight: 1,
    clickable: false
  },
  icon: "icon-direction",
  metric: false,
  strings: {
    title: "My location",
    popup: "You are within {distance} {unit} from this point",
    outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
  },
  locateOptions: {
    maxZoom: 17,
    watch: true,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
  }
}).addTo(map);

var baseLayers = {
  "Street Map": mapboxOSM,
  "Aerial Imagery": mapboxSat
};

var groupedOverlays = {
  "Surveillance Cameras": {
    "<img src='assets/img/cctv-complete.png' width='24' height='28'>&nbsp;Surveyed": completeListener,
    "<img src='assets/img/cctv-incomplete.png' width='24' height='28'>&nbsp;Not Surveyed": incompleteListener
  }
};

var sidebar = L.control.sidebar("sidebar", {
  closeButton: true,
  position: "left"
}).on("shown", function () {
  getViewport();
}).on("hidden", function () {
  getViewport();
}).addTo(map);

/* Larger screens get expanded layer control */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
  sidebar.show();
}

var layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {
  collapsed: isCollapsed
}).addTo(map);

$(document).one("ajaxStop", function () {
  $("#loading").hide();
  map.fitBounds(markerClusters.getBounds());
  var cameraList = new List("cameras", {valueNames: ["camera-name"/*, "camera-location"*/]}).sort("camera-name", {order:"asc"});
});

/* Placeholder hack for IE */
if (navigator.appName == "Microsoft Internet Explorer") {
  $("input").each(function () {
    if ($(this).val() === "" && $(this).attr("placeholder") !== "") {
      $(this).val($(this).attr("placeholder"));
      $(this).focus(function () {
        if ($(this).val() === $(this).attr("placeholder")) $(this).val("");
      });
      $(this).blur(function () {
        if ($(this).val() === "") $(this).val($(this).attr("placeholder"));
      });
    }
  });
}
