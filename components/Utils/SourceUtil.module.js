/**
 * Created by am.gerasimov on 06.03.2017.
 */
define('js!SBIS3.CONTROLS.Utils.SourceUtil', ['Core/core-instance'], function(cInstance) {
    /**
     * @class SBIS3.CONTROLS.Utils.SourceUtil
     * @public
     */
   return /** @lends SBIS3.CONTROLS.Utils.SourceUtil.prototype */ {
       /**
        *
        * @param sourceOpt
        * @returns {*}
        */
      prepareSource: function(sourceOpt) {
         var result;

         switch (typeof sourceOpt) {
            case 'function':
               result = sourceOpt.call(this);
               break;
            case 'object':
               if (cInstance.instanceOfMixin(sourceOpt, 'WS.Data/Source/ISource')) {
                  result = sourceOpt;
               }
               if ('module' in sourceOpt) {
                  var DataSourceConstructor = requirejs(sourceOpt.module);
                  result = new DataSourceConstructor(sourceOpt.options || {});
               }
               break;
         }
         return result;
      }
   };
});