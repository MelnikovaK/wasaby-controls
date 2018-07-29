define('Controls/Label',
   [
      'Core/Control',
      'tmpl!Controls/Label/Label',

      'css!Controls/Label/Label'
   ],
   function(Control, template) {

      'use strict';

      /**
       * Label.
       *
       * @class Controls/Label
       * @extends Core/Control
       * @public
       * @demo Controls-demo/Label/Label
       */

      /**
       * @name Controls/Label#caption
       * @cfg {String}
       */

      /**
       * @name Controls/Label#required
       * @cfg {Boolean}
       */

      var Label = Control.extend({
         _template: template
      });

      return Label;
   }
);
