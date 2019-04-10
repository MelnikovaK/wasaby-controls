define('Controls-demo/Suggest/resources/SuggestTabTemplate', [
   'Core/Control',
   'wml!Controls-demo/Suggest/resources/SuggestTabTemplate',
   'Types/source',
   'Controls/list'
], function(Control, template, sourceLib) {
   
   'use strict';
   
   var tabSourceData = [
      { id: 1, title: 'Сотрудники', text: 'test', align: 'left' },
      { id: 2, title: 'Контрагенты', text: 'test', align: 'left' }
   ];
   
   return Control.extend({
      _template: template,
      _tabsSelectedKey: null,
      
      _beforeMount: function() {
            this._tabsOptions = {
               source: new sourceLib.Memory({
                  idProperty: 'id',
                  data: tabSourceData
               }),
               keyProperty: 'id',
               displayProperty: 'title'
            };
      }
   });
});