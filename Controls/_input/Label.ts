import Env = require('Env/Env');
import Control = require('Core/Control');
import entity = require('Types/entity');
import template = require('wml!Controls/Label/Label');

      /**
       * Label.
       *
       * @class Controls/Label
       * @extends Core/Control
       * @public
       * @demo Controls-demo/Label/Label
       * @author Журавлев М.С.
       */

      /**
       * @name Controls/Label#caption
       * @cfg {String}
       */

      /**
       * @name Controls/Label#required
       * @cfg {Boolean}
       */

      /**
       * @name Controls/Label#underline
       * @cfg {String}
       * @variant hovered
       * @variant fixed
       * @variant none
       */

      /**
       * @name Controls/Label#href
       * @cfg {String}
       */

      var _private = {
         warn: function(container, className, optionValue) {
            if (container.classList.contains(className)) {
               Env.IoC.resolve('ILogger').warn('Controls/Label', 'Модификатор ' + className + ' не поддерживается. Используйте опцию underline со значением ' + optionValue);
            }
         },

         getDOMContainer: function(element) {
            //TODO https://online.sbis.ru/opendoc.html?guid=d7b89438-00b0-404f-b3d9-cc7e02e61bb3
            if (element.get) {
               return element.get(0);
            }
            return element;
         }
      };

      var Label = Control.extend({
         _template: template,

         _afterMount: function() {
            var container = _private.getDOMContainer(this._container);

            /**
             * Способ смены внешнего вида контрола переведен с модификаторов на опцию.
             * Предупреждаем тех кто их использует, что им нужно поправить свой код.
             * Предупреждение будет удалено в 19.200 по задаче.
             * https://online.sbis.ru/opendoc.html?guid=7c63d5fe-db71-4a5c-91e9-3a422969c1c7
             */
            _private.warn(container, 'controls-Label_underline-hovered', 'hovered');
            _private.warn(container, 'controls-Label_underline_color-hovered', 'fixed');
         }
      });

      Label.getDefaultOptions = function() {
         return {
            underline: 'none'
         };
      };

      Label.getOptionTypes = function() {
         return {
            href: entity.descriptor(String),
            caption: entity.descriptor(String).required(),
            underline: entity.descriptor(String).oneOf([
               'none',
               'fixed',
               'hovered'
            ]),
            required: entity.descriptor(Boolean)
         };
      };

      Label._theme = ['Controls/input'];

      export = Label;
   
