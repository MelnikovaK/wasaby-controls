define('js!SBIS3.CONTROLS.Demo.FilterButtonFilterContentFull', [
      'js!SBIS3.CORE.CompoundControl',
      'html!SBIS3.CONTROLS.Demo.FilterButtonFilterContentFull',
      'css!SBIS3.CONTROLS.Demo.FilterButtonFilterContentFull',
      'js!SBIS3.CONTROLS.ComboBox',
      'js!SBIS3.CORE.FieldLink',
      'js!SBIS3.CONTROLS.Demo.FilterButtonContentLinkSelect'
   ],
   function(CompoundControl, ContentTpl) {

      var FilterContent = CompoundControl.extend({
         _dotTplFn: ContentTpl
      });

      return FilterContent;
   }
);