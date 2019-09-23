import Control = require('Core/Control');
import template = require('wml!Controls/_popupTemplate/CloseButton/CloseButton');
import Env = require('Env/Env');
   /**
    * Кнопка для закрытия всплывающих окон и диалогов.
    *
    * <a href="/materials/demo-ws4-buttons">Демо-пример</a>.
    *
    * @class Controls/_popupTemplate/CloseButton
    * @extends Core/Control
    * @control
    * @public
    * @author Красильников А.С.
    * @demo Controls-demo/Buttons/Close/CloseDemo
    * @mixes Controls/_buttons/interface/IClick
    *
    */
   /*
    * Specialized type of button for closing windows.
    *
    * <a href="/materials/demo-ws4-buttons">Demo-example</a>.
    *
    * @class Controls/_popupTemplate/CloseButton
    * @extends Core/Control
    * @control
    * @public
    * @author Красильников А.С.
    * @demo Controls-demo/Buttons/Close/CloseDemo
    * @mixes Controls/_buttons/interface/IClick
    *
    */

   /**
    * @name Controls/_popupTemplate/CloseButton#viewMode
    * @cfg {String} Устанавливает вид отображения кнопки.
    * @variant toolButton Отображение как кнопки панели инструментов.
    * @variant link Отображение кнопки в виде ссылки.
    * @default toolButton
    * @example
    * Отображение в виде ссылки:
    * <pre>
    *    <Controls.popupTemplate:CloseButton viewMode="link" size="l"/>
    * </pre>
    * Отображение как кнопки панели инструментов:
    * <pre>
    *    <Controls.popupTemplate:CloseButton viewMode="toolButton" size="l"/>
    * </pre>
    */

   /*
    * @name Controls/_popupTemplate/CloseButton#viewMode
    * @cfg {String} Close button display view mode.
    * @variant toolButton  Close display style as button toolButton.
    * @variant link Close display style as button link.
    * @default toolButton
    * @example
    * Close button display as link.
    * <pre>
    *    <Controls.popupTemplate:CloseButton viewMode="link" size="l"/>
    * </pre>
    * Close button display as toolButton.
    * <pre>
    *    <Controls.popupTemplate:CloseButton viewMode="toolButton" size="l"/>
    * </pre>
    */

   /**
    * @name Controls/_popupTemplate/CloseButton#transparent
    * @cfg {String} Определяет фон кнопки.
    * @variant true Кнопке будет установлен прозрачный фон.
    * @variant false Кнопка имеет фон по умолчанию для этого режима отображения и стиля.
    * @default true
    * @example
    * Кнопка "Закрыть" с прозрачным фоном:
    * <pre>
    *    <Controls.popupTemplate:CloseButton viewMode="toolButton" transparent="{{true}}" size="l"/>
    * </pre>
    * Кнопка "Закрыть" с непрозрачным фоном.
    * <pre>
    *    <Controls.popupTemplate:CloseButton viewMode="toolButton" transparent="{{false}}" size="l"/>
    * </pre>
    */

   /*
    * @name Controls/_popupTemplate/CloseButton#transparent
    * @cfg {String} Determines whether close button background color.
    * @variant true Close button has transparent background.
    * @variant false Close button has their viewmode's background.
    * @default true
    * @example
    * Close button has transparent background.
    * <pre>
    *    <Controls.popupTemplate:CloseButton viewMode="toolButton" transparent="{{true}}" size="l"/>
    * </pre>
    * Close button has toolButton's background.
    * <pre>
    *    <Controls.popupTemplate:CloseButton viewMode="toolButton" transparent="{{false}}" size="l"/>
    * </pre>
    */

   /**
    * @name Controls/_popupTemplate/CloseButton#size
    * @cfg {String} Устанавливает размер кнопки. Значение задается общими обозначениями размера.
    * @variant l Средний размер кнопки.
    * @variant m Большой размер кнопки.
    * @default m
    * @remark
    * Размер устанавливается только для кнопок вида toolButton.
    * @example
    * Устанавливается средний размер кнопки:
    * <pre>
    *    <Controls.popupTemplate:CloseButton viewMode="toolButton" transparent="{{true}}" size="l"/>
    * </pre>
    * Устанавливается большой размер кнопки:
    * <pre>
    *    <Controls.popupTemplate:CloseButton viewMode="toolButton" transparent="{{false}}" size="m"/>
    * </pre>
    */

   /*
    * @name Controls/_popupTemplate/CloseButton#size
    * @cfg {String} Close button size. The value is given by common size notations.
    * @variant l Medium button size.
    * @variant m Large button size.
    * @default m
    * @remark
    * Close button has this size only in toolButton view mode.
    * @example
    * Close button has l size.
    * <pre>
    *    <Controls.popupTemplate:CloseButton viewMode="toolButton" transparent="{{true}}" size="l"/>
    * </pre>
    * Close button has m size.
    * <pre>
    *    <Controls.popupTemplate:CloseButton viewMode="toolButton" transparent="{{false}}" size="m"/>
    * </pre>
    */

   var CloseButton = Control.extend({
      _template: template
   });

   CloseButton._theme = ['Controls/popupTemplate'];

   CloseButton.getDefaultOptions = function() {
      return {
         size: 'l',
         viewMode: 'toolButton',
         transparent: true,
         compatibleFocus: false
      };
   };

   export = CloseButton;
