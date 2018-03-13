define('Controls/Popup/Opener/InfoBox',
   [
      'Core/core-merge',
      'Core/core-clone',
      'tmpl!Controls/Popup/Opener/InfoBox/resources/content',
      'tmpl!Controls/Popup/Opener/InfoBox/resources/template',
      'Controls/Popup/Opener/Base',
      'Controls/Popup/Opener/InfoBox/Strategy',
      'css!Controls/Popup/Opener/InfoBox/InfoBox'
   ],
   function (cMerge, cClone, contentTpl, template, Base, Strategy) {
      'use strict';

      /**
       * Класс открытия всплывающей подсказки с расширенными возможностями
       * @class Controls/Popup/Opener/InfoBox
       * @extends Core/Control
       * @control
       * @public
       * @category Popup
       * @author Степин Павел Владимирович
       */

      /**
       * @typedef {Object} InfoBoxCfg
       * @property {String} message Сообщение, отображаемое в инфобоксе
       * @property {Style} style Горизонтальное выравнивание инфобокса
       * @property {Boolean} float Должно ли содержимое обтекать крестик закрытия
       * @property {Object} target Таргет, относительно которого неообходимо показать инфобокс
       * @property {Position} position Точка позиционировая инфобокса относительно таргета
       * @property {Function} template Шаблон отображения внутреннего содержимого
       */

      /**
       * @typedef {String} Style
       * @variant default
       * @variant lite
       * @variant help
       * @variant error
       */

      /**
       * @typedef {String} Position
       * @variant tl Всплывающее окно отображается сверху относительно точки построения, выравнивается по левому краю
       * @variant tc Всплывающее окно отображается сверху относительно точки построения, выравнивается по центру
       * @variant tr Всплывающее окно отображается сверху относительно точки построения, выравнивается по правому краю
       * @variant bl Всплывающее окно отображается снизу относительно точки построения, выравнивается по левому краю
       * @variant bc Всплывающее окно отображается снизу относительно точки построения, выравнивается по центру
       * @variant br Всплывающее окно отображается снизу относительно точки построения, выравнивается по правому краю
       * @variant rt Всплывающее окно отображается справа относительно точки построения, выравнивается по верхнему краю
       * @variant rc Всплывающее окно отображается справа относительно точки построения, выравнивается по центру
       * @variant rb Всплывающее окно отображается справа относительно точки построения, выравнивается по нижнему краю
       * @variant lt Всплывающее окно отображается слева относительно точки построения, выравнивается по верхнему краю
       * @variant lc Всплывающее окно отображается слева относительно точки построения, выравнивается по центру
       * @variant lb Всплывающее окно отображается слева относительно точки построения, выравнивается по нижнему краю
       */

      //Конфигурация инфобокса по умолчанию
      var DEFAULT_CONFIG = {
         position: 'tl',
         style: 'default',
         template: contentTpl,
         float: false
      };

      var InfoBox = Base.extend({

         /**
          * Открыть инфобокс
          * @function Controls/Popup/Opener/InfoBox#open
          * @param {InfoBoxCfg} cfg Объект с настройками инфобокса
          */
         open: function(cfg){

            // Если есть открытый инфобокс, закрываем
            if (this.isOpened()) {
               this.close();
            }

            cfg = cMerge(cClone(DEFAULT_CONFIG), cfg);

            return Base.prototype.open.call(this, {
               target: cfg.target,
               position: cfg.position,
               componentOptions: {
                  template: cfg.template,
                  message: cfg.message,
                  float: cfg.float
               },
               className: 'controls-InfoBox__popup controls-InfoBox-style-' + cfg.style,
               autoHide: true,
               template: template
            }, Strategy);
         }

      });

      return InfoBox;
   }
);