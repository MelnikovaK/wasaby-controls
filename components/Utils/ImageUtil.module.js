/**
 * Created by ps.borisov on 08.10.2015.
 */
define('js!SBIS3.CONTROLS.Utils.ImageUtil',['Core/Deferred', 'Core/constants'], function (Deferred, constants) {
   'use strict';
   /**
    * @class SBIS3.CONTROLS.Utils.ImageUtil
    * @public
    */
   var ImageUtil = /** @lends SBIS3.CONTROLS.Utils.ImageUtil.prototype */ {
       /**
        *
        * @param target
        * @returns {{width, height}}
        */
      getDimensions: function(target) {
         var
            doc = document.documentElement,
         //коэффициент отступа
            perIndent = 0.05,
         //минимальная ширина/длина модального окна
            dialogDimensionMin = 200,
         //ширина окна документа
            docWidth = doc.clientWidth,
         //длина окна документа
            docHeight = doc.clientHeight,
         //расчет процента превышения размера изображения над размером документа
            perDimension = function (docDimension, imgDimension) {
               return docDimension > imgDimension ? 1 : docDimension / imgDimension;
            },
         //выбор наибольшего соотношения сторон по которому производить уменьшение изображения
            perMostSide = function (dimensions) {
               var
                  widthPer = perDimension(dimensions.docW, dimensions.imgW),
                  heightPer = perDimension(dimensions.docH, dimensions.imgH),
               //чем больше процент, тем меньше соотношение сторон
                  isHeightMostSide = widthPer >= heightPer,
                  mostSidePer = 0;
               if (widthPer !== heightPer) {
                  mostSidePer = isHeightMostSide ? heightPer : widthPer;
                  if (mostSidePer > perIndent) {
                     mostSidePer -= perIndent;
                  }
               }
               return mostSidePer;
            },
         //расчёт сторон окна для оптимального просмотра изображения
            sideDimension = function (docDimension, imgDimension, percentageRatio) {
               if (percentageRatio) {
                  imgDimension *= percentageRatio;
               }
               return imgDimension < dialogDimensionMin ? dialogDimensionMin : imgDimension;
            },
            //функция получение реального размера изображения тк в ie8 нет naturalHeight/width
            naturalSizes = this.getNaturalSizes(target),
            targetWidth = naturalSizes.width,
            targetHeight =  naturalSizes.height,
         //процент уменьшения изображения
            perRatio = perMostSide({
               docW: docWidth,
               docH: docHeight,
               imgW: targetWidth,
               imgH: targetHeight
            });
         return {
            width: sideDimension(docWidth, targetWidth, perRatio),
            height: sideDimension(docHeight, targetHeight, perRatio)
         };
      },
       /**
        *
        * @param DOMelement
        * @returns {{width: (Number|number), height: (Number|number)}}
        */
      getNaturalSizes: function(DOMelement) {
         var img = new Image();
         img.src = DOMelement.src;
         return {width: img.width || DOMelement.naturalWidth, height: img.height || DOMelement.naturalHeight};
      },
      /**
       * Помогает перегрузить картинку, если url не изменился, а картинка изменилась
       * @param {String|jQuery|HTMLElement}img - картинка, которую надо перерисовать
       * @param [url] - адрес, откуда брать картинку
       * @param {Function} [errback]  - метод, выполняемый при возникновении ошибки
       */
      reloadImage: function (img, url) {
         var
            element,
            xhr,
            imgReady =  new Deferred();

         imgReady.addErrback(function (e) {
            return e;
         });

         if (img instanceof jQuery) {
            element = img;
         } else if (typeof img === 'string' || img instanceof HTMLElement) {
            element = $(img);
         } else {
            // Неизвестный тип
            return;
         }

         function loadImage(img, url) {
            var
               onLoadHandler = function(){
                  imgReady.callback();
                  img.removeEventListener('load', onLoadHandler);
                  img.removeEventListener('error', onErrorHandler);
               },
               onErrorHandler = function(){
                   imgReady.errback();
                   img.removeEventListener('error',onErrorHandler);
                   img.removeEventListener('load',onLoadHandler);
               },
               listenImage = function(img){
                   img.addEventListener('load', onLoadHandler);
                   img.addEventListener('error', onErrorHandler);
               };
            if (constants.browser.firefox || constants.browser.isIE12) {
               if (url.indexOf('id=') > -1) {
                  url = url.replace(/\?id=(.+?)&/, function (a, b) {
                     return a.replace(b, (new Date().getTime()));
                  });
               } else {
                  url += (url.indexOf('?') > -1 ? '&' : '?') + ('&t=' + (new Date().getTime()));
               }
               listenImage(img);
               img.setAttribute('src', url);
            } else {
               xhr = new XMLHttpRequest();
               xhr.open('GET', url, true);
               xhr.responseType = 'blob';
               xhr.onreadystatechange = function () {
                  if (xhr.readyState === 4) {
                     if (xhr.status >= 200 && xhr.status < 400) {
                        listenImage(img);
                        img.setAttribute('originsrc', url);
                        img.setAttribute('src', constants.browser.chrome ? url : URL.createObjectURL(xhr.response));
                     } else {
                        onErrorHandler();
                     }
                  }
               };
               xhr.send(null);
            }
         }

         function reload(elem) {
            url = url || element.attr('originsrc') || element.attr('src');
            if (!/^(data:|blob:)/.test(url)) {
               loadImage(elem, url);
            }
         }

         for (var i = 0, len = element.length; i < len; i++) {
            reload(element[i]);
         }

         return imgReady;
      }
   };

   return ImageUtil;
});