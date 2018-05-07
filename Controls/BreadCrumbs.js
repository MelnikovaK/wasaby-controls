define('Controls/BreadCrumbs', [
   'Core/Control',
   'WS.Data/Collection/RecordSet',
   'tmpl!Controls/BreadCrumbs/BreadCrumbs',
   'tmpl!Controls/BreadCrumbs/resources/itemTemplate',
   'tmpl!Controls/BreadCrumbs/resources/itemsTemplate',
   'tmpl!Controls/BreadCrumbsController/resources/menuItemTemplate',
   'tmpl!Controls/BreadCrumbsController/resources/menuContentTemplate',
   'css!Controls/BreadCrumbs/BreadCrumbs'
], function(
   Control,
   RecordSet,
   template,
   itemTemplate,
   itemsTemplate,
   menuItemTemplate
) {
   'use strict';

   /**
    * Breadcrumbs.
    *
    * @class Controls/BreadCrumbs
    * @extends Core/Control
    * @mixes Controls/interface/ISource
    * @mixes Controls/interface/IHighlighter
    * @control
    * @public
    */

   var BreadCrumbs = Control.extend({
      _template: template,
      _itemTemplate: itemTemplate,
      _itemsTemplate: itemsTemplate,

      _beforeMount: function() {
         //Эта функция передаётся по ссылке в Opener, так что нужно биндить this, чтобы не потерять его
         this._onResult = this._onResult.bind(this);
      },

      _onItemClick: function(e, itemData) {
         if (itemData.isDots) {
            //Оборачиваю айтемы в рекордсет чисто ради того, чтобы меню могло с ними работать
            //Нельзя сделать source, т.к. с ним оно не умеет работать
            //По этой задаче научится: https://online.sbis.ru/opendoc.html?guid=c46567a3-77ab-46b1-a8d2-aa29e0cdf9d0
            var rs = new RecordSet({
               rawData: this._options.items
            });
            rs.each(function(item, index) {
               item.set('indentation', index);
            });
            this._children.menuOpener.open({
               target: e.target,
               templateOptions: {
                  items: rs,
                  itemTemplate: menuItemTemplate
               }
            });
         } else {
            this._notify('itemClick', [itemData.item]);
         }
      },

      _onHomeClick: function() {
         this._notify('itemClick', [this._options.items[0]]);
      },

      _onResize: function() {
         this._children.menuOpener.close();
      },

      _onResult: function(args) {
         var actionName = args && args.action;

         //todo: Особая логика событий попапа, исправить как будут нормально приходить аргументы
         //https://online.sbis.ru/opendoc.html?guid=0ca4b2db-b359-4e7b-aac6-97e061b953bf
         if (actionName === 'itemClick') {
            var item = args.data && args.data[0] && args.data[0].getRawData();
            this._notify('itemClick', [item]);
         }
         this._children.menuOpener.close();
      }
   });

   return BreadCrumbs;
});
