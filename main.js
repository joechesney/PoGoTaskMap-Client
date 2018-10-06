'use strict';
import { secrets } from './secrets.js';
import { getPokestops } from './js/getPokestops.js';
import { addListeners } from './js/listeners.js';
import { rewardSearch } from './js/rewardSearch.js';
import { printPokestops } from './js/printPokestops.js';
import { addNewPokestop } from './js/addNewPokestop.js';
import { getNewestPokestop } from './js/getNewestPokestop.js';

addListeners(); // adds event listeners to the page

/**
 * These 4 are variables used for the Leaflet map
 */
const bluePin = L.icon({
  iconUrl: 'node_modules/leaflet/dist/images/marker-icon.png',
  iconSize: [21, 35], // size of the icon
  iconAnchor: [18, 41], // point of the icon which will correspond to marker's location
  popupAnchor: [-7, -40],  // point from which the popup should open relative to the iconAnchor
  tooltipAnchor: [10, -20]
});
const redPin = L.icon({
  iconUrl: './images/red-pin.png',
  iconSize: [21, 35], // size of the icon
  iconAnchor: [18, 41], // point of the icon which will correspond to marker's location
  popupAnchor: [-7, -40],  // point from which the popup should open relative to the iconAnchor
  tooltipAnchor: [10, -20]
});
const Regular = L.layerGroup();
const Active = L.layerGroup();

// This object is used just to pass in these variables to the printPokestops function
let specialObject = { bluePin, redPin, Regular, Active };

$("#reward-search-button").on("click", function () {
  rewardSearch($("#reward-search").val())
    .then(results => {
      Active.clearLayers(); //Maybe should remove Regular layer too?
      printPokestops(results, specialObject, true);
    });
});

getPokestops()
  .then(allPokestops => {

    const mbAttr = '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
      mbUrl = `https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=${secrets().mapboxKey}`;

    const grayscale = L.tileLayer(mbUrl, { id: 'mapbox.light', attribution: mbAttr }),
      dark = L.tileLayer(mbUrl, { id: 'mapbox.dark', attribution: mbAttr }),
      comic = L.tileLayer(mbUrl, { id: 'mapbox.comic', attribution: mbAttr }),
      pirates = L.tileLayer(mbUrl, { id: 'mapbox.pirates', attribution: mbAttr }),
      pencil = L.tileLayer(mbUrl, { id: 'mapbox.pencil', attribution: mbAttr }),
      streets_satellite = L.tileLayer(mbUrl, { id: 'mapbox.streets-satellite', attribution: mbAttr }),
      streets_basic = L.tileLayer(mbUrl, { id: 'mapbox.streets-basic', attribution: mbAttr }),
      roadmap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: mbAttr });

    const map = L.map('map', {
      center: [36.1497012, -86.8144697],
      zoom: 15,
      layers: [roadmap, Active, Regular],
      tap: true
    });
    printPokestops(map, allPokestops, specialObject, false);

    // This adds the geolocation control to the map
    L.control.locate({ drawCircle: false, icon: "actually-good-my-location-icon" }).addTo(map);
    $(".actually-good-my-location-icon").append("<img class='my-location-image'  src='./images/my_location_grey.png' />");

    // Custom map control for addNewPokestop
    // When clicked, it reveals the add-new-pokestop form on desktop

    L.Control.AddPokestopControl = L.Control.extend({
      onAdd: function(map) {
        var img = L.DomUtil.create('img', 'leaflet-bar leaflet-control leaflet-control-custom');
        img.src = './images/add-pokestop.png';
        img.style.width = 'auto';
        img.onclick = (e)=>{
          // when the control is clicked, the two possible forms are toggled
          L.DomEvent.stopPropagation(e);
          e.stopPropagation();
          $("#search-form-div").toggle();
          $("#add-new-pokestop-form-div").toggle();
        };
        return img;
      }
    });
    L.control.addpokestopcontrol = function(opts) {
      return new L.Control.AddPokestopControl(opts);
    };
    L.control.addpokestopcontrol({ position: 'bottomleft' }).addTo(map);

    const baseLayers = {
      "Roadmap": roadmap,
      "Grayscale": grayscale,
      "Streets Basic": streets_basic,
      "Streets Satellite": streets_satellite,
      "Dark": dark,
      "Comic": comic,
      "Pirates": pirates,
      "Pencil": pencil,
    };

    const overlays = {
      "Active Task": Active,
      "Inactive": Regular
    };

    L.control.layers(baseLayers, overlays).addTo(map);

    // onclick console.log used for development
    map.on('click', (e) => {
      // console.log(`${e.latlng.lat}`);
      // console.log(`${e.latlng.lng}`);
      $("#add-new-pokestop-latitude").val(e.latlng.lat);
      $("#add-new-pokestop-longitude").val(e.latlng.lng);
    });



    $("#add-new-pokestop-button").on("click", (e) => {
      e.preventDefault();
      let newPokeStopObject = {
        name: $(`#add-new-pokestop-name`).val(),
        latitude: +$(`#add-new-pokestop-latitude`).val(),
        longitude: +$(`#add-new-pokestop-longitude`).val(),
        // date_submitted: property is being given a value using a MySQL method server-side
      };
      addNewPokestop(newPokeStopObject)
      .then(result => {
        $(`#add-new-pokestop-name`).val("");
        $(`#add-new-pokestop-latitude`).val("");
        $(`#add-new-pokestop-longitude`).val("");
        getNewestPokestop(result.insertId)
        .then(newPokestopArray=>{
          console.log('newPokestopArray', newPokestopArray);
          printPokestops(map, newPokestopArray, specialObject, false);
          // var marker = L.marker([newPokestop.latitude, newPokestop.longitude],
          // { icon: specialObject.bluePin, opacity: 0.6 })
          // .bindPopup(`
          //   <br>
          //   <div class="addTask">
          //     <p><b>${newPokestop.name}</b></p>
          //     <input id="${newPokestop.id}task" class="input is-small" type="text" placeholder="task" required>
          //     <input id="${newPokestop.id}reward" class="input is-small" type="text" placeholder="reward" required>
          //     <input class="addTaskButton button is-small is-info is-outlined" id="${newPokestop.id}" type="button" value="add task">
          //   </div>
          // `).addTo(map);
        });
      });
    });

    $("#reward-search-button").on("click", function () {
      rewardSearch($("#reward-search").val())
        .then(results => {
          Active.clearLayers(); //Maybe should remove Regular layer too?
          printPokestops(map, results, specialObject, true);
        });
    });

    $(document).ready(function(){
      $("#add-new-pokestop-form-div").hide();
    });

  });

