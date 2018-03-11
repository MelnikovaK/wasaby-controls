/**
 * Created by am.gerasimov on 21.02.2018.
 */
define('Controls/Filter/Button/_FilterCompatible',
   [
      'Core/core-extend',
      'Core/moduleStubs',
      'SBIS3.CONTROLS/Filter/Button/Utils/FilterToStringUtil',
      'Controls/Filter/Button/OldPanelOpener'
   ],
   
   function(extend, moduleStubs, stringTransformer, OldPanelOpener) {
      
      /**
       * @class Controls/Layout/Search
       * @extends Controls/Control
       * @control
       * @public
       */
      
      'use strict';
      
      var _private = {
         
         notifyOnFilterChange: function(self, filter) {
            self._filterButton._notify('filterChanged', filter, {bubbling: true});
         },
         
         oldPanelChangeHandler: function(self) {
            self._filterButton._text = stringTransformer.string(self._oldPanelOpener.getFilterStructure(), 'itemTemplate');
            _private.notifyOnFilterChange(self, self._oldPanelOpener.getFilter());
            self._filterButton._forceUpdate();
         },
         
         getOldPanelConfig: function(self) {
            return {
               element: self._filterButton._container.querySelector('.controls-FilterButton__oldTemplate'),
               template: self._options.filterTemplate,
               filterStructure: self._options.items,
               filterAlign: self._options.filterAlign === 'left' ? 'right' : 'left'
            };
         },
         
         getOldPanelOpener: function(self) {
            if (!self._oldPanelOpener) {
               self._oldPanelOpener = new OldPanelOpener(_private.getOldPanelConfig(self));
               self._oldPanelOpener.subscribe('onApplyFilter', function() {
                  _private.oldPanelChangeHandler(self);
               });
               self._oldPanelOpener.subscribe('onResetFilter', function(event, internal) {
                  if (!internal) {
                     _private.oldPanelChangeHandler(self);
                  }
               });
            }
            return self._oldPanelOpener;
         }
         
      };
      
      var FilterCompatible = extend({
         
         _oldPanelOpener: null,
         _filterButton: null,
         
         constructor: function(options) {
            FilterCompatible.superclass.constructor.call(this, options);
            this._filterButton = options.filterButton;
            this._options = options.filterButtonOptions;
         },
         
         clearFilter: function() {
            _private.getOldPanelOpener(this).sendCommand('reset-filter');
         },
         
         showFilterPanel: function() {
            _private.getOldPanelOpener(this).showPicker();
         }
         
      });
      
      return FilterCompatible;
   });