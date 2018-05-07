/**
 * Created by am.gerasimov on 21.02.2018.
 */
define('Controls/Filter/Button',
   [
      'Core/Control',
      'tmpl!Controls/Filter/Button/Button',
      'Core/moduleStubs',
      'WS.Data/Chain',
      'WS.Data/Utils',
      'css!Controls/Filter/Button/Button'
   ],
   
   function(Control, template, moduleStubs, Chain, Utils) {
      
      /**
       * @class Controls/Filter/Button
       * @extends Core/Control
       * @mixin Controls/Filter/Button/interface/IFilterPanel
       * @control
       * @public
       */

      'use strict';

      var _private = {
         getFilterButtonCompatible: function(self) {
            return moduleStubs.require('Controls/Filter/Button/_FilterCompatible').addCallback(function(_FilterCompatible) {
               if (!self._filterCompatible) {
                  self._filterCompatible = new _FilterCompatible[0]({
                     filterButton: self,
                     filterButtonOptions: self._options
                  });
               }
               return self._filterCompatible;
            });
         },

         getText: function(items) {
            var textArr = [];

            Chain(items).each(function(item) {
               var textValue = Utils.getItemPropertyValue(item, 'textValue');

               if (textValue) {
                  textArr.push(textValue);
               }
            });

            return textArr.join(', ');
         },

         resolveItems: function(self, items) {
            self._items = items;
            self._text = _private.getText(items);
         }
      };

      var FilterButton = Control.extend({

         _template: template,
         _oldPanelOpener: null,
         _text: '',

         constructor: function(config) {
            FilterButton.superclass.constructor.apply(this, arguments);
            this._onFilterChanged = this._onFilterChanged.bind(this);
         },

         _beforeUpdate: function(options) {
            if (this._options.items !== options.items) {
               _private.resolveItems(this, options.items);
            }
         },

         _beforeMount: function(options) {
            if (options.items) {
               _private.resolveItems(this, options.items);
            }
         },

         _getFilterState: function() {
            return this._options.readOnly ? 'disabled' : 'default';
         },

         _clearClick: function() {
            _private.getFilterButtonCompatible(this).addCallback(function(panelOpener) {
               panelOpener.clearFilter();
            });
         },

         _openFilterPanel: function() {
            if (!this._options.readOnly) {
               /* if template - show old component */
               if (this._options.filterTemplate) {
                  _private.getFilterButtonCompatible(this).addCallback(function(panelOpener) {
                     panelOpener.showFilterPanel();
                  });
               } else {
                  this._children.filterStickyOpener.open({
                     templateOptions: {
                        items: this._options.items,
                        itemTemplate: this._options.itemTemplate,
                        additionalTemplate: this._options.additionalTemplate
                     },
                     template: 'Controls/Filter/Button/Panel',
                     target: this._children.panelTarget
                  });
               }
            }
         },

         _onFilterChanged: function(filter) {
            this._notify('filterChanged', [filter]);
         }
      });

      FilterButton.getDefaultOptions = function() {
         return {
            filterAlign: 'right'
         };
      };

      return FilterButton;
   });
