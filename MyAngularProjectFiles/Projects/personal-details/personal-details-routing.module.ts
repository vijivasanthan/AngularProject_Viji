import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CodeInputModule } from 'angular-code-input';

import { PersonalDetailsPage } from './personal-details.page';

const routes: Routes = [
  {
    path: '',
    component: PersonalDetailsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes),
  CodeInputModule.forRoot({
    codeLength: 5,
    isCharsCode: false,
    code: ''
  })],
  exports: [RouterModule],
})
export class PersonalDetailsPageRoutingModule {}
