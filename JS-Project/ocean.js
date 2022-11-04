
let map;
let calcCampaign;
let tabloader;
let infoWindow;
let icon;
var input;
var searchBox;
let arrMarkers = [ ];

let marker_hide = [];
let sum_price = 0;
let sum_reach = 0;
let sum_cpm = 0;

jQuery(document).ready(function() {

   if(location.pathname === '/confirmation/') {

      jQuery('#segment_tab').hide();
      jQuery('#order_tab').hide();
      jQuery('.nextItems').hide();

      if(jQuery('#display_tab').text() === 'display:none') {
         jQuery('#order-tab').hide();
      }
      else {
         jQuery('#order-tab').show();
      }
   }

   if(location.pathname === '/campaign/') {

      /*set the format of budget and reach */

      jQuery(document).on('blur', '#budget', function() {
         jQuery(this).val( format(this.value) );
      });

      jQuery(document).on('blur', '#reach', function() {
         jQuery(this).val( format(this.value, false) );
      });

      /* set the toggle switch by default to No */
      jQuery('#toggle-changeability').bootstrapToggle('off');
   }

   if(location.pathname === '/search-results/') {

      /* set the progress bar width */
      let progressbar_Totalwidth = jQuery('#progress_wrapper').width() - 50;
      let progressbar_Totalwidth_percent = progressbar_Totalwidth / 100;

      let calcWidth = jQuery('#progress-bar').text() * progressbar_Totalwidth_percent;
      let progressbar_Innerwidth = ( calcWidth < progressbar_Totalwidth ) ? calcWidth : progressbar_Totalwidth;

      jQuery('.progress').css('width', progressbar_Totalwidth);
      jQuery('#progress-bar').css('width', progressbar_Innerwidth).attr('aria-valuenow', progressbar_Innerwidth);

      if(jQuery('#progress-bar').text() < 95) {
         jQuery('#progress-bar').css('background-color', '#FF8965');
      }
      if(jQuery('#progress-bar').text() >= 95) {
         jQuery('#progress-bar').css('background-color', '#006400');
      }

   }

   initMap('acf-map');
})


function initMap(el) {
   arrMarkers = [ ];
   map = new google.maps.Map(document.getElementById(el), {
      center: { lat: 52.0918, lng: 5.1146 },
      zoom: 7,
      disableDefaultUI: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP,

   });

//For zoom controls in map
   initZoomControl(map, el);


//Create the search box and link it to UI
   input = document.getElementById("pac-input");
   if ( el == "acf-map-locations" ) {
      input = document.getElementById("mod-input");
   }
//console.log(el);
//console.log(input);
   searchBox = new google.maps.places.SearchBox(input);
   map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
// Bias the SearchBox results towards current map's viewport.
   map.addListener("bounds_changed", () => {
      searchBox.setBounds(map.getBounds());
   });

   infoWindow = new google.maps.InfoWindow({
      maxWidth: 160
   });

   let markers = [];
// Listen for the event fired when the user selects a prediction and retrieve
// more details for that place.
   searchBox.addListener("places_changed", () => {
      const places = searchBox.getPlaces();

      if (places.length === 0) {
         return;
      }

// For each place, get the icon, name and location.
      const bounds = new google.maps.LatLngBounds();
      places.forEach((place) => {
         if (!place.geometry || !place.geometry.location) {
            console.log("Returned place contains no geometry");
            return;
         }
         icon = {
            url: place.icon,
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(25, 25),
            fillColor: "#f2df2f"
         };

// Create a marker for each place.
         const marker1 =
            new google.maps.Marker({
               map,
               icon,
               title: place.name,
               position: place.geometry.location,
            });


// Add a click listener for each marker, and set up the info window.
         marker1.addListener("click", () => {
            infoWindow.close();
            infoWindow.setContent(marker1.getTitle());
            infoWindow.open(marker1.getMap(), marker1);
         });

         if (place.geometry.viewport) {
// Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
         } else {
            bounds.extend(place.geometry.location);
         }
      });
      map.fitBounds(bounds);
   });

//custom button in map
   const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(62.281819, -150.287132),
      new google.maps.LatLng(62.400471, -150.005608)
   );
