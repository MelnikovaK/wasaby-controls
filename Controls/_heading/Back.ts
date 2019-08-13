import Control = require('Core/Control');
import template = require('wml!Controls/_heading/Back/Back');
import entity = require('Types/entity');
import Env = require('Env/Env');
import 'css!theme?Controls/heading';
   /**
    * Специализированный заголовок-кнопка для перехода на предыдущий уровень. 
    *
    * <a href="/materials/demo-ws4-header-separator">Демо-пример</a>.
    *
    * @class Controls/_heading/Back
    * @extends Core/Control
    * @mixes Controls/_interface/ICaption
    * @mixes Controls/_buttons/interface/IClick
    * @mixes Controls/_interface/ITooltip
    * @mixes Controls/_heading/Back/BackStyles
    * @control
    * @public
    * @author Красильников А.С.
    * @demo Controls-demo/Heading/Back/SizesAndStyles/Index
    */

   /*
    * Specialized heading to go to the previous level.
    *
    * <a href="/materials/demo-ws4-header-separator">Demo-example</a>.
    *
    * @class Controls/_heading/Back
    * @extends Core/Control
    * @mixes Controls/_interface/ICaption
    * @mixes Controls/_buttons/interface/IClick
    * @mixes Controls/_interface/ITooltip
    * @mixes Controls/_heading/Back/BackStyles
    * @control
    * @public
    * @author Красильников А.С.
    * @demo Controls-demo/Heading/Back/SizesAndStyles/Index
    */

   /**
    * @name Controls/_heading/Back#style
    * @cfg {String} Стиль отображения заголовка-кнопки "Назад".
    * @variant primary
    * @variant secondary
    * @default primary
    * @example
    * Заголовок-кнопка со стилем по умолчанию.
    * <pre>
    *    <Controls.heading:Back/>
    * </pre>
    * Заголовок-кнопка со стилем "secondary".
    * <pre>
    *    <Controls.heading:Back style="secondary"/>
    * </pre>
    */

   /*
    * @name Controls/_heading/Back#style
    * @cfg {String} Back heading display style.
    * @variant primary
    * @variant secondary
    * @default primary
    * @example
    * Back heading has default style.
    * <pre>
    *    <Controls.heading:Back/>
    * </pre>
    * Back heading has 'secondary' style.
    * <pre>
    *    <Controls.heading:Back style="secondary"/>
    * </pre>
    */

   /**
    * @name Controls/_heading/Back#size
    * @cfg {String} Размер заголовка-кнопки "Назад".
    * @variant s Маленький заголовок.
    * @variant m Средний заголовок.
    * @variant l Большой заголовок.
    * @default m
    * @example
    * Back heading has default size.
    * <pre>
    *    <Controls.heading:Back/>
    * </pre>
    * Back heading has 'l' size.
    * <pre>
    *    <Controls.heading:Back size="l"/>
    * </pre>
    */

   /*
    * @name Controls/_heading/Back#size
    * @cfg {String} Back heading size.
    * @variant s Small heading size.
    * @variant m Medium heading size.
    * @variant l Large heading size.
    * @default m
    * @example
    * Back heading has default size.
    * <pre>
    *    <Controls.heading:Back/>
    * </pre>
    * Back heading has 'l' size.
    * <pre>
    *    <Controls.heading:Back size="l"/>
    * </pre>
    */

   var _private = {
      convertOldStyleToNew: function(options, self) {
         if (options.style !== self._options.style) {
            if (options.style === 'default') {
               self._style = 'primary';
               Env.IoC.resolve('ILogger').warn('Heading.Back', 'Используются устаревшие стили. Используйте style primary вместо style default');
            } else {
               self._style = options.style;
            }
         }
      }
   };

   var BackButton = Control.extend({
      _template: template,
      _isOldIe: false,

      _beforeMount: function(options) {
         _private.convertOldStyleToNew(options, this);
         this._isOldIe = Env.detection.isIE && Env.detection.IEVersion < 11;
      },
      _beforeUpdate: function(newOptions) {
         _private.convertOldStyleToNew(newOptions, this);
      }
   });

   BackButton.getOptionTypes = function getOptionTypes() {
      return {
         caption: entity.descriptor(String).required(),
         style: entity.descriptor(String).oneOf([
            'primary',
            'secondary',
            'default'
         ]),
         size: entity.descriptor(String).oneOf([
            's',
            'm',
            'l'
         ])
      };
   };

   BackButton.getDefaultOptions = function() {
      return {
         style: 'primary',
         size: 'm'
      };
   };

   export = BackButton;

