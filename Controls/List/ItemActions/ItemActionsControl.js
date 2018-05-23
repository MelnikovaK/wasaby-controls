define('Controls/List/ItemActions/ItemActionsControl', [
   'Core/Control',
   'tmpl!Controls/List/ItemActions/ItemActionsControl',
   'Controls/Utils/Toolbar',
   'Controls/List/ItemActions/Utils/Actions',
   'css!Controls/List/ItemActions/ItemActions'
], function(
   Control,
   template,
   tUtil,
   aUtil
) {
   'use strict';

   var
      ACTION_ICON_CLASS = 'controls-itemActionsV__action_icon  icon-size';

   var _private = {

      sortActions: function(first, second) {
         return  (second.showType || 0) - (first.showType || 0);
      },

      fillItemAllActions: function(item, itemActions, itemActionVisibilityCallback) {
         var actions = [];
         itemActions.sort(_private.sortActions);
         itemActions.forEach(function(action) {
            if (!itemActionVisibilityCallback || itemActionVisibilityCallback(action, item)) {
               if (action.icon && !~action.icon.indexOf(ACTION_ICON_CLASS)) {
                  action.icon += ' ' + ACTION_ICON_CLASS;
                  if (~action.icon.indexOf('icon-done')) {
                     action.iconDone = true;
                  }
                  if (~action.icon.indexOf('icon-error')) {
                     action.iconError = true;
                  }
               }
               actions.push(action);
            }
         });
         return actions;
      },

      updateItemActions: function(item, options, isEditingItem, self) {
         var
            all = _private.fillItemAllActions(item, options.itemActions, options.itemActionVisibilityCallback),

            showed = options.itemActionsType === 'outside'
               ? all
               : all.filter(function(action) {
                  return action.showType === tUtil.showType.TOOLBAR || action.showType === tUtil.showType.MENU_TOOLBAR;
               });

         if (isEditingItem && options.showToolbar) {
            showed.push({
               icon: 'icon-Yes icon-done ' + ACTION_ICON_CLASS,
               style: 'bordered',
               iconDone: true,
               handler: function(item) {
                  this._applyEdit(item);
               }.bind(self)
            });
            showed.push({
               icon: 'icon-Close icon-primary ' + ACTION_ICON_CLASS,
               style: 'bordered',
               handler: function(item) {
                  this._cancelEdit(item);
               }.bind(self)
            });
         }

         if (_private.needActionsMenu(all, options.itemActionsType)) {
            showed.push({
               title: 'Еще',
               icon: 'icon-ExpandDown icon-primary ' + ACTION_ICON_CLASS,
               isMenu: true
            });
         }

         options.listModel.setItemActions(item, {
            all: all,
            showed: showed
         });
      },

      updateActions: function(options) {
         if (options.itemActions) {
            for (options.listModel.reset();  options.listModel.isEnd();  options.listModel.goToNext()) {
               var
                  item = options.listModel.getCurrent().item;
               _private.updateItemActions(item, options);
            }
         }
      },

      updateModel: function(newOptions) {
         _private.updateActions(newOptions);
         newOptions.listModel.subscribe('onListChange', function() {
            _private.updateActions(newOptions);
         });
      },

      needActionsMenu: function(actions, itemActionsType) {
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

         return actions && (additional + main !==  actions.length) && itemActionsType !== 'outside';
      }
   };

   var ItemActionsControl = Control.extend({

      _template: template,

      _beforeMount: function(newOptions) {
         if (newOptions.listModel) {
            _private.updateModel(newOptions);
         }
      },

      _beforeUpdate: function(newOptions) {
         if (newOptions.listModel && (this._options.listModel !== newOptions.listModel)) {
            _private.updateModel(newOptions);
         }

         if (newOptions.itemActions && (this._options.itemActions !== newOptions.itemActions)) {
            _private.updateActions(newOptions);
         }
      },

      _onActionClick: function(event, action, itemData) {
         aUtil.actionClick(this, event, action, itemData);
      },

      _applyEdit: function(item) {
         this._notify('commitActionClick', [item]);
      },

      _cancelEdit: function(item) {
         this._notify('cancelActionClick', [item]);
      },

      updateItemActions: function(item, isEditingItem) {
         _private.updateItemActions(item, this._options, isEditingItem, this);
      }
   });

   ItemActionsControl.getDefaultOptions = function() {
      return {
         itemActionsType: 'inside',
         itemActionVisibilityCallback: function() {
            return true;
         },
         itemActions: []
      };
   };

   return ItemActionsControl;
});
