import { Component, OnInit } from '@angular/core';

// Just for home beeeaauuty
import Typed from 'typed.js';
import * as AOS from 'aos';
declare var $: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    if ($('.typed').length) {
      let typedString = $('.typed').data('typed-items');
      typedString = typedString.split(',');
      // tslint:disable-next-line: no-unused-expression
      new Typed('.typed', {
        strings: typedString,
        loop: true,
        typeSpeed: 100,
        backSpeed: 50,
        backDelay: 2000
      });
    }

    AOS.init({
      duration: 1000,
      once: true
    });
  }

}