// The photograph is courtesy of the U.S. Geological Survey.
   let image = "https://developers.google.com/maps/documentation/javascript/";
   image += "examples/full/images/talkeetna.png";

   /**
    * The custom USGSOverlay object contains the USGS image,
    * the bounds of the image, and a reference to the map.
    */
   class USGSOverlay extends google.maps.OverlayView {
      constructor(bounds, image) {
         
         this.bounds = bounds;
         this.image = image;
      }

      searchResults() {
         search_screens();
      }

      chooseLocations() {
         choose_locations();
      }

      refineSearch() {
         refine_search();
      }
   }
   const overlay = new USGSOverlay(bounds, image);
   overlay.setMap(map);
   calcCampaign = document.createElement("button");
   calcCampaign.textContent = "Calculate campaign";
   calcCampaign.classList.add("btn-primary");
   calcCampaign.classList.add("btn-width");
//calcCampaign.setAttribute(id,"calcBtn");
   calcCampaign.addEventListener("click", () => {
      overlay.searchResults();
   });

   specificLocs = document.createElement("button");
   specificLocs.textContent = "Add specific locations";
   specificLocs.classList.add("btn-primary");
   specificLocs.classList.add("btn-width");
   specificLocs.addEventListener("click", () => {
      if ( location.pathname === '/search-results/' ) {
         overlay.refineSearch();
      } else {
         overlay.chooseLocations();
      }
   });

   wrapper = document.createElement("div");
   wrapper.classList.add("map-button-wrapper");
   if ( el !== "acf-map-refine" ) {
      wrapper.appendChild(specificLocs);
   }
   wrapper.appendChild(calcCampaign);

   map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(wrapper);

   if ( el !== "acf-map-locations" ) {
      addMapMarkers();
   }

}

function addMapMarkers() {

   var action = '';
   switch ( location.pathname ) {
      case '/campaign/':
         action = 'oco_get_all_markers';
         break;

      case '/search-results/':
         calcCampaign.style.display = "none";
         action = 'oco_get_markers';
         break;

      case '/confirmation/':
         calcCampaign.style.display = "none";
         action = 'oco_get_markers';
         break;
   }

   var params = {
      action: action,
   }

   jQuery.get(myAJAX.ajaxurl, params, function(data) {

      if ( data.result === 'OK' ) {
         if ( params.action === 'oco_get_all_markers' ) {
            search_markers = data.markers;
         }

         jQuery.each( data.markers, function(i, marker) {
            addMarker(marker.reference_id);
         });
      }
   });
}

function toggleCampaignSearch() {
   jQuery('#toggleSearch').toggle();

   jQuery(window).resize( function() {
      resizeCampaign();
   }).resize();
}

function resizeCampaign() {
   var windowHeight = 0;
   windowHeight = jQuery(window).height();
//console.log("resize campaign", windowHeight)
   var headerHeight = jQuery('HEADER').height();
//console.log("resize campaign", headerHeight)
   var footerHeight = jQuery('FOOTER').height();
//console.log("resize campaign", footerHeight)
   var total = windowHeight + headerHeight ;
//console.log(total)

   jQuery('#campaignForm').height(total);
   jQuery('#acf-map').height(total);
}

function initZoomControl(map, el) {
   var ctrls = 0;

   if( jQuery(".zoom-control-in").length > 0 ) {
      ctrls++;
      document.querySelector(".zoom-control-in").onclick = function () {
         map.setZoom(map.getZoom() + 1);
      };
   }

   if( jQuery('.zoom-control-out').length > 0 ) {
      ctrls++;
      document.querySelector(".zoom-control-out").onclick = function () {
         map.setZoom(map.getZoom() - 1);
      };
   }
   //console.log(ctrls);
   if ( el == "acf-map" ) {
      map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(
         document.getElementById('pac-input-zoom')
      );
   }
   if ( el == "acf-map-locations" ) {
      map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(
         document.getElementById('mod-input-zoom')
      );
   }

}

