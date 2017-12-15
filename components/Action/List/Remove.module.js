/*global $ws, define*/
define('SBIS3.CONTROLS/Action/List/Remove', [
      'SBIS3.CONTROLS/Action',
      'SBIS3.CONTROLS/Action/List/Mixin/ListMixin',
      'Core/core-instance'
   ],
   function (ActionBase, ListMixin, cInstance) {
      'use strict';
      /**
       * Класс, описывающий действие удаления записей.
       * @class SBIS3.CONTROLS/Action/List/Remove
       * @public
       * @extends SBIS3.CONTROLS/Action
       * @mixes SBIS3.CONTROLS/Action/List/Mixin/ListMixin
       * @author Ганшин Ярослав Олегович
       * @example
       * Пример использования
       * <pre>
       *    var remove = new Remove({
       *       linkedObject : myListView
       *    });
       *    remove.execute();//удалит выделенные записи
       *
       *    remove.execute({items:[myListView.getItems().at(0)]});// удалит переданные записи
       * </pre>
       * @ignoreOptions validators independentContext contextRestriction extendedTooltip
       *
       * @ignoreMethods activateFirstControl activateLastControl addPendingOperation applyEmptyState applyState clearMark
       * @ignoreMethods changeControlTabIndex destroyChild detectNextActiveChildControl disableActiveCtrl findParent
       * @ignoreMethods focusCatch getActiveChildControl getChildControlById getChildControlByName getChildControls
       * @ignoreMethods getClassName getContext getEventBusOf getEventHandlers getEvents getExtendedTooltip getOpener
       * @ignoreMethods getImmediateChildControls getLinkedContext getNearestChildControlByName getOwner getOwnerId
       * @ignoreMethods getReadyDeferred getStateKey getTabindex getUserData getValue hasActiveChildControl hasChildControlByName
       * @ignoreMethods hasEventHandlers isActive isAllReady isDestroyed isMarked isReady makeOwnerName setOwner setSize
       * @ignoreMethods markControl moveFocus moveToTop once registerChildControl registerDefaultButton saveToContext
       * @ignoreMethods sendCommand setActive setChildActive setClassName setExtendedTooltip setOpener setStateKey activate
       * @ignoreMethods setTabindex setTooltip setUserData setValidators setValue storeActiveChild subscribe unregisterChildControl
       * @ignoreMethods unregisterDefaultButton unsubscribe validate waitAllPendingOperations waitChildControlById waitChildControlByName
       *
       * @ignoreEvents onActivate onAfterLoad onAfterShow onBeforeControlsLoad onBeforeLoad onBeforeShow onChange onClick
       * @ignoreEvents onFocusIn onFocusOut onKeyPressed onReady onResize onStateChanged onTooltipContentRequest
       */
      var Remove = ActionBase.extend([ListMixin], /** @lends SBIS3.CONTROLS/Action/List/Remove.prototype */{
         /**
          * @event onRemove Происходит перед удалением записей.
          * @param {Core/EventObject} eventObject Дескриптор события.
          * @param {Array} items Массив моделей, которые нужно удалить.
          * @see execute
          */
         $protected: {
            _options: {
               /**
                * @cfg {string|function} Текст отображаемый при удалении записей.
                * @example
                * <pre>
                *    new Remove({
                *       linkedObject : myListView,
                *       confirmText: 'Подтвердите удаление'
                *    })
                * </pre>
                * <pre>
                *    var getConfirmText = function(items){
                *       return items.length > 1 ? 'Удалить выбранные записи?' : 'Удалить текущую запись?';
                *    }
                *    new Remove({
                *       linkedObject : myListView,
                *       confirmText: getConfirmText
                *    })
                * </pre>
                */
               confirmText: undefined
            }
         },
         $constructor: function () {
            this._publish(['onRemove']);
         },
         _doExecute: function (meta) {
            var
               items,
               confirmText = this._options.confirmText || this._getDefaultConfirmText;
            if (meta.hasOwnProperty('items')) {
               items = Array.isArray(meta.items) ? meta.items : [meta.items];
            } else {
               items = this.getSelectedItems();
            }
            if (items) {
               if (typeof confirmText === 'function') {
                  confirmText = confirmText.call(this, items);
               }

               var
                  self = this,
                  def = new Deferred();

               require(['SBIS3.CONTROLS/Utils/InformationPopupManager'], function(InformationPopupManager){
                  InformationPopupManager.showConfirmDialog({
                     message: confirmText
                  }, function(){
                     def.callback(self._callHandlerMethod([items], 'onRemove', '_remove'));
                  }, function(){
                     def.callback(false);
                  });
               });

               return def;
            }
         },
         /**
          * Удаляет переданные записи
          * @param {Array} items
          * @returns {CORE/Deferred}
          * @private
          */
         _remove: function(items) {
            var  self = this,
               keys = [];
            for (var i = 0; i < items.length; i++) {
               keys.push(items[i].getId());
            }
            return this.getDataSource().destroy(keys).addCallback(function() {
               var list = self._getItems();
               for (var i = 0; i < items.length; i++) {
                  var item = items[i];
                  list.remove(item);
               }
               self._removeSelection(items);
            });
         },
         _handleError: function (error) {
            require(['SBIS3.CONTROLS/Utils/InformationPopupManager'], function(InformationPopupManager){
               InformationPopupManager.showMessageDialog({
                  message: error.message,
                  status: 'error'
               });
            });
         },
         _getDefaultConfirmText: function(items) {
            return items.length > 1 ? 'Удалить записи?' : 'Удалить текущую запись?';
         },

         _removeSelection: function(items) {
            var linkedObject = this.getLinkedObject();
            if (cInstance.instanceOfMixin(linkedObject, 'SBIS3.CONTROLS/Mixins/MultiSelectable')) {
               var ids = [];
               for (var i = 0; i < items.length; i++) {
                  ids.push(items[i].getId());
               }
               linkedObject.removeItemsSelection(ids);
            }
         }
      });
      return Remove;
   });