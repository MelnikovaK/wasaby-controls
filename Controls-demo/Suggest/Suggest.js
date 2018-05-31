/**
 * Created by am.gerasimov on 13.04.2018.
 */
/**
 * Created by am.gerasimov on 13.12.2017.
 */
define('Controls-demo/Suggest/Suggest', [
   'Core/Control',
   'tmpl!Controls-demo/Suggest/Suggest',
   'WS.Data/Source/Memory',
   'Core/Deferred',
   'css!Controls-demo/Suggest/Suggest',
   'Controls/Input/Suggest',
   'Controls/List',
   'Controls/Container/List',
   'Controls/Tabs/Buttons'
], function(Control, template, MemorySource, Deferred) {
   
   'use strict';
   
   var sourceData = [
      { id: 1, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 2, title: 'Dmitry', text: 'test', currentTab: 1 },
      { id: 3, title: 'Andrey', text: 'test', currentTab: 1 },
      { id: 4, title: 'Aleksey', text: 'test', currentTab: 1 },
      { id: 5, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 6, title: 'Ivan', text: 'test', currentTab: 1 },
      { id: 7, title: 'Petr', text: 'test', currentTab: 1 },
      { id: 8, title: 'Roman', text: 'test', currentTab: 2 },
      { id: 9, title: 'Maxim', text: 'test', currentTab: 2 },
      { id: 10, title: 'Andrey', text: 'test', currentTab: 2 },
      { id: 12, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 13, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 14, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 15, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 16, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 17, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 18, title: 'Dmitry', text: 'test', currentTab: 1 },
      { id: 19, title: 'Andrey', text: 'test', currentTab: 1 },
      { id: 20, title: 'Aleksey', text: 'test',currentTab: 1 },
      { id: 21, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 22, title: 'Ivan', text: 'test', currentTab: 1 },
      { id: 23, title: 'Petr', text: 'test', currentTab: 1 },
      { id: 24, title: 'Roman', text: 'test', currentTab: 1 },
      { id: 25, title: 'Maxim', text: 'test', currentTab: 1 },
      { id: 26, title: 'Andrey', text: 'test', currentTab: 1 },
      { id: 27, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 28, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 29, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 30, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 31, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 32, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 33, title: 'Dmitry', text: 'test', currentTab: 1 },
      { id: 34, title: 'Andrey', text: 'test', currentTab: 1 },
      { id: 35, title: 'Aleksey', text: 'test', currentTab: 1 },
      { id: 36, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 37, title: 'Ivan', text: 'test', currentTab: 1 },
      { id: 38, title: 'Petr', text: 'test', currentTab: 1 },
      { id: 39, title: 'Roman', text: 'test', currentTab: 1 },
      { id: 40, title: 'Maxim', text: 'test', currentTab: 1 },
      { id: 41, title: 'Andrey', text: 'test', currentTab: 1 },
      { id: 42, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 43, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 44, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 45, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 46, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 47, title: 'Andrey', text: 'test', currentTab: 1 },
      { id: 48, title: 'Aleksey', text: 'test', currentTab: 1 },
      { id: 49, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 50, title: 'Ivan', text: 'test', currentTab: 1 },
      { id: 51, title: 'Petr', text: 'test', currentTab: 1 },
      { id: 52, title: 'Roman', text: 'test', currentTab: 1 },
      { id: 53, title: 'Maxim', text: 'test', currentTab: 1 },
      { id: 54, title: 'Andrey', text: 'test', currentTab: 1 },
      { id: 55, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 56, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 57, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 58, title: 'Sasha', text: 'test', currentTab: 1 },
      { id: 59, title: 'Sasha', text: 'test', currentTab: 2 }
   ];
   
   var tabSourceData = [
      { id: 0, title: 'Сотрудники', text: 'test' },
      { id: 1, title: 'Контрагенты', text: 'test' }
   ];
   
   var VDomSuggest = Control.extend({
      _template: template,
      _suggestValue: '',
      _suggest2Value: '',
      _tabsSelectedKey: 0,
      
      constructor: function() {
         VDomSuggest.superclass.constructor.apply(this, arguments);
         this._suggestTabSource = new MemorySource({
            idProperty: 'id',
            data: sourceData
         });
         this._suggestSource = new MemorySource({
            idProperty: 'id',
            data: sourceData
         });
         this._tabSource = new MemorySource({
            idProperty: 'id',
            data: tabSourceData
         });
         
         //Чтобы запрос был асинхронным.
         var origQuery = this._suggestSource.query;
         this._suggestTabSource.query = function() {
            var self = this,
               arg = arguments;
            var def = new Deferred();
            origQuery.apply(self, arg).addCallback(function(result) {
               Deferred.fromTimer(100).addCallback(function() {
                  var originAll = result.getAll;
                  
                  result.getAll = function() {
                    var items = originAll.call(result);
                    items.setMetaData({
                       tabs: [{id: 1, title: 'Вкладка'}, {id: 2, title: 'Вкладка2'}],
                       more: items.getMetaData().more,
                       currentTab: 1
                    });
                    return items;
                  };
                  def.callback(result);
               });
            });
            return def;
         };
      }
   });
   
   return VDomSuggest;
});