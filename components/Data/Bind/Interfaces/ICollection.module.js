/* global define */
define('js!SBIS3.CONTROLS.Data.Bind.ICollection', [], function () {
   'use strict';

   /**
    * Интерфейс привязки к коллекции
    * @mixin SBIS3.CONTROLS.Data.Bind.ICollection
    * @public
    * @author Мальцев Алексей
    */

   var ICollection = /** @lends SBIS3.CONTROLS.Data.Bind.ICollection.prototype */{
      /**
       * @typedef {String} ChangeAction
       * @variant a Добавлены элементы
       * @variant rm Удалены элементы
       * @variant rp Заменены элементы
       * @variant m Перемещены элементы
       * @variant rs Значительное изменение
       */

      /**
       * @event onCollectionChange После изменения коллекции
       * @param {$ws.proto.EventObject} event Дескриптор события.
       * @param {ChangeAction} action Действие, приведшее к изменению.
       * @param {Array} newItems Новые элементы коллеции.
       * @param {Number} newItemsIndex Индекс, в котором появились новые элементы.
       * @param {Array} oldItems Удаленные элементы коллекции.
       * @param {Integer} oldItemsIndex Индекс, в котором удалены элементы.
       * @example
       * <pre>
       *    list.subscribe('onCollectionChange', function(eventObject, action){
       *       if (action == ICollection.ACTION_REMOVE){
       *          //Do something
       *       }
       *    });
       * </pre>
       */

      /**
       * @event onCollectionItemChange После изменения элемента коллекции
       * @param {$ws.proto.EventObject} event Дескриптор события.
       * @param {*} item Измененный элемент коллекции.
       * @param {Number} index Индекс измененного элемента.
       * @param {Object.<String, *>} [properties] Изменившиеся свойства
       * @example
       * Отследим изменение свойства title:
       * <pre>
       *    list.subscribe('onCollectionItemChange', function(eventObject, item, index, properties){
       *       if ('title' in properties) {
       *          //Do something
       *       }
       *    });
       * </pre>
       */
   };

   /**
    * @const {String} Изменение коллекции: добавлены элементы
    */
   ICollection.ACTION_ADD = 'a';

   /**
    * @const {String} Изменение коллекции: удалены элементы
    */
   ICollection.ACTION_REMOVE = 'rm';

   /**
    * @const {String} Изменение коллекции: заменены элементы
    */
   ICollection.ACTION_REPLACE = 'rp';

   /**
    * @const {String} Изменение коллекции: перемещены элементы
    */
   ICollection.ACTION_MOVE = 'm';

   /**
    * @const {String} Изменение коллекции: значительное изменение
    */
   ICollection.ACTION_RESET = 'rs';

   return ICollection;
});
