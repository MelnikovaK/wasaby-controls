define('Controls-demo/Input/Date/LinkViewWithApplication', [
   'Core/Control',
   'wml!Controls-demo/Input/Date/LinkViewWithApplication'
], function(
   BaseControl,
   template
) {
   'use strict';

   var ModuleClass = BaseControl.extend({
      _template: template,
      _startValue: new Date(2017, 0, 1),
      _endValue: new Date(2017, 0, 31)
   });
   return ModuleClass;
});
