/**
 * Created by ps.borisov on 03.12.2015.
 */
define('SBIS3.CONTROLS/Utils/RichTextAreaUtil/RichTextAreaUtil',[
   'Core/constants',
   'Core/markup/ParserUtilities',
   'WS.Data/Source/SbisService',
   'Core/Deferred'
], function (constants, Parser, SbisService, Deferred) {
   'use strict';
   /**
    * Утилиты для работы с контентом полученным из Богатого текстового редактора
    * @class SBIS3.CONTROLS/Utils/RichTextAreaUtil/RichTextAreaUtil
    * @author Авраменко А.С.
    * @public
    */
   var RichTextAreaUtil = /** @lends SBIS3.CONTROLS/Utils/RichTextAreaUtil/RichTextAreaUtil.prototype */{
      /**
       * Метод для добавления определяющей метки в контент при копировании/вырезки из БТРа
       * @param {$object}$object - jquery элемент при копировании/вырезке из которого в буффер необходимо добавлять метку БТРа
       */
      markRichContentOnCopy: function (target) {
         target = target.get(0);
         //поддерживаем форматное копирование не во всех браузерах
         var browser = constants.browser;
         if (browser.chrome || browser.firefox || browser.isIE) {
            if (target.addEventListener) {
               target.addEventListener('copy', this._markingRichContent, true);
               target.addEventListener('cut', this._markingRichContent, true);
            }
            else {
               //on в отличие от attachEvent в приходящем событии позволяет получить таргет
               $(target).on('cut copy', this._markingRichContent);
            }
         }
      },

      unmarkRichContentOnCopy: function (target) {
         target = target.get(0);
         var browser = constants.browser;
         if (browser.chrome || browser.firefox || browser.isIE) {
            //в webkit в бтре идёт подписка на cut и удаляется лишний символ, поэтому нужно подписываться на capture фазе
            if (target.removeEventListener) {
               target.removeEventListener('copy', this._markingRichContent, true);
               target.removeEventListener('cut', this._markingRichContent, true);
            }
            else {
               $(target).off('cut copy', this._markingRichContent);
            }
         }
      },

      /*Блок приватных методов*/
      _markingRichContent: function (e) {
         var event =  e.originalEvent ? e.originalEvent : e;
         //согласно документации https://developer.mozilla.org/ru/docs/Web/API/Selection/focusNode
         //focusNode является узлом на котором закончилось выделение
         //$.contains(node,node) вернет false, необходимо дополнительно проверить равеноство узлов
         var sel = document.getSelection();
         if (sel && (event.currentTarget === sel.focusNode || $.contains(event.currentTarget, sel.focusNode))) {
            // Обработчик, проставляющий или убирающий метку указщанному узлу если он элемент
            // Сейчас в качестве метки используется атрибут data-ws-is-rich-text == 'true', раньше - стилевое свойство orphans == '31415'
            var handleNode = function (isForward, node) {
               if (node.nodeType === 1) {
                  if (isForward) {
                     node.setAttribute('data-ws-is-rich-text', 'true');
                  }
                  else {
                     node.removeAttribute('data-ws-is-rich-text');
                  }
               }
            };
            // Может быть выделена только часть текста внутри элемента event.target, поэтому маркировать нужно не только его самого, но и его дочерние элементы
            var handleAll = function (isForward, target) {
               handleNode(isForward, target);
               [].slice.call(target.childNodes).forEach(handleNode.bind(null, isForward));
               if (constants.browser.firefox || constants.browser.isIE) {
                  if (isForward) {
                     var $target = $(target);
                     var backs = [];
                     ['color', 'fontSize'].forEach(function (property) {
                        if (!target.style[property]) {
                           target.style[property] = $target.css(property);
                           backs.push(property);
                        }
                     });
                     if (backs.length) {
                        target.setAttribute('data-ws-back-styles', backs.join(','));
                     }
                  }
                  else {
                     var backs = (target.getAttribute('data-ws-back-styles') || '').split(',');
                     if (backs.length) {
                        backs.forEach(function (property) {
                           target.style[property] = '';
                        });
                     }
                  }
               }
            };
            var evtTarget = constants.browser.firefox ? (sel.focusNode !== sel.anchorNode ? sel.getRangeAt(0).commonAncestorContainer : (sel.focusNode.nodeType === 3 ? sel.focusNode.parentNode : sel.focusNode)) : event.target;
            handleAll(true, evtTarget);
            // И вернуть всё взад
            setTimeout(handleAll.bind(null, false, evtTarget), 1);
         }
      },

      //TODO: временное решение для 230. удалить в 240 когда сделают ошибку https://inside.tensor.ru/opendoc.html?guid=dbaac53f-1608-42fa-9714-d8c3a1959f17
      unDecorateLinks: function(text) {
         var
            parsed = Parser.parse(text),

            replaceDecoratedLinks = function(content) {
               var
                  i = 0;
               if (content.childNodes) {
                  while (i < content.childNodes.length) {
                     var
                        className = getAttribute(content.childNodes[i], 'class');
                     //3 if-блока для поддержки разных версий декорированных ссылок
                     //LinkDecorator - версия января 2017
                     //LinkDecorator__simpleLink - тег <a> с ссылкой
                     //LinkDecorator__linkWrap - если выделили только одну декорированную ссылку и пытаются её вставить данный класс висит на <a>
                     //LinkDecorator__decoratedLink - версия февраля 2017
                     //LinkDecorator__wrap - актуальная версия
                     if (className === 'LinkDecorator__link' || className == 'LinkDecorator' || className == 'LinkDecorator__simpleLink'|| className == 'LinkDecorator__linkWrap') {
                        replaceToHref(content, i);
                     } else if (className == 'LinkDecorator__decoratedLink'){
                        content.childNodes.splice(i, 1);
                     } else if (className == 'LinkDecorator__wrap'){
                        replaceWrapToHref(content, i);
                     } else {
                        replaceDecoratedLinks(content.childNodes[i]);
                     }
                     i++;
                  }
               }
            },

            getAttribute = function(node, atrrName){
               if (node && node.attributes && node.attributes[atrrName]) {
                  return node.attributes[atrrName].value;
               }
               return false;
            },

            replaceToHref = function(content, index){
               var
                  href = getAttribute(content.childNodes[index], 'href'),
                  node = new Parser.Node({childNodes: [], parentNode: content, text : href , nodeType: 3});
               content.childNodes[index] = node;
            },

            //Поиск тега a с классом LinkDecorator__linkWrap внутри блока блока с номером index,
            //замена блока с номером index на href найденной ссылки
            replaceWrapToHref = function(content, index){
               var
                  href,
                  node,
                  linkNode,
                  imageNode,
                  i = 0;
               while (i < content.childNodes[index].childNodes.length) {
                  var
                     className = getAttribute(content.childNodes[index].childNodes[i], 'class');
                  if (className == 'LinkDecorator__linkWrap'){
                     var
                        linkChild = content.childNodes[index].childNodes[i].childNodes[0];
                     linkNode = content.childNodes[index].childNodes[i];
                     if (linkChild && linkChild.nodeName === 'img' ) {
                        imageNode = linkChild;
                     }
                     break;
                  }
                  i++;
               }
               href = (linkChild ? getAttribute(linkChild, 'alt') : getAttribute(linkNode, 'href')) || '';
               node = new Parser.Node({childNodes: [], parentNode: content, text : href , nodeType: 3 , nodeValue: href});
               content.childNodes[index] = node;
            };

         replaceDecoratedLinks(parsed);

         return parsed.innerHTML();
      },


      replaceAnchorsToSvg: function(text) {

         var parsed = Parser.parse(text),
            deferred = new Deferred(),
            anchors = [],

         findAnchors = function(content) {
            var i = 0;

            if (content.childNodes) {
               while(i < content.childNodes.length) {
                  var className = getAttribute(content.childNodes[i], 'class');
                  if (className === 'LinkDecorator__outerplaceholder' || className === 'LinkDecorator__innerplaceholder') {
                     anchors.push(content.childNodes[i].attributes.href.value)
                  } else {
                     findAnchors(content.childNodes[i]);
                  }
                  i++;
               }
            }
         },

         getAttribute = function(node, atrrName){
            if (node && node.attributes && node.attributes[atrrName]) {
               return node.attributes[atrrName].value;
            }
            return false;
         };

         findAnchors(parsed);

         if (anchors) {
            require(['WS.Data/Source/SbisService'], function(SbisService) {
               var source = new SbisService({
                  endpoint: {
                     address: '/linkdecorator/service/',
                     contract: 'LinkDecorator'
                  }
               });
               source.call('DecorateAsSvgExt', {
                  LinksArray: anchors
               }).addCallback( function(SVGRecordSet) {
                  var data = SVGRecordSet.getRawData()
                  //Используем atob для декодирования base64
                  for (var i=0; i < data.d.length; i++) {
                     text = text.replace(/<a[a-zA-z=":\/\-.0-9\s]*>[a-zA-z=":\/\-.0-9\s]*<\/a>/, atob(data.d[i][1]));
                  }
                  deferred.callback(text);
               });
            });
         } else {
            return new Deferred().callback(text);
         }
         return deferred;
      }
   };

   return RichTextAreaUtil;
});