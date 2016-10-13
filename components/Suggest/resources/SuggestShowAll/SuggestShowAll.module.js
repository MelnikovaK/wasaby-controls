/**
 * Created by am.gerasimov on 25.01.2016.
 */
define('js!SBIS3.CONTROLS.SuggestShowAll',
    [  'js!SBIS3.CORE.CompoundControl',
       'html!SBIS3.CONTROLS.SuggestShowAll',
       'Core/helpers/collection-helpers',
       'js!SBIS3.CONTROLS.DataGridView',
       'i18n!SBIS3.CONTROLS.SuggestShowAll'
    ], function (CompoundControl, dotTplFn, colHelpers) {

       var optionsToSet = ['columns', 'itemTemplate', 'keyField', 'filter'];
       /**
        * SBIS3.CORE.SuggestShowAll
        * @extends $ws.proto.CompoundControl
        */
       var SuggestShowAllDialog = CompoundControl.extend({
          _dotTplFn: dotTplFn,
          $protected: {
             _options: {
                autoWidth: false,
                autoHeight: false,
                width: '700px',
                height: '500px'
             }
          },
          $constructor: function () {
             var window = this.getParent();
             window._options.resizable = false;
             window._options.caption = rk('Все записи');
          },

          _modifyOptions: function (opts) {
             var options = SuggestShowAllDialog.superclass._modifyOptions.call(this, opts);

             if(options.chooserMode === 'floatArea') {
                options.autoHeight = true;
             }

             return options;
          },

          init: function() {
             SuggestShowAllDialog.superclass.init.apply(this, arguments);

             var list = this.getParent().getOpener().getList(),
                 view = this.getChildControlByName('controls-showAllView');

             colHelpers.forEach(optionsToSet, function(opt) {
                view.setProperty(opt, list.getProperty(opt));
             });
             view.setDataSource(list.getDataSource());

          }
       });
       return SuggestShowAllDialog;
    });
