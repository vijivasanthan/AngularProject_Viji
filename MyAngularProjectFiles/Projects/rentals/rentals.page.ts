import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgForm, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ModalController, IonDatetime, Platform } from '@ionic/angular';

import { Storage } from '@ionic/storage';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import * as mapboxgl from 'mapbox-gl';

import { TranslateService } from '@ngx-translate/core';

import { environment } from '../../../environments/environment';
import { RestService } from '../../services/rest.service';
import { SocketService } from '../../services/socket.service';

import { SearchLocationModal } from '../../modals/search-location/search-location.modal';
import { format, parseISO } from 'date-fns';


@Component({
   selector: 'app-rentals',
   templateUrl: './rentals.page.html',
   styleUrls: ['./rentals.page.scss'],
})

export class RentalsPage implements OnInit {
//from drawer-rentals begin
   @ViewChild('drawer', { read: ElementRef }) drawer: ElementRef;
   @ViewChild( IonDatetime ) datetime: IonDatetime;

   translateStr: any;
   isOpen = false;
   openHeight: number;
   hideDropoff: boolean;

   public rentalForm: FormGroup;
   customPickerOptions: any;
   pageEl: any;
   pickUpDateValue: any;
   returnDateValue: any;
   currentDate: any;
   futureDate: any;
   formattedString: string;
//from drawer-rentals end

   public vehicleForm: FormGroup;

   radioValue: any;
   birthdate: any;
   age: number;
   myLocation: any;

   travelId: number;
   rentalData: any;

   private mapbox: mapboxgl.Map;
   private mapInitialized: boolean;
   displayDate: any;
   minutestoAdd: any;
   hourstoAdd: any;

   constructor(
      private plt: Platform,
      public formBuilder: FormBuilder,
      public storage: Storage,
      public modalController: ModalController,
      public geolocation: Geolocation,
      public rest: RestService,
      private socket: SocketService,
      private router: Router,
      public translate: TranslateService
   ) {
      this.translateStr = {};
      // hiermee haal je dus ook de taal string op
      this.translate.get(['rentals', 'message', 'error']).subscribe((res: any) => {
         this.translateStr = res;
         console.log(this.translateStr);
      });


      this.hideDropoff = true;
      this.radioValue = 'CAR';

      this.initRentalForm();

      this.storage.get('user').then( (response) => {
         this.birthdate = response.meta.birthdate;
      });

      this.hourstoAdd = 120;
      this.minutestoAdd = this.hourstoAdd + 15;

      this.currentDate = new Date();
      this.futureDate = new Date(this.currentDate.getTime() + this.minutestoAdd*60000).toISOString();
     // this.displayDate = new Date(this.currentDate.getHours() + 2*60).toISOString();
      console.log(this.futureDate);

      this.customPickerOptions = {
         cssClass: 'customDatePicker'
      };

      this.mapInitialized = false;
      mapboxgl.accessToken = environment.mapbox.accessToken;

      this.myLocation = [ //UTRECHT
         5.114135742187499,
         52.12337138625387
      ];

      this.rentalData = {};

      this.initVehicleTypeForm();
   }

   ngOnInit() {
      this.radioValue = 'CAR';

      this.socket.socketConnect().then((response) => {
         console.log(response);
         this.socket.getNewVendors().subscribe((response: any) => {
            console.log(response);

            if(response.result === 'OK') {
               if(response.data.length > 0 && response.travel_id === this.travelId) {
                  this.loadRentalData(response.data);
               }
            }

         });
      });

   }

   ionViewWillEnter() {

      this.rentalForm.controls.pickupStringDate.setValue(this.currentDate);
      this.rentalForm.controls.dropoffStringDate.setValue(this.currentDate);

      if (!this.mapInitialized) {
         this.initMap();
      }

      if(!this.rentalForm.value.pickupAddress) {
         this.geolocation.getCurrentPosition({timeout: 5000, maximumAge: 300000}).then((response) => {
            this.myLocation = [
               response.coords.longitude,
               response.coords.latitude
            ];

            this.mapbox.easeTo({
               center: this.myLocation,
               zoom: 12
            });
         }).catch((error) => {
            console.log('Error getting location', error);
         });
      }

   }

   initVehicleTypeForm() {
       this.vehicleForm = this.formBuilder.group({
          vehicle_type: ['CAR']
       });
   }

   initMap() {
      this.mapInitialized = true;

      this.mapbox = new mapboxgl.Map({
         container: 'map',
         style: 'mapbox://styles/mapbox/light-v10',
         zoom: 6,
         center: this.myLocation
      });

      //after drag send center of the map
      this.mapbox.on('dragend', () => {
         const center = this.mapbox.getCenter();
         console.log(center);

         const ll = new mapboxgl.LngLat(center.lng, center.lat);
         console.log(ll.toBounds(100)); // = [[-73.97501862141328, 40.77351016847229], [-73.97478137858673, 40.77368983152771]]
      });

   }

   initRentalForm() {
      this.rentalForm = this.formBuilder.group({
         pickupAddress: ['', Validators.required],
         pickupLat: [''],
         pickupLng: [''],
         pickupStringDate: ['', Validators.required],
         pickupApiDate: [''],

         dropoffAddress: ['', Validators.required],
         dropoffLat: [''],
         dropoffLng: [''],
         dropoffStringDate: ['', Validators.required],
         dropoffApiDate: [''],
      });
   }

