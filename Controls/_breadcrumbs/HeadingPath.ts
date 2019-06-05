import Control = require('Core/Control');
import BreadCrumbsUtil from './Utils'
import getWidthUtil = require('Controls/Utils/getWidth');
import {ItemsUtil} from 'Controls/list';
import FontLoadUtil = require('Controls/Utils/FontLoadUtil');
import tmplNotify = require('Controls/Utils/tmplNotify');
import applyHighlighter = require('Controls/Utils/applyHighlighter');
import template = require('wml!Controls/_breadcrumbs/HeadingPath/HeadingPath');
import backButtonTemplate = require('wml!Controls/_breadcrumbs/HeadingPath/Back');
import Common from './HeadingPath/Common';
import 'Controls/heading';

var _private = {
    calculateClasses(
       self,
       maxCrumbsWidth: number,
       minCrumbsWidth: number,
       backButtonWidth: number,
       availableWidth: number
    ): void {
        if (maxCrumbsWidth > availableWidth / 2 && backButtonWidth > availableWidth / 2) {
           self._backButtonClass = 'controls-BreadCrumbsPath__backButton_half';
           self._breadCrumbsClass = 'controls-BreadCrumbsPath__breadCrumbs_half';
        } else {
           if (availableWidth - backButtonWidth < minCrumbsWidth || backButtonWidth > availableWidth / 2) {
              self._backButtonClass = 'controls-BreadCrumbsPath__backButton_short';
           } else {
              self._backButtonClass = '';
           }
           if (maxCrumbsWidth > availableWidth / 2) {
              self._breadCrumbsClass = 'controls-BreadCrumbsPath__breadCrumbs_short';
           } else {
              self._breadCrumbsClass = '';
           }
        }
    },

   getBackButtonMinWidth(): number {
       return getWidthUtil.getWidth(backButtonTemplate({
          _options: {
             backButtonCaption: '1',
             backButtonClass: 'controls-BreadCrumbsPath__backButton_short controls-BreadCrumbsPath__backButton_zeroWidth'
          }
       }));
   },

    calculateItems: function (self, options, containerWidth) {
        var
            backButtonWidth,
            availableWidth,
            homeWidth;

        self._backButtonCaption = ItemsUtil.getPropertyValue(options.items[options.items.length - 1], self._options.displayProperty);
        if (options.items.length > 1) {
            self._breadCrumbsItems = options.items.slice(0, options.items.length - 1);
           homeWidth = getWidthUtil.getWidth('<div class="controls-BreadCrumbsPath__home icon-size icon-Home3"></div>');
           if (!options.header) {
              backButtonWidth = getWidthUtil.getWidth(backButtonTemplate({
                 _options: {
                    backButtonCaption: self._backButtonCaption,
                    counterCaption: self._getCounterCaption(options.items)
                 }
              }));
              _private.calculateClasses(
                 self,
                 BreadCrumbsUtil.getMaxCrumbsWidth(self._breadCrumbsItems, options.displayProperty),
                 BreadCrumbsUtil.getMinCrumbsWidth(self._breadCrumbsItems.length),
                 backButtonWidth,
                 containerWidth - homeWidth
              );

              if (self._breadCrumbsClass === 'controls-BreadCrumbsPath__breadCrumbs_half') {
                  availableWidth = containerWidth / 2;
              } else if (self._backButtonClass === 'controls-BreadCrumbsPath__backButton_short') {
                  availableWidth = containerWidth - self._backButtonMinWidth;
              } else {
                  availableWidth = containerWidth - backButtonWidth;
              }
              BreadCrumbsUtil.calculateBreadCrumbsToDraw(self, self._breadCrumbsItems, availableWidth - homeWidth);
           } else {
              BreadCrumbsUtil.calculateBreadCrumbsToDraw(self, self._breadCrumbsItems, containerWidth - homeWidth);
              self._breadCrumbsClass = 'controls-BreadCrumbsPath__breadCrumbs_short';
           }
        } else {
            self._visibleItems = null;
            self._breadCrumbsItems = null;
            self._backButtonClass = '';
            self._breadCrumbsClass = '';
        }
        self._viewUpdated = true;
    }
};

