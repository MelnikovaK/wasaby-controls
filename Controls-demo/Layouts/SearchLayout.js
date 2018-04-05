/**
 * Created by am.gerasimov on 26.01.2018.
 */
/**
 * Created by kraynovdo on 01.11.2017.
 */
define('Controls-demo/Layouts/SearchLayout', [
   'Core/Control',
   'tmpl!Controls-demo/Layouts/SearchLayout/SearchLayout',
   'WS.Data/Source/Memory',
   'Controls/Container/Filter/Button',
   'Controls/List',
   'css!Controls-demo/Layouts/SearchLayout/SearchLayout',
   'Controls/Input/Text',
   'Controls-demo/Layouts/LayoutFilterComponent',
   'Controls/Container/Filter',
   'Controls/Container/Search',
   'Controls/Filter/Button',
   'Controls-demo/Layouts/SearchLayout/FilterButtonTemplate/FilterButtonTemplate',
   'Controls/Container/Input/Search'
], function (BaseControl,
             template,
             MemorySource
) {
   'use strict';
   
   var sourceData = [
      { id: 1, firstName: 'Sasha', lastName: 'aaaa' },
      { id: 2, firstName: 'Dmitry', lastName: 'aaaa' },
      { id: 3, firstName: 'Andrey', lastName: 'aaaa' },
      { id: 4, firstName: 'Aleksey', lastName: 'aaaa' },
      { id: 5, firstName: 'Sasha', lastName: 'aaaa' },
      { id: 6, firstName: 'Ivan', lastName: 'Lalala'},
      { id: 7, firstName: 'Petr', lastName: 'dfsf'},
      { id: 8, firstName: 'Roman', lastName: 'dfsf'},
      { id: 9, firstName: 'Maxim', lastName: 'dfsf'},
      { id: 10, firstName: 'Andrey', lastName: 'Lalala'},
      { id: 12, firstName: 'Sasha', lastName: 'dfsf'},
      { id: 13, firstName: 'Sasha', lastName: 'dfsf'},
      { id: 14, firstName: 'Sasha', lastName: 'dfsf'},
      { id: 15, firstName: 'Sasha', lastName: 'dfsf'},
      { id: 16, firstName: 'Sasha', lastName: 'Lalala'},
      { id: 17, firstName: 'Sasha', lastName: 'dfsf'},
      { id: 18, firstName: 'Dmitry', lastName: 'Lalala'},
      { id: 19, firstName: 'Andrey', lastName: 'dfsf'},
      { id: 20, firstName: 'Aleksey', lastName: 'dfsf'},
      { id: 21, firstName: 'Sasha', lastName: 'dfsf'},
      { id: 22, firstName: 'Ivan', lastName: 'dfsf'},
      { id: 23, firstName: 'Petr', lastName: 'dfgdfg' }
   ];

   var filterData = [
      {
         id: 'firstName',
         resetValue: 'По имени',
         properties: {
            keyProperty: 'title',
            displayProperty: 'title',
            source: {
               module: 'WS.Data/Source/Memory',
               options: {
                  data: [
                     {id: 0, title: 'По имени'},
                     {id: 1, title: 'Sasha'},
                     {id: 2, title: 'Petr'},
                     {id: 3, title: 'Ivan'},
                     {id: 3, title: 'Andrey'}
                  ]
               }
            }
         }
      },
      {
         id: 'id',
         resetValue: '0',
         properties: {
            keyProperty: 'id',
            displayProperty: 'title',
            source: {
               module: 'WS.Data/Source/Memory',
               options: {
                  data: [
                     {id: 0, title: 'По id'},
                     {id: 1, title: '1'},
                     {id: 2, title: '2'},
                     {id: 3, title: '3'},
                     {id: 4, title: '4'}
                  ]
               }
            }
         }
      },
      {
         id: 'lastName',
         resetValue: '0',
         value: 'aaaa',
         properties: {
            keyProperty: 'lastName',
            displayProperty: 'title',
            source: {
               module: 'WS.Data/Source/Memory',
               options: {
                  data: [
                     {id: 1, title: 'aaaa', lastName: 'aaaa'},
                     {id: 2, title: 'dfsf', lastName: 'dfsf'},
                     {id: 3, title: 'Такой нет', lastName: 'aaaaa'},
                     {id: 4, title: 'Lalala', lastName: 'Lalala'},
                     {id: 0, title: 'По фамилии', lastName: '0'}
                  ]
               }
            }
         }
      }
   ];


   var filterSourceData = [
      {id: 'title', resetValue: '', value: '', textValue: ''},
      {id: 'id', resetValue: null, value: null, textValue: ''}
   ];

   var ModuleClass = BaseControl.extend(
      {
         _template: template,
         _dataSource: new MemorySource({
            idProperty: 'id',
            data: sourceData
         }),
         _filterSource: filterSourceData,
         _switchValue: false,

         _fastFilterSource: new MemorySource({
            idProperty: 'id',
            data: filterData
         }),
         _filterData: filterData
      });
   return ModuleClass;
});