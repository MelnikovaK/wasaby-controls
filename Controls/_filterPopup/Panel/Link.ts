import Control = require('Core/Control');
import template = require('wml!Controls/_filterPopup/Panel/Link/Link');
import 'css!theme?Controls/filterPopup';
   /**
    * Кнопка-ссылка на панели фильтров.
    * @class Controls/_filterPopup/Panel/Link
    * @extends Core/Control
    * @control
    * @public
    */

   /*
    * Control filter link
    * @class Controls/_filterPopup/Panel/Link
    * @extends Core/Control
    * @control
    * @public
    */

   /**
    * @name Controls/_filterPopup/Panel/Link#caption
    * @cfg {Object} Caption Текст кнопки-ссылки.
    */

   /*
    * @name Controls/_filterPopup/Panel/Link#caption
    * @cfg {Object} Caption
    */   


   var FilterLink = Control.extend({
      _template: template,

      _clickHandler: function() {
         this._notify('visibilityChanged', [true]);
      }

   });

   export = FilterLink;

