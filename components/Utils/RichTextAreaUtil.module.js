/**
 * Created by ps.borisov on 03.12.2015.
 */
define('js!SBIS3.CONTROLS.Utils.RichTextAreaUtil',[
   "Core/constants"
], function( constants) {
   'use strict';
   /**
    * Утилиты для работы с контентом полученным из Богатого текстового редактора
    * @class SBIS3.CONTROLS.Utils.RichTextAreaUtil
    * @author Авраменко А.С.
    * @public
    */
   var RichTextAreaUtil = /** @lends SBIS3.CONTROLS.Utils.RichTextAreaUtil.prototype */{
      /**
       * Метод для добавления определяющей метки в контент при копировании/вырезки из БТРа
       * @param {$object}$object - jquery элемент при копировании/вырезке из которого в буффер необходимо добавлять метку БТРа
       */
      markRichContentOnCopy: function(target){
         target = target.get(0);
         //На ipad`e нет аозможности задать clipboardData, форматное копирование с меткой не поддерживаем
         //Firefox не поддерживает копирование со стилями
         if (!constants.browser.isMobileIOS && !constants.browser.firefox) {
            if (target.addEventListener) {
               target.addEventListener('copy', this._markingRichContent, true);
               target.addEventListener('cut', this._markingRichContent, true);
            } else {
               //on в отличие от attachEvent в приходящем событии позволяет получить таргет
               $(target).on('cut copy', this._markingRichContent);
            }
         }
      },
      unmarkRichContentOnCopy: function(target){
         target = target.get(0);
         if (!constants.browser.isMobileIOS && !constants.browser.firefox) {
            //в webkit в бтре идёт подписка на cut и удаляется лишний символ, поэтому нужно подписываться на capture фазе
            if (target.removeEventListener) {
               target.removeEventListener('copy', this._markingRichContent, true);
               target.removeEventListener('cut', this._markingRichContent, true);
            } else {
               $(target).off('cut copy', this._markingRichContent);
            }
         }
      },
      /**
       * Оборачивает контент в div с событием открывающим изображение в диалоговом окне
       * @param {html} контент который необходимо обернуть
       * @returns {html}
       * */
      wrapRichContent: function(html) {
         var contentClass = 'content-wrap';
         return html && html.search(contentClass) === -1 && html.search('img') !== -1 ?
         '<div class="' + contentClass + '" onclick="$ws.helpers.openImageViewer.apply(this, arguments)">\n' + html + '\n</div>'
            : html;
      },
      /*Блок приватных методов*/
      _markingRichContent: function(e) {
         var
            event =  e.originalEvent ? e.originalEvent : e,
            oldOrphans = event.target.style.orphans;
         event.target.style.orphans = '31415'; //Pi
         setTimeout(function() {
            event.target.style.orphans = oldOrphans;
         });
      }
   };

   return RichTextAreaUtil;
});