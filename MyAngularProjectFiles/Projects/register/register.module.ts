import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { IonicModule } from '@ionic/angular';

import { RegisterPageRoutingModule } from './register-routing.module';

import { RegisterPage } from './register.page';
import { CodeInputModule } from 'angular-code-input';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
   imports: [
      CommonModule,
      FormsModule,
      ReactiveFormsModule,
      TranslateModule,
      IonicModule,
      RegisterPageRoutingModule,
      CodeInputModule,
      ComponentsModule
   ],
  declarations: [RegisterPage]
})
export class RegisterPageModule {}
