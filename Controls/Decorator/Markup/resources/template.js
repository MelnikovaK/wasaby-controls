/**
 * Created by rn.kondakov on 18.10.2018.
 */
define('Controls/Decorator/Markup/resources/template', [
   'View/Executor/TClosure',
   'Core/validHtml'
], function(thelpers,
   validHtml) {
   'use strict';

   var markupGenerator,
      defCollection,
      control,
      dataAttributeRegExp = /^data-([\w-])*/,
      resolver,
      resolverParams,
      resolverMode;

   function isString(value) {
      return typeof value === 'string' || value instanceof String;
   }

   function validAttributesInsertion(to, from) {
      var validAttributes = validHtml.validAttributes;
      for (var key in from) {
         if (!from.hasOwnProperty(key)) {
            continue;
         }
         if (!validAttributes[key] && !dataAttributeRegExp.test(key)) {
            continue;
         }
         if ((key === 'src' || key === 'href') && from[key].indexOf('javascript:') === 0) {
            continue;
         }
         to[key] = markupGenerator.escape(from[key]);
      }
   }

   function recursiveMarkup(value, attrsToDecorate, key, parent) {
      var valueToBuild = resolverMode && resolver ? resolver(value, parent, resolverParams) : value,
         wasResolved,
         i;
      if (isString(valueToBuild)) {
         return markupGenerator.createText(markupGenerator.escape(valueToBuild), key);
      }
      if (!valueToBuild) {
         return [];
      }
      wasResolved = value !== valueToBuild;
      resolverMode ^= wasResolved;
      var children = [];
      if (Array.isArray(valueToBuild[0])) {
         for (i = 0; i < valueToBuild.length; ++i) {
            children.push(recursiveMarkup(valueToBuild[i], attrsToDecorate, key + i + '_', valueToBuild));
         }
         resolverMode ^= wasResolved;
         return children;
      }
      var firstChildIndex = 1,
         tagName = valueToBuild[0],
         attrs = {
            attributes: {},
            events: {},
            key: key
         };
      if (!validHtml.validNodes[tagName]) {
         resolverMode ^= wasResolved;
         return [];
      }
      if (valueToBuild[1] && !isString(valueToBuild[1]) && !Array.isArray(valueToBuild[1])) {
         firstChildIndex = 2;
         validAttributesInsertion(attrs.attributes, valueToBuild[1]);
      }
      for (i = firstChildIndex; i < valueToBuild.length; ++i) {
         children.push(recursiveMarkup(valueToBuild[i], {}, key + i + '_', valueToBuild));
      }
      resolverMode ^= wasResolved;
      return [markupGenerator.createTag(tagName, attrs, children, attrsToDecorate, defCollection, control, key)];
   }

   var template = function(data, attr, context, isVdom, sets) {
      markupGenerator = thelpers.getMarkupGenerator(isVdom);
      defCollection = {
         id: [],
         def: undefined
      };
      control = data;
      resolver = data._options.tagResolver;
      resolverParams = data._options.resolverParams || {};
      resolverMode = 1;

      var elements = [],
         key = (attr && attr.key) || '_',
         attrsToDecorate = {
            attributes: attr.attributes,
            context: attr.context
         },
         oldEscape,
         value = data._options.value;
      if (value && value.length) {
         // Need just one root node.

         // Mobile can't work with tags yet, so can be value like ["text"].
         // TODO: cancel this merge in https://online.sbis.ru/opendoc.html?guid=a8a904f8-6c0d-4754-9e02-d53da7d32c99
         if (value.length === 1 && isString(value[0])) {
            value = ['div', value[0].split('\n').map(function(str, index) {
               // Newline symbol does not shown in the middle of tag.
               return index ? ['p', '\n' + str] : ['p', str];
            })];
         } else {
            value = ['div', value];
         }
      }
      if (isVdom) {
         // Protect view of text from needless unescape in inferno.
         oldEscape = markupGenerator.escape;
         markupGenerator.escape = function(str) {
            return str.replace(/&([^&]*;)/g, function(match, entity) {
               return '&amp;' + entity;
            });
         };
      }
      try {
         elements = recursiveMarkup(value, attrsToDecorate, key + '0_');
      } catch (e) {
         thelpers.templateError('Controls/Decorator/Markup', e, data);
      } finally {
         if (isVdom) {
            markupGenerator.escape = oldEscape;
         }
      }

      if (!elements.length) {
         elements = [markupGenerator.createTag('invisible-node', { key: key + '0_' }, [], attrsToDecorate,
            defCollection, data, key + '0_')];
      }
      return markupGenerator.joinElements(elements, key, defCollection);
   };

   // Template functions should have true "stable" flag to send error on using, for example, some control instead it.
   template.stable = true;

   return template;
});
