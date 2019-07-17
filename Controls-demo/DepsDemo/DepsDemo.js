define('Controls-demo/DepsDemo/DepsDemo', [
   'Core/Control',
   'tmpl!Controls-demo/DepsDemo/DepsDemo'
], function(Control, template) {

   var DepsDemo = Control.extend({
      _template: template,
      _beforeMount: function() {
         if(typeof window !== 'undefined') {
            this.is_OK = window.$is_OK$ ? 'ok' : 'Dependencies has not been preloaded. Check DepsDemo.tmpl';
         } else {
            this.is_OK = 'ok'
         }
      }

   });

   return DepsDemo;
});
