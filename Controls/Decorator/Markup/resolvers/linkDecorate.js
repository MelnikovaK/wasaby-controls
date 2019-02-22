/**
 * Created by rn.kondakov on 23.10.2018.
 */
define('Controls/Decorator/Markup/resolvers/linkDecorate', [
   'Core/base64',
   'Env/Env'
], function(base64,
   Env) {
   'use strict';

   /**
    *
    * Module with a function to replace common link on decorated link, if it needs.
    * Tag resolver for {@link Controls/Decorator/Markup}.
    *
    * @class Controls/Decorator/Markup/resolvers/linkDecorate
    * @public
    * @author Кондаков Р.Н.
    */
   return function linkDecorate(value, parent) {
      // Can't decorate without decoratedLink service address.
      if (!Env.constants.decoratedLinkService) {
         return value;
      }


      // Decorate tag "a" only.
      if (!Array.isArray(value) || Array.isArray(value[0]) || value[0] !== 'a') {
         return value;
      }

      // Decorate link right inside paragraph.
      if (!parent || (typeof parent[0] === 'string' && parent[0] !== 'p' && parent[0] !== 'div')) {
         return value;
      }

      // Decorate link only with text == href, and href length should be less then 1500;
      if (!value[1] || !value[1].href || value[1].href.length >= 1500 || value[1].href !== value[2]) {
         return value;
      }

      // Decorate link just in the end of paragraph.
      var indexOfNextValue = parent.indexOf(value) + 1;
      if (typeof parent[indexOfNextValue] === 'string' && /^[ \u00a0]+$/.test(parent[indexOfNextValue])) {
         indexOfNextValue++;
      }
      if (indexOfNextValue < parent.length &&
            (!Array.isArray(parent[indexOfNextValue]) || parent[indexOfNextValue][0] !== 'br')) {
         return value;
      }

      var linkAttrs = {};
      for (var key in value[1]) {
         if (value[1].hasOwnProperty(key)) {
            linkAttrs[key] = value[1][key];
         }
      }
      linkAttrs.class = (linkAttrs.class ? linkAttrs.class.replace('asLink', '') + ' ' : '') + 'LinkDecorator__linkWrap';
      linkAttrs.href = linkAttrs.href.replace(/\\/g, '/');
      linkAttrs.target = '_blank';

      var image = (typeof location === 'object' ? location.protocol + '//' + location.host : '') +
         Env.constants.decoratedLinkService + '?method=LinkDecorator.DecorateAsSvg&params=' +
         encodeURIComponent(base64.encode('{"SourceLink":"' + linkAttrs.href + '"}')) + '&id=0&srv=1';

      return ['span',
         { 'class': 'LinkDecorator__wrap' },
         ['a',
            linkAttrs,
            ['img',
               { 'class': 'LinkDecorator__image', alt: linkAttrs.href, src: image }
            ]
         ]
      ];
   };
});
