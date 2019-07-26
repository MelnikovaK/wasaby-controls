/**
 * Created by rn.kondakov on 18.10.2018.
 */
import template = require('Controls/_decorator/Markup/resources/template');
import linkDecorateUtils = require('Controls/_decorator/Markup/resources/linkDecorateUtils');
import objectMerge = require('Core/core-merge');
import { IoC } from 'Env/Env';


   // Convert node to jsonML array.
   function nodeToJson(node) {
      // Text node, in jsonML it is just a string.
      if (node.nodeType === Node.TEXT_NODE) {
         return node.nodeValue;
      }

      // Element node, in jsonML it is an array.
      if (node.nodeType === Node.ELEMENT_NODE) {
         var json = [];

         // json[0] is a tag name.
         var tagName = node.nodeName.toLowerCase();
         json[0] = tagName;

         // If node has attributes, they are located in json[1].
         var nodeAttributes = node.attributes;
         if (nodeAttributes.length) {
            var jsonAttributes = {};
            for (var i = 0; i < nodeAttributes.length; ++i) {
               jsonAttributes[nodeAttributes[i].name] = nodeAttributes[i].value;
            }
            json[1] = jsonAttributes;
         }

         // After that convert child nodes and push them to array.
         var firstChild;
         if (node.hasChildNodes()) {
            var childNodes = node.childNodes,
               child;

            // Recursive converting of children.
            for (var i = 0; i < childNodes.length; ++i) {
               child = nodeToJson(childNodes[i]);
               if (!i) {
                  firstChild = child;
               }
               json.push(child);
            }
         }

         // By agreement, json shouldn't contain decorated link. Undecorate it if found.
         if (linkDecorateUtils.isDecoratedLink(tagName, firstChild)) {
            json = linkDecorateUtils.getUndecoratedLink(firstChild);
         }

         return json;
      }

      // Return empty array if node is neither text nor element.
      return [];
   }

   var tagPattern = '(?:</?([a-z]+)[^>]*[>])',
      domainLinkPrefixPattern = '((?:https?|ftp|file|smb)://)',
      simpleLinkPrefixPattern = '([\\w\\-]+(?:\\.[a-zA-Z]+)*\\.[a-zA-Z]+(?::[0-9]+)?)',
      linkPrefixPattern = `(?:${domainLinkPrefixPattern}|${simpleLinkPrefixPattern})`,
      linkPattern = `(${linkPrefixPattern}(?:[^\\s\\x16<>]*))`,
      emailPattern = '([\\wа-яёА-ЯЁ!#$%&\'*+\\-/=?^`{|}~.]+@[^\\s\\x16<>@]+(?:\\.[^.,:\\s\\x16<>@]{1,5}))',
      endingPattern = '([^.,:\\s\\x16<>])',
      nbsp = '&nbsp;',
      nbspReplacer = '\x16',
      nbspRegExp = new RegExp(nbsp, 'g'),
      nbspReplacerRegExp = new RegExp(nbspReplacer, 'g'),
      linkParseRegExp = new RegExp(`${tagPattern}|(?:(?:${linkPattern}|${emailPattern})${endingPattern})`, 'g');

   // Wrap all links and email addresses placed not in tag a.
   function wrapUrl(html) {
      var resultHtml = html.replace(nbspRegExp, nbspReplacer),
         linkIgnore = false;
      resultHtml = resultHtml.replace(linkParseRegExp, function(match, tag, link, domainLinkPrefix, simpleLinkPrefix, email, ending) {
         var linkParseResult;
         if (tag) {
            if (tag === 'a') {
               linkIgnore = !linkIgnore;
            }
            linkParseResult = match;
         } else if (linkIgnore) {
            linkParseResult = match;
         } else {
            if (link) {
               link = link + ending;
               linkParseResult = '<a class="asLink" rel="noreferrer" href="' +
                  (simpleLinkPrefix ? 'http://' : '') + link + '" target="_blank">' + link + '</a>';
            } else {
               email = email + ending;
               linkParseResult = '<a href="mailto:' + email + '">' + email + '</a>';
            }
         }
         return linkParseResult;
      });
      resultHtml = resultHtml.replace(nbspReplacerRegExp, nbsp);
      return resultHtml;
   }

   /**
    * Преобразует html-строки в допустимый JsonML. Используется только на стороне клиента.
    * @function Controls/_decorator/Markup/Converter#htmlToJson
    * @param html {String}
    * @returns {Array}
    */

   /*
    * Convert html string to valid JsonML. Is using on client-side only.
    * @function Controls/_decorator/Markup/Converter#htmlToJson
    * @param html {String}
    * @returns {Array}
    */
   var htmlToJson = function(html) {
      if (typeof document === 'undefined') {
         IoC.resolve('ILogger')
            .error('Controls/_decorator/Markup/Converter' ,'htmlToJson method doesn\'t work on server-side');
         return [];
      }
      let div = document.createElement('div'),
         rootNode,
         rootNodeTagName,
         rootNodeAttributes,
         hasRootTag,
         result;
      div.innerHTML = wrapUrl(html).trim();
      hasRootTag = div.innerHTML[0] === '<';
      result = nodeToJson(div).slice(1);
      if (!hasRootTag && div.innerHTML) {
         // In this case, array will begin with a string that is not tag name, what is incorrect.
         // Empty json in the beginning will fix it.
         result.unshift([]);
      }
      div = null;

      // Add version.
      rootNode = result[0];
      if (hasRootTag) {
         // TODO: replace this "magic" getting of attributes with a function from result of task to wrap JsonML.
         // https://online.sbis.ru/opendoc.html?guid=475ea157-8996-47e8-9842-6d4e6533bba5
         if (typeof rootNode[1] === 'object' && !Array.isArray(rootNode[1])) {
            rootNodeAttributes = rootNode[1];
         } else {
            rootNodeAttributes = {};
            rootNodeTagName = rootNode.shift();
            rootNode.unshift(rootNodeAttributes);
            rootNode.unshift(rootNodeTagName);
         }
         rootNodeAttributes.version = '2';
      }

      return result;
   };

   /**
    * Преобразует json-строки в строки формата html.
    * @function Controls/_decorator/Markup/Converter#jsonToHtml
    * @param json {Array} Json на основе JsonML.
    * @param tagResolver {Function} точно как в {@link Controls/_decorator/Markup#tagResolver}.
    * @param resolverParams {Object} точно как в {@link Controls/_decorator/Markup#resolverParams}.
    * @returns {String}
    */

   /*
    * Convert Json to html string.
    * @function Controls/_decorator/Markup/Converter#jsonToHtml
    * @param json {Array} Json based on JsonML.
    * @param tagResolver {Function} exactly like in {@link Controls/_decorator/Markup#tagResolver}.
    * @param resolverParams {Object} exactly like in {@link Controls/_decorator/Markup#resolverParams}.
    * @returns {String}
    */
   var jsonToHtml = function(json, tagResolver, resolverParams) {
      var result = template({
         _options: {
            value: json,
            tagResolver: tagResolver,
            resolverParams: resolverParams
         },
         _moduleName: 'Controls/decorator:Converter'
      }, {}, {}, false);

      // Invisible node in vdom equals empty string in html.
      return result === '<invisible-node></invisible-node>' ? '' : result;
   };

   /**
    * Преобразует json-массив в его копию по значению во всех узлах.
    * @function Controls/_decorator/Markup/Converter#deepCopyJson
    * @param json
    * @return {Array}
    */

   /*
    * Convert Json array to its copy  by value in all nodes.
    * @function Controls/_decorator/Markup/Converter#deepCopyJson
    * @param json
    * @return {Array}
    */
   var deepCopyJson = function(json) {
      return objectMerge([], json, { clone: true });
   };

   /**
    * @class Controls/_decorator/Markup/Converter
    * @author Кондаков Р.Н.
    * @public
    */

   var MarkupConverter = {
      htmlToJson: htmlToJson,
      jsonToHtml: jsonToHtml,
      deepCopyJson: deepCopyJson,
      wrapUrl: wrapUrl
   };

   export = MarkupConverter;

