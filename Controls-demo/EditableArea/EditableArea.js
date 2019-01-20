define('Controls-demo/EditableArea/EditableArea', [
   'Core/Control',
   'wml!Controls-demo/EditableArea/EditableArea',
   'Types/entity',
   'Types/source',
   'wml!Controls-demo/EditableArea/resources/exampleTabTemplate',
   'wml!Controls-demo/EditableArea/resources/exampleTabTemplate2',

   'css!Controls-demo/EditableArea/EditableArea'
], function(
   Control,
   template,
   entity,
   source,
   exampleTabTemplate,
   exampleTabTemplate2
) {
   'use strict';
   var tabsData = [
         {
            id: 0,
            title: 'Поручение',
            align: 'left',
            number: '3565654',
            date: '09.01.17',
            itemTemplate: exampleTabTemplate
         },
         {
            id: 1,
            align: 'right',
            title: 'Лента событий'
         }
      ],
      tabsData2 = [
         {
            id: 0,
            align: 'left',
            name: 'Компания "Сбис плюс"',
            itemTemplate: exampleTabTemplate2
         }],
      toolbarItems = [
         {
            id: '1',
            icon: 'icon-Print',
            title: 'Распечатать',
            '@parent': false,
            parent: null,
            buttonViewMode: 'iconToolbar'
         },
         {
            id: '2',
            icon: 'icon-RelatedDocumentsDown',
            title: 'Связанные документы',
            '@parent': false,
            parent: null,
            buttonViewMode: 'iconToolbar'
         },
         {
            id: '3',
            icon: 'icon-Question2',
            title: 'Задать вопрос',
            '@parent': false,
            parent: null,
            buttonViewMode: 'iconToolbar'
         }
      ];

   var EditableArea = Control.extend({
      _template: template,
      _record: null,
      _selectedTab: 0,
      _selectedTab2: 0,
      _tabSource: null,

      _beforeMount: function() {
         this._record = new entity.Record({
            rawData: {
               id: 1,
               text1: 'Мой отдел'
            }
         });
         this._tabSource = new source.Memory({
            idProperty: 'id',
            data: tabsData
         });
         this._tabSource2 = new source.Memory({
            idProperty: 'id',
            data: tabsData2
         });
         this._toolbarSource = new source.Memory({
            idProperty: 'id',
            data: toolbarItems
         });
      }
   });
   return EditableArea;
});
