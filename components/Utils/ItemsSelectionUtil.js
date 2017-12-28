/**
 * Created by am.gerasimov on 12.04.2017.
 */

/**
 * Утилита для работы компонентов с интерфейсами selectable / multiselectable и асинхронной загрузкой записей.
 */
define('SBIS3.CONTROLS/Utils/ItemsSelectionUtil', ['Core/core-instance', 'Core/detection'], function(cInstance, detection) {
   
   var delayedEvents = {
      onSelectedItemsChange: 'getSelectedItems'
   };
   
   
   function isEmpty(val) {
      return val === null || val === undefined;
   }
   
   function isEmptyItem(item, idProperty, displayProperty) {
      return isEmpty(item.get(displayProperty)) || isEmpty(item.get(idProperty));
   }
   
   function checkItemForSelect(newItem, currentItem, idProp, displayProp, isEmptySelection) {
      var isModel = cInstance.instanceOfModule(newItem, 'WS.Data/Entity/Model'),
          hasRequiredFields;
   
      if (isModel) {
         /* Проверяем запись на наличие ключевых полей */
         hasRequiredFields = !isEmptyItem(newItem, idProp, displayProp);
      
         if (hasRequiredFields) {
            /* Если запись собралась из контекста, в ней может не быть поля с первичным ключем */
            if (!newItem.getIdProperty()) {
               newItem.setIdProperty(idProp);
            }
            /* Если передали пустую запись и текущая запись тоже пустая, то не устанавливаем её */
         } else if(currentItem && isEmptyItem(currentItem, displayProp, idProp) && isEmptySelection) {
            return false;
         }
      }
      
      return hasRequiredFields || newItem === null || (!hasRequiredFields && !isEmptySelection && isModel);
   }
   
   /**
    * Задержка для событий onSelectedItemsChange, onSelectedItemChange - они стреляют по загрузке треубемых записей
    * @param notify
    * @param notifyArgs
    * @param instance
    * @returns {*}
    */
   function delayedNotify(notify, notifyArgs, instance) {
      var event = notifyArgs[0],
          args = [event].concat(Array.prototype.slice.call(notifyArgs, 1));
      
      if(delayedEvents.hasOwnProperty(event)) {
         instance[delayedEvents[event]](true).addCallback(function(result) {
            notify.apply(instance, args);
            return result;
         });
      } else {
         return notify.apply(instance, args);
      }
   }
   
   /**
    * Инициализация selectorAction'a, подписка на необходимые события, обработка этих событий
    * @param action
    * @param ctrl
    */
   function initSelectorAction(action, ctrl) {
      ctrl.subscribeTo(action, 'onExecuted', function(event, meta, result) {
         if(result) {
            ctrl.addSelectedItems(result);
            if (ctrl._options.historyId && result.at(0)) {
               ctrl._addItemToHistory(result.at(0));
            }
         }
         
         if(ctrl.isActive()) {
            /* Баг ipad, после изменения размеров input'a, курсор не меняет своё положение:
               http://openradar.appspot.com/18819624
               https://bugs.webkit.org/show_bug.cgi?id=138201 */
            if(detection.isMobileSafari) {
               window.getSelection().removeAllRanges();
            }
            ctrl.setActive(true);
         }
      });
   
      ctrl.subscribeTo(action, 'onExecute', function (event, meta) {
         //TODO нелогично называется событие - переименовать
         event.setResult(ctrl._notify('onChooserClick', meta));
      });
   }
   
   function onItemClickNotify(key, crtl) {
      crtl = crtl || this;
      crtl.getSelectedItems(false).each(function(item) {
         if(item.get(crtl.getProperty('idProperty')) == key) {
            crtl._notify('onItemActivate', {item: item, id: key});
         }
      });
   }
   
   function itemClickHandler(target, crossClickHandler, itemClickHandler) {
      var itemContainer, id;
      
      target = target instanceof jQuery ? target : $(target);
      itemContainer = target.closest('.js-controls-ListView__item', this.getContainer()[0]);
      
      if(itemContainer.length) {
         id = this._getItemProjectionByHash(itemContainer.data('hash')).getContents().get(this._options.idProperty);
      }
      
      if(target.hasClass('js-controls__item-cross')) {
         crossClickHandler(id);
      } else {
         itemClickHandler(id);
      }
   }
   
   
   return {
      isEmptyItem: isEmptyItem,
      checkItemForSelect: checkItemForSelect,
      delayedNotify: delayedNotify,
      initSelectorAction: initSelectorAction,
      onItemClickNotify: onItemClickNotify,
      clickHandler: itemClickHandler
   }
});