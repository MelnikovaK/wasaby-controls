/**
 * Created by as.suhoruchkin on 07.04.2015.
 */
define('js!SBIS3.CONTROLS.FilterView', [
   'js!SBIS3.CONTROLS.ListViewDS',
   'js!SBIS3.CONTROLS.PickerMixin',
   'html!SBIS3.CONTROLS.FilterView',
   'html!SBIS3.CONTROLS.FilterView/resources/FilterViewItemTemplate',
   'js!SBIS3.CONTROLS.Link',
   'js!SBIS3.CONTROLS.MenuLink',
   'js!SBIS3.CONTROLS.ComboBox',
   'js!SBIS3.CONTROLS.MenuButton'
], function(ListView, PickerMixin, dotTplFn, itemDotTpl) {
   var FilterButton = ListView.extend([PickerMixin], {
      $protected: {
         _dotTplFn: dotTplFn,
         _itemDotTpl: itemDotTpl,

         _options: {
            linkText: 'Другие фильтры',
            keyField: 'field'
         },
         _linkButton: undefined
      },
      $constructor: function() {
         this._publish('onClickLink');
         this._bindLinkButton();
      },
      _bindLinkButton: function() {
         var self = this;
         this.waitChildControlByName('FilterViewLink').addCallback(function(instanse){
            self._linkButton = instanse;
            self._linkButton.subscribe('onActivated', self._onLinkActivated.bind(self));
         });
      },
      _onLinkActivated: function() {
         this._notify('onClickLink');
      },
      _getItemTemplate: function () {
         return this._itemDotTpl;
      },
      _drawItemsCallback: function() {
         this._resetValues();
      },
      _resetValues: function() {
         /*TODO тут ввостановить значения контролов после перерисовки*/
      },
      deleteRecords: function(idArray) {
         /*TODO тут будет не удаление а скрытие видимости, когда появится перерисовка только одной строки*/
         this._dataSet.removeRecord(idArray);
         this._dataSource.sync(this._dataSet);
      }
   });

   return FilterButton;

});