function search_screens() {

   if (jQuery('#audience_1').is(':checked') || jQuery('#audience_2').is(':checked')  ||
      jQuery('#audience_3').is(':checked') || jQuery('#audience_4').is(':checked') ) {
      validation_check();
      return false;
   }
   else {
      showTabLoader();
      var formvars = getFormValues('#ocean_search');
      formvars['action'] = 'oco_search_screens';
      formvars['nonce'] = myAJAX.nonce;
      formvars['budget'] = formvars['budget'].replaceAll('.', '');
      formvars['reach'] = formvars['reach'].replaceAll('.', '');
      formvars['reach'] = formvars['reach'].replaceAll(',', '.');
      formvars['budget'] = formvars['budget'].replaceAll(',', '.');

      jQuery.post(myAJAX.ajaxurl, formvars, function(data) {
          if ( data.result === 'OK' ) {
            location.href = data.url;
          }
         else {
            hideTabLoader();
            alert('De site ondervindt technische problemen.');
         }
        // window.open('http://ocean.test.vpsearch.nl/refine-results', "_self");
      }).fail ( function() {
         hideTabLoader();
         alert('De site ondervindt technische problemen.');
      });
   }
}

function refine_search() {
   var request = {
      action: 'oco_refine_search',
      nonce: myAJAX.nonce
   };

   jQuery.get(myAJAX.ajaxurl, request, function(data) {
      search_markers = data.markers;
      if(data.result === 'OK') {

         jQuery('#modalWrapper').html(data.html);
         jQuery('#searchModal').modal('show');

         initMap('acf-map-refine');
      }
   });
}

function choose_locations() {
   var request = {
      action: 'oco_choose_locations',
      nonce: myAJAX.nonce
   };

   jQuery.get(myAJAX.ajaxurl, request, function(data) {
      search_markers = data.markers;
      //console.log(search_markers);
      if(data.result === 'OK') {

         jQuery('#modalWrapper').html(data.html);
         jQuery('#searchModal').modal('show');

         initMap('acf-map-locations');
      }
   });
}

function removeAllMarkers(){
   jQuery(search_markers).each( function(i, marker) {
      removeMarker(marker.reference_id);
   });
}

function deselectAll() {
   jQuery('#flexSelectAll').prop('checked', false);
   jQuery('#screens input:checkbox').each( function( i, el ) {
      if (jQuery(el).is(":checked")) {
         jQuery(el).prop('checked', false);
      }
   });
}

function selectAll(el) {
   removeAllMarkers();
   if (jQuery(el).is(":checked")){

      if(jQuery('#screens input:checkbox').hasClass('could')){
         jQuery(search_markers).each( function(i, marker) {
            if (jQuery('#could_'+ marker.reference_id).is(':visible')) {
               addMarker(marker.reference_id);
               jQuery('#screens input:checkbox.could').prop('checked', true);
               jQuery('#screens input:checkbox.must').prop('checked', false);
            } else {
               jQuery('#'+ marker.reference_id).prop('checked', false);
            }
         });
      } else {
         jQuery(search_markers).each( function(i, marker) {
            if (jQuery('#'+ marker.reference_id).is(':visible')) {
               addMarker(marker.reference_id);
               jQuery('#screens input:checkbox').prop('checked', true);
            } else {
               jQuery('#'+ marker.reference_id).prop('checked', false);
            }
         });
      }

   } else {
      jQuery('#screens input:checkbox').each( function(i, el) {
         jQuery(el).prop('checked', false);
      });
   }
}

function add_location(el) {
   var markerId = jQuery(el).attr('id');
   var otherClass = '';
   if( jQuery(el).hasClass('must') ){
      otherClass = 'could';
      markerId = markerId.replace('must_', '');
   }
   if( jQuery(el).hasClass('could') ){
      otherClass = 'must';
      markerId = markerId.replace('could_', '');
   }
   if ( jQuery(el).is(':checked') ) {
      if ( jQuery('#'+otherClass+'_'+markerId).is(':checked') ) {
         jQuery('#'+otherClass+'_'+markerId).prop('checked', false);
      } else {
         addMarker(markerId);
      }
   } else {
      if ( !jQuery('#'+otherClass+'_'+markerId).is(':checked') ) {
         removeMarker(markerId);
      }
   }
}

function filterScreenType() {
   var screen_type = jQuery('select[name="screen_type"] option:selected').val();
   removeAllMarkers();
   deselectAll();
   var prefix = '#';
   if ( jQuery('#screens input:checkbox').hasClass('must')) {
      prefix = '#must_';
   }
   jQuery(search_markers).each( function(i, marker) {
      if(screen_type.length > 0){
         if ( screen_type ==  marker.type) {
            jQuery(prefix + marker.reference_id).parent().parent().show();
         } else {
            jQuery(prefix + marker.reference_id).parent().parent().hide();
         }
      } else {
         jQuery(prefix + marker.reference_id).parent().parent().show();
      }

   });
}


