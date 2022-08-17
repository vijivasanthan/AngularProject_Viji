import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { NgForm, FormBuilder, FormGroup, Validators} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { Storage } from '@ionic/storage';
import { ToastController } from '@ionic/angular';
import { AppVersion } from '@ionic-native/app-version/ngx';

import { RestService } from '../../services/rest.service';
import { UserData } from '../../providers/user.data';
import {appVariables, environment} from '../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})

export class LoginPage implements OnInit {

   translateStr: any;

   loginForm: FormGroup;
   lostpwdForm: FormGroup;

   loginSubmitted: boolean;
   lostpwdSubmitted: boolean;

   showRecoverPanel: boolean;
   showLoginPanel: boolean;

   emailResetPwd: boolean;
   apiErrorMsg: '';

   appversion: string;

   constructor(
      public router: Router,
      public rest: RestService,
      public formBuilder: FormBuilder,
      public toastController: ToastController,
      public translate: TranslateService,
      public version: AppVersion,
      public storage: Storage,
      public userData: UserData
   ) {

      this.translateStr = {};
      // hiermee haal je dus ook de taal string op
      this.translate.get(['login', 'message', 'error']).subscribe((res: any) => {
         this.translateStr = res;
      });

      this.loginSubmitted = false;
      this.lostpwdSubmitted = false;
      this.showRecoverPanel = false;
      this.showLoginPanel = true;

   }

   ngOnInit() {
      this.initLoginForm();
   }

   initLoginForm() {
      this.loginForm = this.formBuilder.group({
         email: ['', Validators.compose([Validators.required, Validators.email])],
         password: ['', Validators.required],
      });

      this.lostpwdForm = this.formBuilder.group({
         email: ['', Validators.compose([Validators.required, Validators.email])]
      });
   }

   login() {
      this.loginSubmitted = true;

      const data = {
      ...this.loginForm.value
      };

      if(this.loginForm.valid) {
         this.userData.login(data).then((response) => {

            if(response) {
               this.router.navigateByUrl('/app/tabs-page', { replaceUrl: true }).then(() => {
               });
            } else {
               this.apiErrorMsg = this.translateStr.error.api.err_email_password_incorrect;
               //err_email_password_incorrect
            }
         }, err => { // dit is dus als er een error terug komt
            // return to login screen
         });
      } else {
         //this.presentToast('Please fill all the required fields.', 'error');
      }
   }

   lostPassword() {
      this.lostpwdSubmitted = true;

      if (this.lostpwdForm.valid) {
         this.rest.lostPassword(this.lostpwdForm.controls.email.value).subscribe((response) => {
            if (response.result === 'OK') {
               this.showRecoverPanel = false;
               this.showLoginPanel = true;
            } else {
               this.emailResetPwd = false;
               this.apiErrorMsg = this.translateStr.error.api.err_email_password_incorrect;
            }
         });
      }
   }

   panelSwitch(type) {
      switch (type) {
         case 'recover':
            this.lostpwdForm.controls.email.setValue('');
            this.showRecoverPanel = true;
            this.showLoginPanel = false;
         break;
         case 'login':
            this.showRecoverPanel = false;
            this.showLoginPanel = true;
         break;
      }
   }

   register() {
      this.router.navigateByUrl('/register');
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

   resetErrorMsg() {
      this.apiErrorMsg = '';
   }
}
