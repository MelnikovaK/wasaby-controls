/* global define */
define('js!SBIS3.CONTROLS.Data.MoveStrategy.IMoveStrategy', [], function () {
   'use strict';

   /**
    * Интерфейс стратегии перемещения записей
    * @mixin SBIS3.CONTROLS.Data.MoveStrategy.IMoveStrategy
    * @public
    * @author Ганшин Ярослав
    */

   return /** @lends SBIS3.CONTROLS.Data.MoveStrategy.IMoveStrategy.prototype */{

      /**
       * Перемещение, смена порядка.
       * @param {SBIS3.CONTROLS.Data.Model} from - Перемещаемая запись
       * @param {SBIS3.CONTROLS.Data.Model} to - запись к которой надо преместить
       * @param {Boolean} after - Если true - вставить после записи, указанной в to. Если false - перед записью, указанной в to.
       * @returns {$ws.proto.Deferred|Boolean} Контрол использущий стратегию отрисовывает перемещение если вернули deferred либо true если вернули false ничего не произойдет.
       */
      move: function (from, to, after) {
         throw new Error('Method must be implemented');
      },
      /**
       * Перемещние по иерархии, смена родителя.
       * @param {SBIS3.CONTROLS.Data.Model} from - Перемещаемая запись
       * @param {SBIS3.CONTROLS.Data.Model} to - запись в которую надо преместить
       * @returns {$ws.proto.Deferred|Boolean} Контрол использущий стратегию отрисовывает перемещение если вернули deferred либо true если вернули false ничего не произойдет.
       */
      hierarhyMove: function (from, to) {
         throw new Error('Method must be implemented');
      }
   };
});
