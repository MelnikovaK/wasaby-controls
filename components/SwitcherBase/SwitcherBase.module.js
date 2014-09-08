/**
 * Модуль 'Компонент кнопка'.
 *
 * @description
 */
define('js!SBIS3.CONTROLS.SwitcherBase', ['js!SBIS3.CORE.Control'], function(Control) {

   'use strict';

   /**
    * Контрол переключатель. Переключатель - это особый контрол, который наследуется прямо от базового класса.
    * Во-первых, это не кнопка и не чекбокс, т.к. переключатель имеет два текстовых обозначения, и два различных состояния (кнопка - только caption).
    * Во-вторых это не группа радиобаттонов, т.к. в группе динамический набор сущностей, количеством и содержимым которых можно управлять, а в переключателе всегда две, строго определенных.
    * Данный класс поведенческий.
    * @class SBIS3.CONTROLS.SwitcherBase
    * @extends SBIS3.CORE.Control
    */

   var SwitcherBase = Control.Control.extend( /** @lends SBIS3.CONTROLS.SwitcherBase.prototype */ {
      $protected: {
         _options: {
            /**
             * @typedef {Object} StateEnum
             * @variant on Включен
             * @variant off Выключен
             */
            /**
             * @cfg {StateEnum} Состояние по умолчанию (on/off)
             */
            state: 'off',
            /**
             * @cfg {String} Текст+ при включенном состоянии
             */
            stateOn: '',
            /**
             * @cfg {String} Текст при выключенном состоянии
             */
            stateOff: ''
         }
      },

      $constructor: function() {

      },
      /**
       * Устанавливает состояние (on/off)
       * @param {String} state
       */
      setState: function(state) {
         if (state == 'on' || state == 'off'){
            this._options.state = state;
         } else {
            this._options.state = 'off';
         }
      },
      /**
       * Получить состояние
       */
      getState: function() {
         return this._options.state;
      }

   });

   return SwitcherBase;

});