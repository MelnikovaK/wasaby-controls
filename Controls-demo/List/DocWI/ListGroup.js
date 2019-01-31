define('Controls-demo/List/DocWI/ListGroup', [
   'Core/Control',
   'wml!Controls-demo/List/DocWI/resources/ListGroup',
   'Types/source'
], function (Control, template, sourceLib) {
   'use strict';

   var srcData = [
      {
         id: 1,
         title: 'Prague',
         group: 'Cities'
      },
      {
         id: 2,
         title: 'Moscow',
         group: 'Cities'

      },
      {
         id: 3,
         title: 'Russia',
         group: 'Countries'

      },
      {
         id: 4,
         title: 'London',
         group: 'Cities'
      },
      {
         id: 5,
         title: 'USA',
         group: 'Countries'

      },
      {
         id: 6,
         title: 'Ukraine',
         group: 'Countries'
      }
   ];

   var Module = Control.extend(
      {
         _template: template,
         _viewSource: null,

         _beforeMount: function(newOptions) {
            this._viewSource = new sourceLib.Memory({
               idProperty: 'id',
               data: srcData
            });
         },

         _groupingCallback: function(item) {
            return item.get('group');
         }
      });
   return Module;
});