   toggleDrawer() {
      const drawer = this.drawer.nativeElement;

      if(this.isOpen) {
         drawer.style.transition = '.4s ease-out';
         drawer.style.transform = '';
         this.isOpen = false;
      } else {
         drawer.style.transition = '.4s ease-in';
         drawer.style.transform = 'translateY(-300px)';
         this.isOpen = true;
      }
   }

   async searchLocation(locationType) {

      const modal = await this.modalController.create({
         component: SearchLocationModal,
         cssClass: '',
         componentProps: { type: locationType },
      });

      modal.onDidDismiss().then((data) => {

         switch (data.data.locationType) {
            case 'pickup':
               this.rentalForm.controls.pickupAddress.setValue(data.data.searchAddress);
               this.rentalForm.controls.pickupLat.setValue(data.data.searchCoords[1]);
               this.rentalForm.controls.pickupLng.setValue(data.data.searchCoords[0]);

               this.showLocation(data.data.searchCoords[0], data.data.searchCoords[1]);

               if (this.hideDropoff) {
                  this.rentalForm.controls.dropoffAddress.setValue(data.data.searchAddress);
                  this.rentalForm.controls.dropoffLat.setValue(data.data.searchCoords[1]);
                  this.rentalForm.controls.dropoffLng.setValue(data.data.searchCoords[0]);

               }
               break;
            case 'drop-off':
               this.rentalForm.controls.dropoffAddress.setValue(data.data.searchAddress);
               this.rentalForm.controls.dropoffLat.setValue(data.data.searchCoords[0]);
               this.rentalForm.controls.dropoffLng.setValue(data.data.searchCoords[1]);

               break;
         }
      });

      return await modal.present();
   }

   toggleDropoff(event) {
      if (event.detail.checked) {
         this.hideDropoff = true;
      }
      else {
         this.hideDropoff = false;
         this.rentalForm.controls.dropoffAddress.setValue('');
      }
   }

   modalDateChanged(value, dateType) {
      console.log(value);
      if(dateType === 'pickUpDate') {
         this.pickUpDateValue = value;
         // this.rentalForm.controls.pickupStringDate.setValue(format(parseISO(value), 'd MMM | HH:mm'));
         this.rentalForm.controls.pickupStringDate.setValue(value);
         this.rentalForm.controls.pickupApiDate.setValue(value);
      } else {
         this.returnDateValue = value;
         // this.rentalForm.controls.dropoffStringDate.setValue(format(parseISO(value), 'd MMM | HH:mm'));
         this.rentalForm.controls.dropoffStringDate.setValue(value);
         this.rentalForm.controls.dropoffApiDate.setValue(value);
      }
   }

   async selectDateModal() {
      await this.datetime.confirm(true);
   }

   async closeModal() {
      await this.datetime.cancel(true);
   }

   searchRentalLocation() {
      this.toggleDrawer();

      const postVars = {
         ...this.rentalForm.value,
         vehicleType: this.radioValue,
         bookingType: 'Rent'
      };

      this.rest.searchRentals(postVars).subscribe((response) => {
         this.rest.updateToken(response.token);

         if(response.result === 'OK') {
            this.travelId = response.travel_id;
         }
      });

   }

   radioSelect(event) {
      this.radioValue = event.detail.value;

      if(event.detail.value === 'CAR') {
         this.getAge(this.birthdate);
      }
      else {

      }
   }

   getAge(dob) {
      const today = new Date();
      const rentalbirthdate = new Date(dob);
      const m = today.getMonth() - rentalbirthdate.getMonth();
      this.age = today.getFullYear() - rentalbirthdate.getFullYear();

      if (m < 0 || (m === 0 && today.getDate() < rentalbirthdate.getDate())) {
         this.age--;
      }
      return this.age;
   }

   toggleBackdrop(event: boolean) {
      console.log('in toggle backdrop', event);
   }

   loadRentalData(json) {

      this.convertData(json).then( response => {
         this.rentalData = response;

         // Create markers
         for (const marker of this.rentalData.features) {

            console.log(marker);

            const el = document.createElement('div');

            el.className = 'marker';
            el.style.backgroundImage = 'url(' + marker.properties.icon_url + ')';
            el.style.backgroundRepeat = 'no-repeat';
            el.style.width = '50px';
            el.style.height = '50px';
            el.style.backgroundSize = '100%';

            el.addEventListener('click', () => {

               this.router.navigate(['/app/tabs-page/rentals/rental-provider'],{
                  queryParams: {
                     providerId: marker.properties.ID,
                     vehicleType: this.vehicleForm.value.vehicle_type,
                     pickup: this.rentalForm.value.pickupApiDate,
                     dropoff: this.rentalForm.value.dropoffApiDate
                  }
               });

            });

            new mapboxgl.Marker(el)
               .setLngLat(marker.geometry.coordinates)
               .addTo(this.mapbox);
         }

      });

   }

   convertData(data) {
      return new Promise((resolve) => {

         const geoJson = {
            type: 'FeatureCollection',
            features: []
         };

         for (const item of data) {
            const feature = {
               type: 'Feature',
               properties: {
                  ID: item.ID,
                  company: item.renter,
                  address: item.address,
                  icon: item.icon,
                  icon_url: item.icon_url,
                  cars: item.cars
               },
               geometry: {
                  type: 'Point',
                  coordinates: [
                     item.lng,
                     item.lat
                  ]
               }
            };

            geoJson.features.push(feature);
         }


         resolve(geoJson);
      });
   }

   showLocation(lat, lng) {
      this.mapbox.flyTo({
         center: [lat, lng],
         zoom: 14,
         speed: 1, // make the flying slow
         curve: 1, // change the speed at which it zooms out
      });
   }

}