function send_override() {
   var formvars = getFormValues('#requestModal');
   formvars.action = 'oco_send_override';

   jQuery.post(myAJAX.ajaxurl, formvars, function(data) {
      if ( data.result === 'OK' ) {
         jQuery('#requestModal').modal('hide');
         location.href = data.url;
      } else {
         alert('Er is een technisch probleem opgetreden');
      }
   });
}

function request_overwrite() {
   var request = {
      action: 'oco_request_override',
      nonce: myAJAX.nonce
   };

   jQuery.get(myAJAX.ajaxurl, request, function(data) {
      if(data.result === 'OK') {

         jQuery('#modalWrapper').html(data.html);
         jQuery('#requestModal').modal('show');

      }
   });
}

function filterScreens() {
   var search = jQuery('input[name="searchScreens"]').val().toLowerCase();
   removeAllMarkers();
   deselectAll();
   jQuery('#screens label').each( function() {
      var name = jQuery(this).text().toLowerCase();

      if ( name.indexOf(search) > -1 ) {
         jQuery(this).parent().parent().show();
      } else {
         jQuery(this).parent().parent().hide();
      }
   });
}

function add_screens() {
   var formvalues = getFormValues('#screens');

   var request = {
      action: 'oco_add_screens',
      screens: formvalues.screen
   };

   jQuery.post(myAJAX.ajaxurl, request, function(data) {

      if ( data.result === 'OK' ) {
         jQuery('#searchModal').modal('hide');
         //location.reload();
      } else {
         alert('Er zijn geen schermen geselecteerd');
      }
   });
}

function selectScreens(type) {
   var formvars = [ ];

   jQuery('.' + type).each( function() {
      if ( jQuery(this).prop('checked') ) {
         formvars.push(this.value);
      }
   });

   return formvars;
}

function add_initial_screens() {
   var request = {
      action: 'oco_add_initial_screens',
      must_screens: selectScreens('must'),
      could_screens: selectScreens('could')
   };

   jQuery.post(myAJAX.ajaxurl, request, function(data) {
      if ( data.result === 'OK' ) {
         jQuery('#searchModal').modal('hide');
      } else {
         alert('Er zijn geen schermen geselecteerd');
      }
   });
}

function choose_scenario() {
   var id = jQuery('.scenario-select:checked').val();    // Need to select based on selected scenario
   var request = {
      action: 'oco_choose_scenario',
      id: id
   };

   jQuery.post(myAJAX.ajaxurl, request, function(data) {
      if ( data.result === 'OK' ) {
         location.reload();
      }
   });
}

function getFormValues(form) {

   var formvars = { };

   jQuery(form + ' :input').each( function() {
      var myObj = { };
      var value = '';
      var addValue = false;

      if ( jQuery(this).is('select') ) {
         value = jQuery('option:selected', this).val();
         addValue = true;
      } else if ( jQuery(this).is(':radio') ) {
         if ( jQuery(this).prop('checked') ) {
            value = jQuery(this).val();
            addValue = true;
         }
      } else if ( jQuery(this).is(':checkbox') ) {
         if ( jQuery(this).prop('checked') ) {
//console.log(this);
            if ( typeof formvars[this.name] === 'undefined' ) {
               formvars[this.name] = [ ];
            }

            formvars[this.name].push(this.value);
         }
      } else {
         value = jQuery(this).val();
         addValue = true;
      }

      if ( addValue ) {
         myObj[this.name] = value;
         jQuery.extend(formvars, myObj);
      }
   });

   return formvars;
}

function makeReadonly(controls) {
   if(jQuery('#flexRadioBudget').is(':checked')) {
      jQuery('#reach').prop('readonly', true);
      jQuery('#budget').prop('readonly', false);
      jQuery('#reach').val('');
   }
   if(jQuery('#flexRadioReach').is(':checked')) {
      jQuery('#budget').prop('readonly', true);
      jQuery('#reach').prop('readonly', false);
      jQuery('#budget').val('');
   }
}

