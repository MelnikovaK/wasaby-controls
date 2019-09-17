import Control = require('Core/Control');
import tmplNotify = require('Controls/Utils/tmplNotify');
import template = require('wml!Controls/_explorer/PathController/PathController');
import {HeadingPathBack, HeadingPathCommon} from 'Controls/breadcrumbs';
import {ItemsUtil} from 'Controls/list';
import GridIsEqualUtil = require('Controls/_grid/utils/GridIsEqualUtil');


   var _private = {
      getHeader: function(self, options) {
         var newHeader;
         if (options.items && options.header && options.header.length && !options.header[0].title && !options.header[0].template) {
            newHeader = options.header.slice();
            newHeader[0] = {
               template: HeadingPathBack,
               templateOptions: {
                  backButtonClass: 'controls-BreadCrumbsPath__backButton__wrapper_inHeader',
                  showActionButton: options.showActionButton !== false && !!options.task1177860157,
                  showArrowOutsideOfBackButton: !!options.task1177860157,
                  backButtonStyle: options.backButtonStyle,
                  backButtonCaption: ItemsUtil.getPropertyValue(options.items[options.items.length - 1], options.displayProperty),
                  counterCaption: options.items[options.items.length - 1].get('counterCaption')
               },
               width: options.header[0].width,

               // TODO: удалить эту опцию после https://online.sbis.ru/opendoc.html?guid=b3647c3e-ac44-489c-958f-12fe6118892f
               isBreadCrumbs: true
            };
         }
         return newHeader;
      },

      needCrumbs: function(header, items, rootVisible) {
         return !!items && ((!header && items.length > 0) || items.length > 1) || !!rootVisible;
      },

      needShadow: function(header, headerCfg) {

         //если есть заголовок, то тень будет под ним, и нам не нужно рисовать ее под хлебными крошками
         return !(header || headerCfg);
      }
   };

   var PathController = Control.extend({
      _template: template,
      _header: null,
      _needCrumbs: false,
      _needShadow: false,

      _beforeMount: function(options) {
         this._header = _private.getHeader(this, options);
         this._needCrumbs = _private.needCrumbs(this._header, options.items);
         this._needShadow = _private.needShadow(this._header, options.header);
      },

      _beforeUpdate: function(newOptions) {
         if (this._options.rootVisible !== newOptions.rootVisible || this._options.items !== newOptions.items || !GridIsEqualUtil.isEqualWithSkip(this._options.header, newOptions.header, { template: true })) {
            this._header = _private.getHeader(this, newOptions);
            this._needCrumbs = _private.needCrumbs(this._header, newOptions.items, newOptions.rootVisible);
            this._needShadow = _private.needShadow(this._header, newOptions.header);
         }
      },

      _notifyHandler: tmplNotify,

      _onBackButtonClick: function(e) {
         HeadingPathCommon.onBackButtonClick.call(this, e);
      },

   });
   PathController._private = _private;
   export = PathController;

