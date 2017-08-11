/**
 * Created by am.gerasimov on 19.01.2016.
 */
define('js!SBIS3.CONTROLS.Utils.TemplateUtil', [], function() {

    /**
     * @class SBIS3.CONTROLS.Utils.TemplateUtil
     * @public
     */
   return /** @lends SBIS3.CONTROLS.Utils.TemplateUtil.prototype */{
       /**
        *
        * @param tpl
        * @returns {*}
        */
      prepareTemplate: function(tpl) {
         var template;

         switch (typeof tpl) {
            case 'string' :
               template = tpl.indexOf('html!') === 0 || tpl.indexOf('tmpl!') === 0 ?
                   global.requirejs(tpl) :
                  (window.doT ? doT.template(tpl) : tpl);
               break;
            case 'function' :
               template = tpl;
               break;
            case 'undefined' :
               template = undefined;
               break;
            default:
               template = null;
         }
         return template;
      }
   };
});