/**
 * Breadcrumbs with back button.
 * <a href="/materials/demo-ws4-breadcrumbs">Demo</a>.
 *
 * @class Controls/_breadcrumbs/HeadingPath
 * @extends Core/Control
 * @mixes Controls/interface/IBreadCrumbs
 * @mixes Controls/_breadcrumbs/PathStyles
 * @mixes Controls/interface/IHighlighter
 * @control
 * @public
 * @author Авраменко А.С.
 *
 * @demo Controls-demo/BreadCrumbs/PathPG
 */

/**
 * @name Controls/_breadcrumbs/HeadingPath#backButtonStyle
 * @cfg {String} Back heading display style.
 * @variant primary
 * @variant secondary
 * @default secondary
 * @see Controls/_heading/Back#style
 */

/**
 * @event Controls/_breadcrumbs/HeadingPath#arrowActivated Happens after clicking the button "View Model".
 * @param {Core/vdom/Synchronizer/resources/SyntheticEvent} eventObject Descriptor of the event.
 */

/**
 * @name Controls/_breadcrumbs/HeadingPath#showActionButton
 * @cfg {Boolean} Determines whether the arrow near "back" button should be shown.
 * @default
 * true
 */

var BreadCrumbsPath = Control.extend({
    _template: template,
    _backButtonCaption: '',
    _visibleItems: null,
    _breadCrumbsItems: null,
    _backButtonClass: '',
    _breadCrumbsClass: '',
    _oldWidth: 0,
    _viewUpdated: false,
    _backButtonMinWidth: 0,

    _afterMount: function () {
        this._oldWidth = this._container.clientWidth;
        if (this._options.items && this._options.items.length > 0) {
            FontLoadUtil.waitForFontLoad('controls-BreadCrumbsView__crumbMeasurer').addCallback(function () {
                FontLoadUtil.waitForFontLoad('controls-BreadCrumbsPath__backButtonMeasurer').addCallback(function () {
                    this._backButtonMinWidth = _private.getBackButtonMinWidth();
                    _private.calculateItems(this, this._options, this._oldWidth);
                    this._forceUpdate();
                }.bind(this));
            }.bind(this));
        }
    },

    _beforeUpdate: function (newOptions) {
        if (this._options.theme !== newOptions.theme) {
           this._backButtonMinWidth = _private.getBackButtonMinWidth();
        }
        var containerWidth = this._container.clientWidth;
        if (BreadCrumbsUtil.shouldRedraw(this._options.items, newOptions.items, this._oldWidth, containerWidth)) {
            this._oldWidth = containerWidth;
            _private.calculateItems(this, newOptions, containerWidth);
        }
    },

    _afterUpdate: function() {
        if (this._viewUpdated) {
            this._viewUpdated = false;
            this._notify('controlResize', [], {bubbling: true});
        }
    },

    _notifyHandler: tmplNotify,
    _applyHighlighter: applyHighlighter,
    _getRootModel: Common.getRootModel,

    _onBackButtonClick: function (e: Event) {
        Common.onBackButtonClick.call(this, e);
    },

    _onResize: function () {
        // Пустой обработчик чисто ради того, чтобы при ресайзе запускалась перерисовка
       // todo здесь нужно звать _forceUpdate чтобы произошла перерисовка, потому что логика пересчета в _beforeUpdate. нужно оттуда логику выносить сюда!
       this._forceUpdate();
    },

    _onHomeClick: function () {
       /**
        * TODO: _options.root is actually current root, so it's wrong to use it. For now, we can take root from the first item. Revert this commit after:
        * https://online.sbis.ru/opendoc.html?guid=93986788-48e1-48df-9595-be9d8fb99e81
        */
       this._notify('itemClick', [this._getRootModel(this._options.items[0].get(this._options.parentProperty), this._options.keyProperty)]);
    },

    _onArrowClick: function (e: Event) {
        Common.onArrowClick.call(this, e);
    },

   _getCounterCaption: function(items) {
      return items[items.length - 1].get('counterCaption');
   }
});

BreadCrumbsPath.getDefaultOptions = function () {
    return {
        displayProperty: 'title',
        root: null,
        backButtonStyle: 'secondary',
        showActionButton: true,
    };
};

BreadCrumbsPath._theme = ['Controls/crumbs'];

export default BreadCrumbsPath;