function validation_check() {
   /*Reach field mandatory check*/
   if(jQuery('#reach').val() === '') {
      document.getElementById("reach").classList.add("invalid");
      jQuery('#mandatory_field').css("visibility","visible");
     // jQuery('#errorMsg').css("display","block");
      return false;
   }
   else {
      return true;
   }
}

function setMapNull(marker, map) {
  marker.setMap(map);
  marker = null;
}

function addMarker(screen_id) {
   var pinColor = "#000000";
   var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
                   new google.maps.Size(21, 34),
                   new google.maps.Point(0,0),
                   new google.maps.Point(10, 34));

   const svgMarker = {
      path: "M10.453 14.016l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM12 2.016q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z",
      fillColor: "#000000",
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "#ffffff",
      rotation: 0,
      scale: 1.75,
      anchor: new google.maps.Point(15, 30),
   };

   jQuery.each( search_markers, function(i, marker) {
      if ( marker.reference_id === screen_id ) {
         //console.log( marker );
         var map_marker = new google.maps.Marker({
            position: {
              lat: parseFloat( marker.geo.lat ),
              lng: parseFloat( marker.geo.lng )
            },
            map,
            title: marker.name,
            //icon: svgMarker,
            icon: pinImage,
            gestureHandling: "cooperative",
            zoom: 9,
         });

         // Add a click listener for each marker, and set up the info window.
         map_marker.addListener("click", () => {
            infoWindow.close();
            //infoWindow.setContent(marker.name);
            infoWindow.setContent( "<div>" +
                                   "<img class='img-popup' src='" + marker.photo + "'>" +
                                   "</div><div style='font-weight: bold; padding: 10px;'>" + marker.name +
                                   "</div><div style='font-weight: 400!important; padding-left: 10px; margin-top: -10px'>Type:" + marker.type + "</div>");
            infoWindow.open(map_marker.getMap(), map_marker);
         });

         arrMarkers.push( { id: screen_id, marker: map_marker, price: marker.price, reach: marker.reach } );
      }
   });
}

function removeMarker(screen_id) {
   jQuery(arrMarkers).each( function(i, marker) {
      if ( marker.id === screen_id ) {
         marker.marker.setMap(null);
         arrMarkers.splice(i, 1);
      }
   });
}

function refine_check(screen_id) {
   if ( jQuery('#' + screen_id).is(':checked') ) {
      addMarker(screen_id);
   } else {
      removeMarker(screen_id);
   }
   console.log( arrMarkers.length );

   // Run through checked locations
   var reach = 0;
   var price = 0;
   jQuery(arrMarkers).each( function(i, marker) {
      reach += marker.reach;
      price += marker.price;
   });

   var sum_cpm = (price / reach) * 1000;

   jQuery('#new_budget').text('€ ' + format(Math.abs(price)) );
   jQuery('#new_reach').text(format(Math.abs(Math.round(reach)), false) );
   jQuery('#new_cpm').text('€ ' + format(Math.abs(sum_cpm.toFixed(2))) );
}

function showTabLoader() {
   jQuery('#map-overlay').css("display","none");
   jQuery('#tabloader').css("visibility","visible");
}

function hideTabLoader() {
   jQuery('#map-overlay').css("display","none");
   jQuery('#tabloader').css("visibility","hidden");
}

/* Daterange picker */

jQuery(function() {
   if(jQuery('input[name="daterange"]').length > 0){
      jQuery('input[name="daterange"]').daterangepicker({
         opens: 'left',
         locale: {
            format: 'DD-MM-YYYY'
         }

      }, function(start, end, label) {
         console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
      });
   }

});

/* Timerange picker */

jQuery(function() {
   if(jQuery('#timeFrom').length > 0) {
      jQuery('#timeFrom').timepicker({timeFormat: 'HH:mm'});
   }
   if(jQuery('#timeTo').length > 0) {
      jQuery('#timeTo').timepicker({timeFormat: 'HH:mm'});
   }
});

function format(x, use_decimals) {
   if ( x > 0 ) {
      if ( typeof use_decimals === 'undefined' || use_decimals ) {
         x = parseFloat(x).toFixed(2);
      }
//console.log(x);
      x = x.toString().replace('.', ',');
      return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ".");
   }

   return '';
}

/* Confirmation screens*/

