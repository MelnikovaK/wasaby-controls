define('js!SBIS3.SPEC.Input.Number', [
], function() {

   /**
    * Поле ввода числа.
    * @class SBIS3.SPEC.Input.Number
    * @extends SBIS3.SPEC.Control
    * @mixes SBIS3.SPEC.interface.IInputNumber
    * @mixes SBIS3.SPEC.interface.IInputPlaceholder
    * @mixes SBIS3.SPEC.interface.IValidation
    * @control
    * @public
    * @category Inputs
    */

   /**
    * @name SBIS3.SPEC.Input.Number#decimals
    * @cfg {Number} Количество знаков после запятой
    */

   /**
    * @name SBIS3.SPEC.Input.Number#onlyPositive
    * @cfg {Boolean} Ввод только положительных чисел
    */

   /**
    * @name SBIS3.SPEC.Input.Number#onlyInteger
    * @cfg {Boolean} Ввод только целых чисел
    */

   /**
    * @name SBIS3.SPEC.Input.Number#integers
    * @cfg {Number} Количество знаков до запятой
    */

   /**
    * @name SBIS3.SPEC.Input.Number#showEmptyDecimals
    * @cfg {Boolean} Показывать ненулевую дробную часть
    */



});