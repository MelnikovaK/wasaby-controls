define('Controls-demo/FilterButton/FilterButton',
   [
      'Core/Control',
      'tmpl!Controls-demo/FilterButton/FilterButton',
      'css!Controls-demo/FilterButton/FilterButton',
      'Controls/Filter/Button',
      'Controls/Button',
      'WS.Data/Source/Memory',
      'tmpl!Controls-demo/FilterButton/Panel/resources/additionalItemsTemplate2',
      'tmpl!Controls-demo/Layouts/SearchLayout/FilterButtonTemplate/filterItemsTemplate',
      'tmpl!Controls-demo/Layouts/SearchLayout/FilterButtonTemplate/additionalItemsTemplate',
      'tmpl!Controls-demo/FilterButton/Panel/resources/FIO'
   ],
   
   function(Control, template) {
      
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
      
      var FilterButton = Control.extend({
         
         _template: template,
         sourceDropdown: sourceDropdown

      });
      
      return FilterButton;
   });