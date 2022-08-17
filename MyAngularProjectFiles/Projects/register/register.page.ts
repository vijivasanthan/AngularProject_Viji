import {Component, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { RestService } from '../../services/rest.service';
import { ToastController, ModalController, Platform, IonSlides } from '@ionic/angular';

import { NgForm, FormBuilder, FormGroup, Validators} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AgeValidator } from '../../validators/age.validator';
import { PasswordValidator } from '../../validators/password.validator';
import { MustMatch } from '../../validators/must-match.validator';

import { Storage } from '@ionic/storage';

import { RegistrationData } from '../../providers/registration.data';
import { UserData } from '../../providers/user.data';

import { IonDatetime } from '@ionic/angular';
import { format, parseISO } from 'date-fns';

import { CodeInputComponent } from 'angular-code-input';

import { UploadIdModal } from '../../modals/upload-id/upload-id.modal';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {

   @ViewChild('slides', {static: true}) ionSlides: IonSlides;
   @ViewChild( IonDatetime ) datetime: IonDatetime;
   @ViewChild('codeInputEmail') codeInputEmail !: CodeInputComponent;
   @ViewChild('codeInputPhone') codeInputPhone !: CodeInputComponent;

   translateStr: any;

   showHeader = true;

   emailForm: FormGroup;
   phoneForm: FormGroup;
   personalDetails: FormGroup;
   verifyID: FormGroup;
   termsConditions: FormGroup;

   formattedString: string;

   registrationStep: any;

   emailSubmitted: boolean;
   phoneSubmitted: boolean;

   fullPhoneNumber: string;

   verificationCode: string;
   verificationStatus: any;

   showCodePanel: boolean;

   personalDetailsVerified: boolean; //deze nog aanpassen
   privacyVerified: boolean; //deze nog aanpassen

   uploadID: boolean;

   apiErrorMsg = '';

   countries: any;
   selectedCountryCode: any;

   slideNumber: number;
   slideOpts = {
      allowTouchMove: false,
      //autoHeight: true
   };

   countrySelectOptions: any = {
      header: 'Kies je land',
      //cssClass: 'country-select'
      //subHeader: 'Select your toppings',
      //message: '$1.00 per topping',
      //translucent: true,
   };

   constructor(
    public router: Router,
    public formBuilder: FormBuilder,
    public rest: RestService,
    public translate: TranslateService,
    public toastController: ToastController,
    public modalController: ModalController,
    public userData: UserData,
    public registrationData: RegistrationData,
    public storage: Storage,
  ) {

      this.translateStr = {};
      // hiermee haal je dus ook de taal string op
      this.translate.get(['register', 'message', 'error']).subscribe((res: any) => {
         this.translateStr = res;
         console.log(this.translateStr);
      });

      this.registrationStep = {
         verifyEmailPhone: true,
         verifyPersonal: false,
         verifyId: false
      };

      this.emailSubmitted = false;
      this.phoneSubmitted = false;

      this.fullPhoneNumber = '';

      this.showCodePanel = false;
      // this.codeVerified = false; // kan weg

      this.verificationCode = '';
      this.verificationStatus = {
         type: '',
         message: ''
      };

      this.personalDetailsVerified = false;
      this.privacyVerified = false;

      this.countries = [];
  }

  ngOnInit() {
     this.initRegisterForm();
  }

   ionViewWillEnter() {
      this.getCountries();
   }

   ionViewDidEnter() {
   }

   initRegisterForm() {
      this.emailForm = this.formBuilder.group({
         email: ['', Validators.compose([Validators.required, Validators.email])]
      });

      this.phoneForm = this.formBuilder.group({
         phone: ['', [Validators.required, Validators.pattern('[- +()0-9]+')]],
         countryCode: ['+31', [Validators.required]]
      });

      this.personalDetails = this.formBuilder.group({
         salutation: ['', Validators.required],
         firstname: ['', Validators.required],
         middlename: [''],
         lastname: ['', Validators.required],
         birthdate: ['', Validators.compose([AgeValidator.isValid, Validators.required])],
         birthplace: ['', Validators.required],
         birthcountry: ['', Validators.required],
         street: ['', Validators.required],
         number: ['', Validators.required],
         addition: [''],
         postcode: ['', Validators.required],
         city: ['', Validators.required],
         country: ['', Validators.required],
         password: ['', Validators.compose([PasswordValidator.isValid, Validators.required])],
         passwordRepeat: ['', Validators.required],
      }, {
         validators: MustMatch('password', 'passwordRepeat')
      });

      this.verifyID = this.formBuilder.group({
         //
      });

      this.termsConditions = this.formBuilder.group({
         agree_terms: [0, Validators.requiredTrue],
         share_data: [0, Validators.requiredTrue],
         privacy_statement: [0, Validators.requiredTrue],
         get_updates: [0],
         get_offers: [0]
      });
  }


   onCodeChanged(code: string) {
      this.verificationCode = code;
   }

   onCodeCompleted(code: string) {
      this.verificationCode = code;
   }

   renderPhoneNumber() {
      this.phoneForm.controls.phone.setValue(this.phoneForm.value.phone.replace(/^0+/, ''));   
   }

   formatDate(value: string) {
      return format(parseISO(value), 'dd-MM-yyyy');
   }

   moveToStep(step) {

      switch (step) {
         case 'verifyEmail':
            this.ionSlides.slideTo(0);
            break;

         case 'verifyPhone':
            this.ionSlides.slideTo(1);
            break;

         case 'personalDetails':
            this.ionSlides.slideTo(2);
            break;

         case 'driverLicence':
            break;

         case 'termsConditions':
            this.ionSlides.slideTo(3);
            this.showHeader = false;
            break;

         case 'finishRegistration':
            this.ionSlides.slideTo(4);
            this.showHeader = false;
            break;
      }
   }

   slideWillChange(event) {
     this.ionSlides.getActiveIndex().then( (activeIndex) => {

        this.slideNumber = activeIndex;

        switch(this.slideNumber) {
           case 1:
              this.registrationStep = {
                 verifyEmailPhone: true,
                 verifyPersonal: false,
                 verifyId: false
              };
              break;
           case 2:
              this.registrationStep = {
                 verifyEmailPhone: false,
                 verifyPersonal: true,
                 verifyId: false
              };
              break;
           case 3:
              this.registrationStep = {
                 verifyEmailPhone: false,
                 verifyPersonal: false,
                 verifyId: true
              };
              break;
        }

     });
   }

   getVerificationCode(type) {

      const postVars = {
         ...this.emailForm.value,
         ...this.phoneForm.value,
      };

      switch (type) {
         case 'email':
            // If resend code clicked code input and error message is reset
            if(this.verificationCode.length > 0) {
               this.codeInputEmail.reset();
               this.apiErrorMsg = '';
               this.verificationStatus.type = '';
            }

            this.emailSubmitted = true;

            if (this.emailForm.controls.email.valid) {
               this.registrationData.verifyEmail(postVars.email).then((response) => {
                  if (response.result === 'OK') {
                     this.showCodePanel = true;
                  } else {
                     this.apiErrorMsg = this.translateStr.error.api[response.code];
                  }
               });
            }
            //
            break;

         case 'phone':
            // If resend code clicked code input and error message is reset
            if(this.verificationCode.length > 0) {
               this.codeInputPhone.reset();
               this.apiErrorMsg = '';
               this.verificationStatus.type = '';
            }
            this.phoneSubmitted = true;

            if (this.phoneForm.controls.phone.valid) {

               this.registrationData.verifyPhone(postVars.email, postVars.countryCode, postVars.phone).then((response) => {
                  if (response.result === 'OK') {
                     this.showCodePanel = true;
                  } else {
                     this.apiErrorMsg = this.translateStr.error.api[response.code];
                  }
               });
            }
            //
            break;
      }
   }

   checkVerificationCode(type) {

      const postVars = {
         ...this.emailForm.value,
         ...this.phoneForm.value,
      };

      this.verificationStatus = {
         type: 'pending',
         message: 'Verifying code'
      };

      switch (type) {
         case 'email':
           
            this.registrationData.verifyEmailCode(postVars.email, this.verificationCode).then((response) => {
               if (response.result === 'OK') {

                  setTimeout(() => {
                     this.verificationStatus = {
                        type: 'success',
                        message: 'Code verified'
                     };

                     this.moveToStep('verifyPhone');
                     //this.ionSlides.slideTo(1);
                     this.verificationCode = '';
                     this.showCodePanel = false;
                  }, 1000);

               } else {
                  setTimeout(() => {
                     this.verificationStatus = {
                        type: 'error',
                        message: this.translateStr.error.api[response.code]
                     };
                  }, 1000);

               }
            });
            
            break;

         case 'phone':
            //
            this.registrationData.verifyPhoneCode(postVars.email, postVars.countryCode, postVars.phone, this.verificationCode).then((response) => {
               if (response.result === 'OK') {

                  setTimeout(() => {
                     this.verificationStatus = {
                        type: 'success',
                        message: 'Code verified'
                     };

                     this.moveToStep('personalDetails');
                     //this.ionSlides.slideTo(2);
                     this.verificationCode = '';
                     this.showCodePanel = false;
                  }, 1000);

               } else {

                  setTimeout(() => {
                     this.verificationStatus = {
                        type: 'error',
                        message: this.translateStr.error.api[response.code]
                     };
                  }, 1000);

               }
            });
            //
            break;
      }
   }

   registerAccount() {
      const postVars = {
         email: this.emailForm.controls.email.value,
         countrycode: this.phoneForm.controls.countryCode.value,
         phone: this.phoneForm.controls.phone.value,
         // phone: this.fullPhoneNumber, //TODO remove later
         ...this.personalDetails.value,
         ...this.termsConditions.value,
      };

      if( this.termsConditions.valid ) {
         this.registrationData.register(postVars).then((response) => {

            if(response.result === 'OK') {
               this.moveToStep('finishRegistration');
            } else {
               this.presentToast(this.translateStr.error.api[response.code], 'error');
            }

         });
      }
   }

   getCountries() {
      fetch('../assets/json/countries.json').then(res => res.json())
         .then(json => {
           this.countries = json;
         });
   }

   backToLogin() {
      this.router.navigateByUrl('/login');
   }

   async presentToast(msg, type) {
      const toast = await this.toastController.create({
         message: msg,
         duration: 2500,
         position: 'bottom',
         cssClass: 'customToast-' + type
      });

      toast.present();
   }

   modalDateChanged(value) {
      this.personalDetails.controls.birthdate.setValue(value);
   }
   async selectDateModal() {
      await this.datetime.confirm(true);
   }

   async closeModal() {
      await this.datetime.cancel(true);
   }
}
