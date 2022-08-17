import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CodeInputModule } from 'angular-code-input';

import { RegisterPage } from './register.page';

const routes: Routes = [
  {
    path: '',
    component: RegisterPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes),
            CodeInputModule.forRoot({
              codeLength: 5,
              isCharsCode: false,
              code: ''
            })
  ],
  exports: [RouterModule],
})
export class RegisterPageRoutingModule {}
