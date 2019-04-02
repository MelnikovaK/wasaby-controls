define('Controls-demo/StateIndicator/StandartStateIndicatorDemo', [
   'Core/Control',
   'wml!Controls-demo/StateIndicator/StandartStateIndicatorDemo',
   'wml!Controls-demo/StateIndicator/template/template',
   'css!Controls-demo/StateIndicator/StandartStateIndicatorDemo',
], function(Control, template, popupTemplate) {
   'use strict';
   var Index = Control.extend(
      {
         _template: template,
         _states: null,

         constructor: function(){
            Index.superclass.constructor.apply(this,arguments);
            this._scales = [
               10,
               10,
               10,
               10,
               10,
               10,
               10,
               5,
               5,
               5,
               5,
               6,
               7.6,
               ]
            this._datas = [
               [{value: 0, className: '', title: 'Положительно'}],
               [{value: 3, className: '', title: 'Положительно'}],
               [{value: 53, className: '', title: 'Положительно'}],
               [{value: 100, className: '', title: 'Положительно'}],

               [{value: 0, className: '', title: 'Положительно'},
                  {value: 30, className: '', title: 'В работе'}],

               [{value: 20, className: '', title: 'Положительно'},
                  {value: 80, className: '', title: 'В работе'}],

               [{value: 40, className: '', title: 'Положительно'},
                  {value: 12, className: '', title: 'В работе'}],

               [{value: 35, className: '', title: 'Положительно'},
                  {value: 40, className: '', title: 'В работе'}],

               [{value: 30, className: '', title: 'Положительно'},
                  {value: 70, className: '', title: 'В работе'}],

               [{value: 10, className: '', title: 'Положительно'},
                  {value: 30, className: '', title: 'В работе'},
                  {value: 50, className: '', title: 'Отрицательно'}],

               [{value: 25, className: '', title: 'Положительно'},
                  {value: 25, className: '', title: 'В работе'},
                  {value: 25, className: '', title: 'Отрицательно'}],

               [{value: 33, className: '', title: 'Положительно'},
                  {value: 33, className: '', title: 'В работе'},
                  {value: 33, className: '', title: 'Отрицательно'},
                  {value: 1, className: 'controls-StateIndicator__emptySector', title: 'Не обработано'}],

               [{value: 20, className: '', title: 'Положительно'},
                  {value: 30, className: '', title: 'В работе'},
                  {value: 3, className: '', title: 'Отрицательно'},
                  {value: 47, className: 'controls-StateIndicator__emptySector', title: 'Не обработано'}],
            ];
         },
         _mouseLeaveHandler: function(){
             this._notify('closeInfoBox', [1500], {bubbling: true});
         },
         _mouseEnterHandler: function(e, _item){
         	var config = {
              target: _item,
              position: 'tl',
              template: popupTemplate,
              templateOptions: {data: this._datas[_item.parentElement.parentElement.getAttribute("index")]}
         	};
         	this._notify('openInfoBox', [config], {bubbling: true});
         }
      });
   return Index;
});
