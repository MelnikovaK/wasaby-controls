/**
 * Created by as.krasilnikov on 10.09.2018.
 */
define('Controls/Utils/isVDOMTemplate', [], function() {

   'use strict';

   /**
    * Модуль возвращает функцию, которая проверяет, совместим ли класс компонента с WaSaby.
    *
    * <h2>Аргументы функции</h2>
    *
    * Прототип класса компонента.
    *
    * <h2>Критерий проверки</h2>
    *
    * Класс унаследован от Core/Control.
    *
    * <h2>Возвращает</h2>
    *
    * * true - класс унаследован от Core/Control.
    * * false - класс не унаследован от Core/Control.
    *
    * <h2>Пример использования</h2>
    * <pre>
    * require(['Controls/buttons:Button', 'SBIS3.CONTROLS/Button', 'Controls/Utils/isVDOMTemplate'], function(VDOMButton, WS3Button, isVDOMTemplate) {
    *
    *   // true
    *   isVDOMTemplate(VDOMButton);
    *
    *   // false
    *   isVDOMTemplate(WS3Button);
    * });
    * </pre>
    *
    * @class Controls/Utils/isVDOMTemplate
    * @public
    * @author Красильников А.С.
    */
   /*
    * The module returns a function that checks whether the component class is compatible with the WaSaby.
    *
    * <h2>Function argument</h2>
    *
    * The prototype of the component class.
    *
    * <h2>Verification criterion</h2>
    *
    * The class is inherited from the class Core/Control.
    *
    * <h2>Returns</h2>
    *
    * <ul>
    *     <li><b>true</b> - the class is inherited from Core/Control</li>
    *     <li><b>false</b> - class is not inherited from Core/Control</li>
    * </ul>
    *
    * <h2>Usage example</h2>
    * <pre>
    * require(
    * ['Controls/buttons:Button', 'SBIS3.CONTROLS/Button', 'Controls/Utils/isVDOMTemplate'],
    * function(VDOMButton, WS3Button, isVDOMTemplate) {
    *
    *   // true
    *   isVDOMTemplate(VDOMButton);
    *
    *   // false
    *   isVDOMTemplate(WS3Button);
    *  });
    * </pre>
    *
    * @class Controls/Utils/isVDOMTemplate
    * @public
    * @author Красильников А.С.
    */

   return function isVDOMTemplate(templateClass) {
      // на VDOM классах есть св-во _template.
      // Если его нет, но есть stable или isDataArray, значит это функция от tmpl файла
      var isVDOM = templateClass && (templateClass.prototype && templateClass.prototype._template || templateClass.stable || templateClass.isDataArray);
      return !!isVDOM;
   };
});
