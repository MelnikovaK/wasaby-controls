define('Controls-demo/FilterButton/Panel/Panel',
   [
      'Core/Control',
      'WS.Data/Source/Memory',
      'tmpl!Controls-demo/FilterButton/Panel/Panel',
      'Controls/Filter/Button/Panel'
   ],

   function(Control, MemorySource, template) {

      /**
       * @class Controls/Container/Search
       * @extends Controls/Control
       * @control
       * @public
       */

      'use strict';


      var sourceDropdown = {
         module: 'WS.Data/Source/Memory',
         options: {
            data: [
               {key: 1, title: 'все страны'},
               {key: 2, title: 'Россия'},
               {key: 3, title: 'США'},
               {key: 4, title: 'Великобритания'}
            ],
            idProperty: 'key'
         }
      };

      var Panel = Control.extend({

         _template: template,
         sourceDropdown: sourceDropdown

      });

      return Panel;
   });
