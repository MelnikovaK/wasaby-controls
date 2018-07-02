define('Controls/Toolbar', [
   'Core/Control',
   'Controls/Controllers/SourceController',
   'tmpl!Controls/Toolbar/Toolbar',
   'tmpl!Controls/Toolbar/ToolbarItemTemplate',
   'WS.Data/Collection/Factory/RecordSet',
   'Controls/Utils/Toolbar',
   'Controls/Button',
   'css!Controls/Toolbar/Toolbar'
], function(Control, SourceController, template, toolbarItemTemplate, recordSetFactory, tUtil) {
   'use strict';

   /**
    * Toolbar.
    *
    * @class Controls/Toolbar
    * @extends Core/Control
    * @mixes Controls/Button/interface/ICaption
    * @mixes Controls/Button/interface/IClick
    * @mixes Controls/Button/interface/IIcon
    * @mixes Controls/interface/ITooltip
    * @mixes Controls/interface/ISource
    * @mixes Controls/List/interface/IHierarchy
    * @control
    * @public
    * @category Toolbar
    * @author Крайнов Д.
    * @demo Controls-demo/Toolbar/ToolbarVdom
    */

   /**
    * @name Controls/Button#size
    * @cfg {String} Size of the Toolbar.
    * @variant m Button has medium size.
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
            return items;
         });
      },

      getMenuItems: function(items) {
         return tUtil.getMenuItems(items).value(recordSetFactory, {
            adapter: items.getAdapter(),
            idProperty: items.getIdProperty()
         });
      },

      setPopupOptions: function(self, newOptions) {
         self._popupOptions = {
            corner: {vertical: 'top', horizontal: 'right'},
            horizontalAlign: {side: 'left'},
            onResult: self._onResult,
            templateOptions: {
               keyProperty: newOptions.keyProperty,
               parentProperty: newOptions.parentProperty,
               nodeProperty: newOptions.nodeProperty,
               iconSize: newOptions.size,
               showHeader: true,
               headConfig: {
                  menuStyle: 'cross'
               }
            }
         };
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
      _popupOptions: null,

      constructor: function(options) {
         this._onResult = this._onResult.bind(this);
         this._parentProperty = options.parentProperty;
         this._nodeProperty = options.nodeProperty;
         Toolbar.superclass.constructor.apply(this, arguments);
      },
      _beforeMount: function(options, context, receivedState) {
         _private.setPopupOptions(this, options);
         if (receivedState) {
            this._items = receivedState;
            this._menuItems = _private.getMenuItems(this._items);
            this._needShowMenu = this._menuItems && this._menuItems.getCount();
         } else {
            if (options.source) {
               return _private.loadItems(this, options.source);
            }
         }
      },
      _beforeUpdate: function(newOptions) {
         if (newOptions.keyProperty !== this._options.keyProperty ||
            this._options.parentProperty !== newOptions.parentProperty ||
            this._options.nodeProperty !== newOptions.nodeProperty ||
            this._options.iconSize !== newOptions.size) {
            _private.setPopupOptions(this, options);
         }
         if (newOptions.source && newOptions.source !== this._options.source) {
            _private.loadItems(this, newOptions.source).addCallback(function() {
               this._forceUpdate();
            }.bind(this));
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
               items: this._menuItems,
               iconSize: this._options.size
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

   Toolbar.getDefaultOptions = function() {
      return {
         size: 'm'
      };
   };

   Toolbar._private = _private;

   return Toolbar;
});
