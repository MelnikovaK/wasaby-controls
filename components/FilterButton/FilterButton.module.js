/**
 * Created by as.suhoruchkin on 07.04.2015.
 */
define('js!SBIS3.CONTROLS.FilterButton', [
   'js!SBIS3.CORE.CompoundControl',
   'html!SBIS3.CONTROLS.FilterButton',
   'html!SBIS3.CONTROLS.FilterButton/resources/demoFilterButtonTemplate',
   'js!SBIS3.CONTROLS.PickerMixin',
   'js!SBIS3.CONTROLS.Link',
   'js!SBIS3.CONTROLS.Button'
], function(CompoundControl, dotTplFn, demoTpl, PickerMixin) {

   var FilterButton = CompoundControl.extend([PickerMixin],{
      _dotTplFn: dotTplFn,

      $protected: {
         _options: {
            template: demoTpl()
         },
         _buttons: undefined,
         _filterLine: undefined,
         _clearFilterButton: undefined,
         _applyFilterButton: undefined

      },
      init: function() {
         FilterButton.superclass.init.apply(this, arguments);
         this._buttons._filterLine = this.getChildControlByName('filterLine');
         this._buttons._clearFilterButton = this.getChildControlByName('clearFilterButton');
         this._buttons._applyFilterButton = this.getChildControlByName('applyFilterButton');
         this._bindButtons();
         this._applyFilter();
      },
      $constructor: function() {
         this._buttons = {
            closedButton: this._container.find('.controls__filter-button__closed'),
            openedButton: this._container.find('.controls__filter-button__opened'),
            clearLineButton: this._container.find('.controls__filter-button__clear')
         };
      },
      _bindButtons: function() {
         var self = this._buttons;
         self.closedButton.bind('click', this.showPicker.bind(this));
         self.openedButton.bind('click', this.hidePicker.bind(this));
         self.clearLineButton.bind('click', this.resetFilter.bind(this));
         self._applyFilterButton.subscribe('onActivated', this._applyFilter.bind(this));
         self._clearFilterButton.subscribe('onActivated', this.resetFilter.bind(this));
         self._filterLine.subscribe('onActivated', this.showPicker.bind(this));
      },
      _setPickerContent: function() {
         var wrapper = this._container.find('.controls__filter-button__wrapper');
         this._picker.getContainer().append(wrapper.removeClass('ws-hidden'));
      },
      _setPickerConfig: function () {
         return {
            corner: 'tr',
            target: this,
            horizontalAlign: {
               side: 'right'
            }
         };
      },
      _applyFilter: function() {
         var filter = this._pickFilter();
         this.hidePicker();
         this.applyFilter(filter);
      },
      applyFilter: function(filter) {
         console.log(filter);

         this._updateFilterButtonView(filter);
      },
      _pickFilter: function() {
         var filter = { isNotDefault: true };
         return filter;
      },
      resetFilter: function() {
         this.applyFilter({});
      },
      _updateFilterButtonView: function(filter) {
         var isDefault = this._isDefaultFilter(filter);
         this._container.toggleClass('controls__filter-button__default-filter', isDefault);
         this._buttons._clearFilterButton.setEnabled(!isDefault);
         this._setFilterLine(filter, isDefault);
      },
      _setFilterLine: function(filter, isDefault) {
         var filterLine = isDefault ? 'Нужно отобрать?' : 'Применён какой-то фильтр';
         this._buttons._filterLine.setCaption(filterLine);
      },
      _isDefaultFilter: function(filter) {
         return !filter.isNotDefault;
      }
   });

   return FilterButton;

});