define('Controls/List/ItemActions/ItemActionsControl', [
   'Core/Control',
   'wml!Controls/List/ItemActions/ItemActionsControl',
   'Controls/Utils/Toolbar',
   'Controls/List/ItemActions/Utils/Actions',
   'Controls/Constants',
   'Controls/Context/TouchContextField',
   'Controls/List/ItemActions/Utils/getStyle',
   'css!theme?Controls/List/ItemActions/ItemActionsControl'
], function(
   Control,
   template,
   tUtil,
   aUtil,
   ControlsConstants,
   TouchContextField,
   getStyle
) {
   'use strict';

   var
      ACTION_ICON_CLASS = 'controls-itemActionsV__action_icon  icon-size';

   var _private = {

      sortActions: function(first, second) {
         return (second.showType || 0) - (first.showType || 0);
      },

      fillItemAllActions: function(item, itemActions, itemActionVisibilityCallback) {
         var actions = [];
         itemActions.forEach(function(action) {
            if (!itemActionVisibilityCallback || itemActionVisibilityCallback(action, item)) {
               if (action.icon && !~action.icon.indexOf(ACTION_ICON_CLASS)) {
                  action.icon += ' ' + ACTION_ICON_CLASS;
               }
               action.style = getStyle(action.style, 'ItemActions');
               action.iconStyle = getStyle(action.iconStyle, 'ItemActions');
               actions.push(action);
            }
         });
         return actions;
      },

      updateItemActions: function(self, item, options, isTouch) {
         var
            all = _private.fillItemAllActions(item, options.itemActions, options.itemActionVisibilityCallback),

            showed = options.itemActionsPosition === 'outside'
               ? all
               : all.filter(function(action) {
                  return action.showType === tUtil.showType.TOOLBAR || action.showType === tUtil.showType.MENU_TOOLBAR;
               });

         if (isTouch) {
            showed.sort(_private.sortActions);
         }

         if (_private.needActionsMenu(all, options.itemActionsPosition)) {
            showed.push({
               icon: 'icon-ExpandDown icon-primary ' + ACTION_ICON_CLASS,
               isMenu: true
            });
         }

         options.listModel.setItemActions(item, {
            all: all,
            showed: showed
         });
      },

      updateActions: function(self, options, isTouch) {
         if (options.itemActions) {
            for (options.listModel.reset(); options.listModel.isEnd(); options.listModel.goToNext()) {
               var
                  itemData = options.listModel.getCurrent(),
                  item = itemData.item;
               if (item !== ControlsConstants.view.hiddenGroup && item.get) {
                  _private.updateItemActions(self, item, options, isTouch);
               }
            }
         }
      },

      updateModel: function(self, newOptions, isTouch) {
         _private.updateActions(self, newOptions, isTouch);
         newOptions.listModel.subscribe('onListChange', function() {
            /**
             * TODO: isTouch здесь используется только ради сортировки в свайпе. В .210 спилю все эти костыли по задаче, т.к. по новому стандарту порядок операций над записью всегда одинаковый:
             * https://online.sbis.ru/opendoc.html?guid=eaeca195-74e3-4b01-8d34-88f218b22577
             */
            var isTouchValue = false;
            if (self._context && self._context.isTouch) {
               isTouchValue = self._context.isTouch.isTouch;
            }
            _private.updateActions(self, self._options, isTouchValue);
         });
      },

      needActionsMenu: function(actions, itemActionsPosition) {
         var
            main = 0,
            additional = 0;
         actions && actions.forEach(function(action) {
            if (action.showType === tUtil.showType.MENU_TOOLBAR) {
               main++;
            }
            if (action.showType === tUtil.showType.TOOLBAR) {
               additional++;
            }
         });

         return actions && (additional + main !== actions.length) && itemActionsPosition !== 'outside';
      }
   };

   var ItemActionsControl = Control.extend({

      _template: template,

      _beforeMount: function(newOptions, context) {
         if (typeof window === 'undefined') {
            this.serverSide = true;
            return;
         }

         /**
          * TODO: isTouch здесь используется только ради сортировки в свайпе. В .210 спилю все эти костыли по задаче, т.к. по новому стандарту порядок операций над записью всегда одинаковый:
          * https://online.sbis.ru/opendoc.html?guid=eaeca195-74e3-4b01-8d34-88f218b22577
          */
         var isTouch = false;
         if (context && context.isTouch) {
            isTouch = context.isTouch.isTouch;
         }
         if (newOptions.listModel) {
            _private.updateModel(this, newOptions, isTouch);
         }
      },

      _beforeUpdate: function(newOptions, context) {
         /**
          * TODO: isTouch здесь используется только ради сортировки в свайпе. В .210 спилю все эти костыли по задаче, т.к. по новому стандарту порядок операций над записью всегда одинаковый:
          * https://online.sbis.ru/opendoc.html?guid=eaeca195-74e3-4b01-8d34-88f218b22577
          */
         var isTouch = false;
         if (context && context.isTouch) {
            isTouch = context.isTouch.isTouch;
         }
         var args = [this, newOptions, isTouch];

         if (
            this._options.listModel !== newOptions.listModel ||
            this._options.itemActions !== newOptions.itemActions ||
            this._options.itemActionVisibilityCallback !== newOptions.itemActionVisibilityCallback ||
            this._options.toolbarVisibility !== newOptions.toolbarVisibility ||
            this._options.itemActionsPosition !== newOptions.itemActionsPosition
         ) {
            _private.updateModel.apply(null, args);
         }
      },

      _onItemActionsClick: function(event, action, itemData) {
         aUtil.itemActionsClick(this, event, action, itemData);
      },

      _applyEdit: function(item) {
         this._notify('commitActionClick', [item]);
      },

      _cancelEdit: function(item) {
         this._notify('cancelActionClick', [item]);
      },

      updateItemActions: function(item) {
         /**
          * TODO: isTouch здесь используется только ради сортировки в свайпе. В .210 спилю все эти костыли по задаче, т.к. по новому стандарту порядок операций над записью всегда одинаковый:
          * https://online.sbis.ru/opendoc.html?guid=eaeca195-74e3-4b01-8d34-88f218b22577
          */
         var isTouch = false;
         if (this._context && this._context.isTouch) {
            isTouch = this._context.isTouch.isTouch;
         }
         _private.updateItemActions(this, item, this._options, isTouch);
      }
   });

   ItemActionsControl.getDefaultOptions = function() {
      return {
         itemActionsPosition: 'inside',
         itemActions: []
      };
   };

   ItemActionsControl.contextTypes = function contextTypes() {
      return {
         isTouch: TouchContextField
      };
   };

   return ItemActionsControl;
});
