/**
 * Control for displaying data in Master-Detail format.
 *
 * Author: Ivan Uvarov (is.uvarov@tensor.ru)
 */
define('SBIS3.CONTROLS/WSControls/Containers/MasterDetail',
   [
      'Core/Control',
      'tmpl!SBIS3.CONTROLS/WSControls/Containers/MasterDetail',
      'css!SBIS3.CONTROLS/WSControls/Containers/MasterDetail'
   ],

   function (Base, template) {
      'use strict';

      /**
       * Control for displaying data in Master-Detail format.
       *
       * Options:
       * <ol>
       *    <li>master - component for master column.</li>
       *    <li>detail - component for detail column.</li>
       * </ol>
       *
       * @class WSControls/Containers/MasterDetail
       * @extends Core/Control
       * @demo Examples/MasterDetail/MasterDetailDemo
       * @author Uvarov Ivan (is.uvarov)
       *
       * @css controls-MasterDetail__masterContainer Class for changing master column styles.
       * @css controls-MasterDetail__detailContainer Class for changing detail column styles.
       *
       * @control
       * @public
       */

      return Base.extend({
         _controlName: 'SBIS3.CONTROLS/WSControls/Containers/MasterDetail',
         _template: template,
         _selected: null
      });
   }
);
