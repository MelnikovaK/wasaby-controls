/**
 * Created by am.gerasimov on 10.12.2015.
 */
define('js!SBIS3.CONTROLS.FilterHistory',
    [
   "Core/CommandDispatcher",
   "js!SBIS3.CORE.CompoundControl",
   "html!SBIS3.CONTROLS.FilterHistory",
   "html!SBIS3.CONTROLS.FilterHistory/historyItemTpl",
   "html!SBIS3.CONTROLS.FilterHistory/historyItemContentTpl",
   "js!SBIS3.CONTROLS.CommandsSeparator",
   "js!SBIS3.CONTROLS.ListView",
   "i18n!SBIS3.CONTROLS.FilterButton"
],
    function( CommandDispatcher,CompoundControl, dotTpl) {

   'use strict';

    var MAX_MINIMIZE_HISTORY_ITEMS = 5;

   /**
    * Контрол, отображающий историю фильтров в кнопке фильтров
    * @class SBIS3.CONTROLS.FilterHistory
    * @extends $ws.proto.CompoundControl
    */

   var FilterHistory = CompoundControl.extend([], /** @lends SBIS3.CONTROLS.FilterHistory.prototype*/ {
      _dotTplFn : dotTpl,
      $protected: {
         _options: {
         },
         _historyView: undefined,
         _historyController: undefined,
         _toggleHistoryButton: undefined
      },

      $constructor: function() {
         this._container.removeClass('ws-area');
         CommandDispatcher.declareCommand(this, 'toggleHistory', this.toggleHistoryBlock);
      },

      init: function() {
         FilterHistory.superclass.init.apply(this, arguments);

         this._historyView = this.getChildControlByName('historyView');
         this._toggleHistoryButton = this.getChildControlByName('toggleHistory');

         /* Проинициализируем список: подпишемся на события, проставим операции над записью */
         this._initHistoryView();
      },

      /**
       * Устанавливает контроллер для работы с историей
       * @param {SBIS3.CONTROLS.FilterHistoryController} controller
       */
      setHistoryController: function(controller) {
         this._historyController = controller;
         this.updateHistoryViewItems();
      },

      _initHistoryView: function() {
         var self = this;

         /* Установка операции отметки записи маркером */
         self._historyView.setItemsActions([{
            name: 'pin',
            icon: 'icon-16 icon-Pin',
            tooltip: 'Отметить',
            isMainAction: true,
            onActivated: function(target, key) {
               self._historyController.toggleMarkFilter(key);
               self.updateHistoryViewItems();
            }
         }]);

         /* При клике по строке списка фильтров - применим фильтр из истории */
         self.subscribeTo(self._historyView,'onItemActivate', function(e, itemObj) {
            self._historyController.activateFilterByKey(itemObj.id);
         });

         self.subscribeTo(self._historyView, 'onDrawItems', function(e) {
            var dsCount = self._historyView.getItems().getCount();

            /* Если записей в истории нет - скроем историю */
            self._container.toggleClass('ws-hidden', !dsCount);
            /* Если записей < 3, то выключим кнопку разворота истории */
            self._toggleHistoryButton[dsCount > MAX_MINIMIZE_HISTORY_ITEMS ? 'show' : 'hide']();
         });
      },

      /**
       * Обновляет список истории
       */
      updateHistoryViewItems: function() {
         if(this._historyController) {
            this._historyView.setItems(this._historyController.getHistory() || []);
         }
      },

      /**
       * Сворачивает/разворачивает блок с историей
       * @param {Boolean} closed
       * @private
       */
      toggleHistoryBlock: function(closed) {
         var isBooleanArg = typeof closed === 'boolean';

         this._container.find('.controls-filterButton__footerAreas-wrapper')
                        .toggleClass('controls-filterButton__footerAreas-maxHeight', isBooleanArg ? closed : undefined);

         if(isBooleanArg) {
            this._toggleHistoryButton.setChecked(!closed);
         }

         this._notifyOnSizeChanged(this, this);
      },

      /**
       * Обработчик на смену выделенного элемента, меняет состояние маркера
       * @private
       */
      _onChangeHoverHistoryItem: function(event, item) {
         if(!item.record) return;

         var actions = this.getItemsActions().getItemsInstances(),
             isMarked = item.record.get('isMarked');

         for(var action in actions) {
            if(actions.hasOwnProperty(action)) {
               actions[action].getContainer().toggleClass('icon-primary', isMarked)
                                             .toggleClass('icon-disabled',!isMarked);
            }
         }
      }
   });

   return FilterHistory;

});