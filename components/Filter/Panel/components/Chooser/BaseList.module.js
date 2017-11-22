define('js!SBIS3.CONTROLS.FilterPanelChooser.BaseList', [
   'js!SBIS3.CONTROLS.FilterPanelChooser.Base',
   'Core/core-clone',
   'Core/core-merge',
   'tmpl!SBIS3.CONTROLS.FilterPanelChooser.BaseList/Base/resources/ItemTpl',
   'tmpl!SBIS3.CONTROLS.FilterPanelChooser.BaseList/Base/resources/FilterPanelChooserBaseList',
   'js!SBIS3.CONTROLS.ListView',
   'css!SBIS3.CONTROLS.FilterPanelChooser.BaseList/Base/FilterPanelChooser.BaseList'
], function(FilterPanelChooserBase, coreClone, coreMerge, itemTpl, chooserTpl) {
   'use strict';
   /**
    * Базовый класс редактора "Список".
    * Применяется для панели фильтрации (см. {@link SBIS3.CONTROLS.OperationsPanel/FilterPanelItem.typedef FilterPanelItem}).
    * <br/>
    * Реализует выборку идентификаторов из списка {@link SBIS3.CONTROLS.ListView}.
    * <br/>
    * @class SBIS3.CONTROLS.FilterPanelChooser.BaseList
    * @extends SBIS3.CONTROLS.FilterPanelChooser.Base
    * @author Сухоручкин Андрей Сергеевич
    * @public
    *
    * @demo SBIS3.CONTROLS.Demo.MyFilterView
    */

   var FilterPanelChooserBaseList = FilterPanelChooserBase.extend( /** @lends SBIS3.CONTROLS.FilterPanelChooser.BaseList.prototype */ {
      $protected: {
         _options: {
            chooserTemplate: chooserTpl
         },
         _listView: undefined
      },

      init: function() {
         var
            listView;
         FilterPanelChooserBaseList.superclass.init.apply(this, arguments);
         listView = this._getListView();
         listView._checkClickByTap = false;
         listView.subscribe('onItemClick', this._elemClickHandler.bind(this));
      },

      _modifyOptions: function() {
         var
            opts = FilterPanelChooserBaseList.superclass._modifyOptions.apply(this, arguments);
         opts._preparedProperties = coreMerge(opts.properties, this._prepareProperties(opts));
         return opts;
      },

      _prepareProperties: function(opts) {
         return {
            name: 'controls-FilterPanelChooser__ListView',
            className: 'controls-ListView__withoutMarker' + (opts._listClassName ? ' ' + opts._listClassName : ''),
            showHead: false,
            multiselect: true,
            itemsDragNDrop: false,
            selectedKeys: opts.value || [],
            itemContentTpl: itemTpl,
            itemsActions: []
         };
      },

      setValue: function(value) {
         this._setValue(value);
         this._updateView(value);
      },

      /*Определяем приватный _setValue, который зовёт setValue суперкласса (который меняет только данные), т.к. к изменению
       данных может приводить изменение визуального состояния, и в таком случае если звать setValue суперкласса
       мы заново будем проставлять визуальное состояние, которое уже находится в правильном состояние*/
      _setValue: function(value) {
         FilterPanelChooserBaseList.superclass.setValue.apply(this, arguments);
      },

      _updateView: function(value) {
         this._getListView().setSelectedKeys(value);
      },

      _updateTextValue: function() {
         this.setTextValue(this._getListView().getTextValue());
      },

      _elemClickHandler: function(e, id) {
         this._getListView().toggleItemsSelection([id]);
         this._updateValue();
         e.setResult(false);
      },

      _updateValue: function() {
         this._setValue(coreClone(this._getListView().getSelectedKeys()));
      },

      _getListView: function() {
         if (!this._listView) {
            this._listView = this.getChildControlByName('controls-FilterPanelChooser__ListView');
         }
         return this._listView;
      }
   });
   return FilterPanelChooserBaseList;

});
