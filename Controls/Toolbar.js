define('Controls/Toolbar', [
   'Core/Control',
   'Controls/Controllers/SourceController',
   'tmpl!Controls/Toolbar/Toolbar',
   'tmpl!Controls/Toolbar/ToolbarItemTemplate',
   'WS.Data/Collection/RecordSet',
   'WS.Data/Collection/Factory/RecordSet',
   'Controls/Utils/Toolbar',
   'css!Controls/Toolbar/Toolbar'
], function(Control, SourceController, template, toolbarItemTemplate, RecordSet, recordSetFactory, tUtil) {
   'use strict';

   /**
	* Toolbar
	* @namespace Controls
	* @public
	* @author Крайнов Д.
	*/

   /**
    * Toolbar
    * @class Controls/Toolbar
    * @extends Controls/Control
    * @mixes Controls/Button/interface/ICaption
    * @mixes Controls/Button/interface/IClick
    * @mixes Controls/Button/interface/IIcon
    * @mixes Controls/interface/ITooltip
    * @mixes Controls/interface/ISource
    * @control
    * @public
    * @category Toolbar
    */

   var _private = {
      loadItems: function(instance, source) {
         var self = this;

         instance._sourceController = new SourceController({
            source: source
         });
         return instance._sourceController.load().addCallback(function(items) {
            instance._items = items;
            instance._menuItems = self.getMenuItems(instance._items);
            instance._needShowMenu = instance._menuItems && instance._menuItems.getCount();
         });
      },

      getMenuItems: function(items) {
         return tUtil.getMenuItems(items).value(recordSetFactory, {
            adapter: items.getAdapter(),
            idProperty: items.getIdProperty()
         });
      }
   };

   var Toolbar = Control.extend({
      showType: tUtil.showType,
      _template: template,
      _defaultItemTemplate: toolbarItemTemplate,
      _needShowMenu: null,
      _menuItems: null,
      _parentProperty: null,
      _nodeProperty: null,
      _items: null,

      constructor: function(options) {
         this._onResult = this._onResult.bind(this);
         this._parentProperty = options.parentProperty;
         this._nodeProperty = options.nodeProperty;
         Toolbar.superclass.constructor.apply(this, arguments);
      },
      _beforeMount: function(options, context, receivedState) {
         if (receivedState) {
            this._items = receivedState;
         } else {
            if (options.source) {
               return _private.loadItems(this, options.source);
            }
         }
      },
      _beforeUpdate: function(newOptions) {
         if (newOptions.source && newOptions.source !== this._options.source) {
            return _private.loadItems(this, newOptions.source);
         }
         this._nodeProperty = newOptions.nodeProperty;
         this._parentProperty = newOptions.parentProperty;
      },
      _onItemClick: function(event, item) {
         var config;

         if (item.get(this._nodeProperty)) {
            config = {
               templateOptions: {
                  items: this._items,
                  rootKey: item.get(this._options.keyProperty)
               },
               target: event.target
            };
            this._children.menuOpener.open(config, this);
         }
         event.stopPropagation();
         this._notify('itemClick', [item]);
         item.handler && item.handler(item);
      },

      _showMenu: function() {
         var config = {
            templateOptions: {
               items: this._menuItems
            },
            target: this._children.popupTarget
         };
         this._children.menuOpener.open(config, this);
      },

      _onResult: function(result) {
         if (result.action === 'itemClick') {
            this._onItemClick(result.event, result.data[0]);
            this._children.menuOpener.close();
         }
      }
   });

   Toolbar._private = _private;

   return Toolbar;
});
