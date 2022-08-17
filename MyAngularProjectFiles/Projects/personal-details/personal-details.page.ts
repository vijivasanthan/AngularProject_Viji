import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PasswordValidator } from 'src/app/validators/password.validator';

import { ModalController } from '@ionic/angular';

import { DatePipe } from '@angular/common';

import { RestService } from '../../services/rest.service';
import { UserData } from '../../providers/user.data';

import { TranslateService } from '@ngx-translate/core';

import { EditPersonaldetailsModal } from '../../modals/edit-personaldetails/edit-personaldetails.modal';
import { UploadIdModal } from '../../modals/upload-id/upload-id.modal';

@Component({
  selector: 'app-personal-details',
  templateUrl: './personal-details.page.html',
  styleUrls: ['./personal-details.page.scss'],
})

export class PersonalDetailsPage implements OnInit {

   displayAddress: boolean;
   changepwdForm: FormGroup;
   showChangePassword: boolean;
   showPersonalDetails: boolean;
   changepwdSubmitted: boolean;
   displayErrormsg: boolean;
   apiErrorMsg: string;
   translateStr: any;

   profileData: any;

  constructor(
     public router: Router,
     public modalController: ModalController,
     public rest: RestService,
     public datePipe: DatePipe,
     public userData: UserData,
     public formBuilder: FormBuilder,
     public translate: TranslateService
  ) {
     this.showPersonalDetails = true;
     this.changepwdSubmitted = false;

     this.translateStr = {};
     // hiermee haal je dus ook de taal string op
     this.translate.get(['personal-details', 'message', 'error']).subscribe((res: any) => {
        this.translateStr = res;
     });

     this.profileData = {
        meta: {}
     };
  }

   ngOnInit() {
      this.initProfileForm();
   }

   ionViewWillEnter() {
      this.getProfile();
   }

   initProfileForm() {
      this.changepwdForm = this.formBuilder.group({
         oldPassword: ['', Validators.required],
         newPassword: ['', Validators.compose([PasswordValidator.isValid, Validators.required])]
      });
   }

   async openVerifyModal(type) {

      const modal = await this.modalController.create({
        component: EditPersonaldetailsModal,
        cssClass: '',
        componentProps: { type, profileData: this.profileData }
      });

      modal.onDidDismiss().then((data) => {
            this.getProfile();
      });

      return await modal.present();
   }

   getProfile() {
      this.userData.getProfile().then((response) => {
         this.profileData = response.data;
      });
   }

   changePassword() {
      this.changepwdSubmitted = true;
      const postVars = {
         ...this.changepwdForm.value
      };
      this.rest.changePassword(this.profileData.email, postVars).subscribe((response) => {
         this.rest.updateToken(response.token);

         if(response.result === 'OK') {
            this.showPersonalDetails = true;
            this.showChangePassword = false;
         } else {
            this.apiErrorMsg = response.code;
         }
      });
   }

   panelSwitch(type) {
      switch (type) {
         case 'changePassword':
            this.showChangePassword = true;
            this.showPersonalDetails = false;
            break;
         case 'personalDetails':
            this.showChangePassword = false;
            this.showPersonalDetails = true;
            break;
      }
   }
}
