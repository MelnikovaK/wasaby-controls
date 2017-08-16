define(['js!SBIS3.CONTROLS.DateBox'], function (DateBox) {
   'use strict';

   var controlTestCase = function () {
      // Попытка вынести общую логику тестов, не уверен что правильная.. Пусть пока полежит здесь.
      beforeEach(function () {
         if (typeof $ === 'undefined') {
            this.skip();
         }
         else {
            var cfg = this.controlConfig || {};
            this.container = $('<div id="component"></div>').appendTo('#mocha');
            cfg.element = this.container;
            this.testControl = new this.controlClass(this.controlConfig);
         }
      });

      afterEach(function () {
         this.testControl.destroy();
         this.testControl = undefined;
         this.container = undefined;
      });
   };

   describe('SBIS3.CONTROLS.DateBox', function () {
      describe('._createAutocomplitedDate ', function () {

         let now = new Date(),
            year = now.getFullYear(), month = now.getMonth(), date = now.getDate(),
            tests = [
               // Заполнен день, месяц
               [[null, 11, 11, null, null], new Date(year, 11, 11), 'DD.MM.YY'], // Подставляем текущий год
               [[null, null, 11, null, null], new Date(year, month, 11), 'DD.MM.YY'], // Подставляем текущий месяц и год
               // Заполнен текущий год
               [[year, null, 11, null, null], new Date(year, month, 11), 'DD.MM.YY'], // Подставляем текущий месяц
               [[year, null, null, null, null], new Date(year, month, date), 'DD.MM.YY'], // Подставляем текущий день и месяц
               // Заполнен текущий год и месяц
               [[year, month, null, null, null], new Date(year, month, date), 'DD.MM.YY'], // Подставляем текущий день
               // Заполнен год, отличный от текущего
               [[2000, null, 11, null, null], new Date(2000, 0, 11), 'DD.MM.YY'], // Подставляем 01
               [[2000, null, null, null, null], new Date(2000, 0, 1), 'DD.MM.YY'], // Подставляем 01.01
               // Заполнен год, отличный от текущего и месяц
               [[2000, month + 1, null, null, null], new Date(2000, month + 1, 1), 'DD.MM.YY'], // Подставляем 1
               // остальные случаи
               [[null, 1, null, null, null], null, 'DD.MM.YY'],

               [[2000, 1, 1, 10, null], new Date(2000, 1, 1, 10, 0), 'HH:II'],
               [[null, null, null, null, 10], null, 'HH:II'],
               [[2000, 1, 1, null, 10], null, 'HH:II'],
         ];
         DateBox.prototype._options = {validators: []};

         tests.forEach(function (test, index) {
            it('should return "' + (test[1] ? test[1].toISOString() : 'null') + '" for year=' + test[0][0] +
                  ', month=' + test[0][1] + ', date=' + test[0][2] + ', hours=' + test[0][3] + ', minutes=' + test[0][4], function () {
               DateBox.prototype._options.mask = test[2];
               var ret = DateBox.prototype._createAutocomplitedDate(
                 test[0][0], test[0][1], test[0][2], test[0][3], test[0][4], null, null
               );
               // console.log(ret.toString());
               assert.deepEqual(ret, test[1]);
            });
         });
      });

      // this.ctx.initialDate = new Date(2016, 1, 2, 3, 4, 5, 6);
      //
      this.ctx.controlClass = DateBox;
      // Добавляем опции нужные конкретно этим тестам.
      // Подумать как можно переиспользовать настройки DateBox и базовые общие тесты для DatePicker.
      // this.ctx.controlConfig = {
      //    date: this.ctx.initialDate
      // };
      this.ctx.controlConfig = {};

      describe('auto set century with YY year mask', function () {
         this.ctx.controlConfig.mask = 'DD.MM.YY';
         // Этот вызов должен быть во внешнем describe, но тогда мы не сможем модифицировать опции во внутренних describe.
         controlTestCase();

         it('should be current century if short year less then current year + 10', function () {
            var date = new Date();
            date.setYear(date.getFullYear() + 9);
            this.testControl.setText('01.02.00');
            assert.equal(this.testControl.getDate().getFullYear(), 2000);
            this.testControl.setText('01.02.05');
            assert.equal(this.testControl.getDate().getFullYear(), 2005);
            this.testControl.setText(date.strftime('%d.%m.%y'));
            assert.equal(this.testControl.getDate().getFullYear(), date.getFullYear());
         });

         it('should be last century if short year greater than current year + 10', function () {
            var date = new Date();
            date.setYear(date.getFullYear() + 11);
            this.testControl.setText(date.strftime('%d.%m.%y'));
            assert.equal(this.testControl.getDate().getFullYear(), date.getFullYear() - 100);
         });
      });
      describe('.setText', function () {
         controlTestCase();
         it('should generate onTextChange and onDateChange events', function () {
            let onTextChange = sinon.spy(),
               onDateChange = sinon.spy(),
               onPropertiesChanged = sinon.spy(),
               onPropertyChanged = sinon.spy();
            this.testControl.subscribe('onTextChange', onTextChange);
            this.testControl.subscribe('onDateChange', onDateChange);
            this.testControl.subscribe('onPropertiesChanged', onPropertiesChanged);
            this.testControl.subscribe('onPropertyChanged', onPropertyChanged);
            this.testControl.setText('11.11.11');
            assert(onTextChange.calledOnce, `onTextChange called ${onTextChange.callCount}`);
            assert(onDateChange.calledOnce, `onDateChange called ${onDateChange.callCount}`);
            // onPropertiesChanged вызывается 2 раза. Если будет актуально, то в будущем можно оптимизировать избавившись от лишних вызовов.
            assert(onPropertiesChanged.calledTwice, `onPropertiesChanged called ${onPropertiesChanged.callCount}`);
            assert(onPropertyChanged.calledTwice, `onPropertyChanged called ${onPropertyChanged.callCount}`);
         });
      });
   });
});