function overview() {
   jQuery('#segment_header').hide();
   jQuery('#overview_tab').show();
   jQuery('#segment_tab').hide();
   jQuery('#order_tab').hide();
}

function segmentation() {
   jQuery('#overview_header').hide();
   jQuery('#segment_tab').show();
   jQuery('#overview_tab').hide();
   jQuery('#order_tab').hide();

}

function orderfulfill() {

   jQuery('#segment_tab').hide();
   jQuery('#overview_tab').hide();
   jQuery('#order_tab').show()

//chart js
// Get the context of the canvas element we want to select

   let ctx_reach = document.getElementById('reach_chart').getContext('2d');

   let reach_chart = new Chart(ctx_reach, {
      type: 'doughnut',
      data: {
         labels: ["Promised", "Achieved", ""],
         datasets: [{
            label: 'Reach',
            data: [5300000, 0, 6000000-5300000],
            backgroundColor: [
               "rgba(54, 162, 235, 1)",
               "#CDF1FF",
               "white"
            ],
         },
            {
               data: [0, 5100000, 6000000-5100000],
               backgroundColor: [
                  "#CDF1FF",
                  "#CDF1FF",
                  "white"
               ],
            }]
      },
      options: {
         cutout: 80,
         radius: "80%",

      }
   });

   let ctx_spots = document.getElementById('spots_chart').getContext('2d');
   let spots_chart = new Chart(ctx_spots, {
      type: 'doughnut',
      data: {
         datasets: [{
            label: 'Spots',
            data: [35500, 0, 45000-35500],
            backgroundColor: [
               "#00A45A",
               "#CFFAE6",
               "white"
            ]},
            {
               data: [35000, 0, 45000-35000],
               backgroundColor: [
                  "#CFFAE6",
                  "#CFFAE6",
                  "white"
               ]}
         ],
         labels: ["Promised", "Achieved", ""],
      },
      options: {
         cutout: 80,
         radius: "80%",
      }
   })
}

function finish_campaign(type) {
   var request = {
      action: 'oco_finish_campaign',
      type: type
   };
   jQuery.post(myAJAX.ajaxurl, request, function(data) {

      if(data.result === 'OK') {
         if(type === 'confirm') {
            alert('Campaign successfully sent for confirmation');
            jQuery('#confirm').prop('disabled', true);
            // location.reload();
         }
         if(type === 'hold') {
            alert('Campaign is on hold');
            jQuery('#hold').prop('disabled', true);
            // location.reload();
         }

         location.href = data.url;
      }

      if(data.result === 'ERROR') {
         if(type === 'confirm') {
            alert('Something went wrong. Campaign not sent for confirmation.');
            location.reload();
         }
         if(type === 'hold') {
            alert('Something went wrong. Campaign is not on hold.');
            location.reload();
         }
      }


   });
}

function client_response(response) {
   var request = {
      action: 'oco_client_response',
      response: response
   };

   jQuery.post(myAJAX.ajaxurl, request, function(data) {
      // location.reload();
      if ( data.result === 'OK' ) {
         var action = '';
         switch ( request.response ) {
            case 'approve':
               action = 'approved';
               jQuery('#approve').hide();
               jQuery('#decline').hide();
               alert('You ' + action + ' the offer.');
               break;

            case 'decline':
               action = 'declined';
               jQuery('#approve').hide();
               jQuery('#decline').hide();
               alert('You ' + action + ' the offer.');
               break;

            default:
         }
      } else {
         alert('An error occurred. Please try again. Contact your account manager when the problem persists.');
      }
   });
}

/* Prev and Next buttons*/

function loadPrev() {
   jQuery('.firstItems').show();
   jQuery('.nextItems').hide();
}

function loadNext() {
   jQuery('.firstItems').hide();
   jQuery('.nextItems').show();
}

function toggleSelect(elm){
   var thisId = jQuery(elm).attr('id');
   if(jQuery(elm).is(':checked')){
      jQuery(elm).parents('.select-label').addClass('selected');
   } else {
      jQuery(elm).parents('.select-label').removeClass('selected');
   }

   jQuery('.scenario-item input').each(function(i, el){
      if ( jQuery(el).attr('id') != thisId ) {
         jQuery(el).parents('.select-label').removeClass('selected');
         jQuery(el).prop('checked', false);
      }
   });
}
