define('Controls/Header', [
   'Core/Control',
   'Core/IoC',
   'tmpl!Controls/Header/Header',
   'WS.Data/Type/descriptor',
   'css!Controls/Header/Header'
], function(Control, IoC, template, types) {
   'use strict';

   /**
    * Control showing the headers.
    * @class Controls/Header
    * @extends Controls/Control
    * @control
    * @public
    */

   /**
    * @name Controls/Header#size
    * @cfg {String} caption size
    * @variant s Caption has small size.
    * @variant m Caption has middle size.
    * @variant l Caption has large size.
    * @variant xl Caption has extralarge size.
    */

   /**
    * @name Controls/Header#caption
    * @cfg {String} caption Caption text.
    */

   /**
    * @name Controls/Header#style
    * @cfg {String} Caption display style.
    * @variant default Caption will be default.
    * @variant primary Caption will be accented.
    */

   var Header = Control.extend({
      _template: template
   });

   Header.getOptionTypes =  function getOptionTypes() {
      return {
         caption: types(String),
         style: types(String).oneOf([
            'default',
            'primary'
         ]),
         clickable: types(Boolean),
         size: types(String).oneOf([
            'xl',
            'l',
            'm',
            's'
         ])
      }
   };

   Header.getDefaultOptions = function() {
      return {
         style: 'default',
         size: 'm'
      };
   };

   return Header;
});
