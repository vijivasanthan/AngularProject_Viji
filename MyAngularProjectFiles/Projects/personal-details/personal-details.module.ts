import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { IonicModule } from '@ionic/angular';

import { PersonalDetailsPageRoutingModule } from './personal-details-routing.module';

import { PersonalDetailsPage } from './personal-details.page';
import { CodeInputModule } from 'angular-code-input';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
   imports: [
      CommonModule,
      FormsModule,
      TranslateModule,
      ReactiveFormsModule,
      IonicModule,
      CodeInputModule,
      PersonalDetailsPageRoutingModule,
      ComponentsModule
   ],
  providers: [DatePipe],
  declarations: [PersonalDetailsPage]
})
export class PersonalDetailsPageModule {}
