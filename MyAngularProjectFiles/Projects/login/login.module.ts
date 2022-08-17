import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { LoginPageRoutingModule } from './login-routing.module';

import { LoginPage } from './login.page';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
   imports: [
      CommonModule,
      FormsModule,
      IonicModule,
      ReactiveFormsModule,
      TranslateModule,
      LoginPageRoutingModule,
      ComponentsModule
   ],
   exports: [
      LoginPage
   ],
   declarations: [LoginPage]
})
export class LoginPageModule {}
