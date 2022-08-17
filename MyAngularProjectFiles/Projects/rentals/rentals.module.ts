import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { RentalsPageRoutingModule } from './rentals-routing.module';
import { RentalsPage } from './rentals.page';

import { ComponentsModule } from '../../components/components.module';

@NgModule({
   imports: [
      CommonModule,
      FormsModule,
      TranslateModule,
      ReactiveFormsModule,
      IonicModule,
      RentalsPageRoutingModule,
      ComponentsModule
   ],
   declarations: [RentalsPage]
})
export class RentalsPageModule {}
