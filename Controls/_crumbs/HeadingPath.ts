import Control = require('Core/Control');
import BreadCrumbsUtil from './Utils'
import getWidthUtil = require('Controls/Utils/getWidth');
import ItemsUtil = require('Controls/List/resources/utils/ItemsUtil');
import FontLoadUtil = require('Controls/Utils/FontLoadUtil');
import tmplNotify = require('Controls/Utils/tmplNotify');
import applyHighlighter = require('Controls/Utils/applyHighlighter');
import template = require('wml!Controls/_crumbs/HeadingPath/HeadingPath');
import backButtonTemplate = require('wml!Controls/_crumbs/HeadingPath/Back');
import {Model} from 'Types/entity';
import Common from './HeadingPath/Common';
import 'Controls/Heading/Back';
import 'css!theme?Controls/_crumbs/HeadingPath/HeadingPath';

var _private = {
    calculateClasses: function (self, maxCrumbsWidth, backButtonWidth, availableWidth) {
        if (maxCrumbsWidth < availableWidth / 2 && backButtonWidth < availableWidth / 2) {
            self._backButtonClass = '';
            self._breadCrumbsClass = '';
        } else if (maxCrumbsWidth < availableWidth / 2 && backButtonWidth > availableWidth / 2) {
            self._backButtonClass = 'controls-BreadCrumbsPath__backButton_long';
            self._breadCrumbsClass = 'controls-BreadCrumbsPath__breadCrumbs_short';
        } else if (maxCrumbsWidth > availableWidth / 2 && backButtonWidth > availableWidth / 2) {
            self._backButtonClass = 'controls-BreadCrumbsPath__backButton_half';
            self._breadCrumbsClass = 'controls-BreadCrumbsPath__breadCrumbs_half';
        } else if (maxCrumbsWidth > availableWidth / 2 && backButtonWidth < availableWidth / 2) {
            self._backButtonClass = 'controls-BreadCrumbsPath__backButton_short';
            self._breadCrumbsClass = 'controls-BreadCrumbsPath__breadCrumbs_long';
        }
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
              _private.calculateClasses(self, BreadCrumbsUtil.getMaxCrumbsWidth(self._breadCrumbsItems, options.displayProperty), backButtonWidth, containerWidth - homeWidth);

              availableWidth = self._breadCrumbsClass === 'controls-BreadCrumbsPath__breadCrumbs_half' ? containerWidth / 2 : containerWidth;
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
    }
};

/**
 * Breadcrumbs with back button.
 *
 * @class Controls/_crumbs/HeadingPath
 * @extends Core/Control
 * @mixes Controls/interface/IBreadCrumbs
 * @mixes Controls/_crumbs/PathStyles
 * @mixes Controls/interface/IHighlighter
 * @control
 * @public
 * @author Зайцев А.С.
 *
 * @demo Controls-demo/BreadCrumbs/PathPG
 */

/**
 * @name Controls/_crumbs/HeadingPath#backButtonStyle
 * @cfg {String} Back heading display style.
 * @default secondary
 * @see Controls/Heading/Back#style
 */

/**
 * @event Controls/_crumbs/HeadingPath#arrowActivated Happens after clicking the button "View Model".
 * @param {Core/vdom/Synchronizer/resources/SyntheticEvent} eventObject Descriptor of the event.
 */

/**
 * @name Controls/_crumbs/HeadingPath#showActionButton
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

    _afterMount: function () {
        this._oldWidth = this._container.clientWidth;
        if (this._options.items && this._options.items.length > 0) {
            FontLoadUtil.waitForFontLoad('controls-BreadCrumbsView__crumbMeasurer').addCallback(function () {
                FontLoadUtil.waitForFontLoad('controls-BreadCrumbsPath__backButtonMeasurer').addCallback(function () {
                    _private.calculateItems(this, this._options, this._oldWidth);
                    this._forceUpdate();
                }.bind(this));
            }.bind(this));
        }
    },

    _beforeUpdate: function (newOptions) {
        var containerWidth = this._container.clientWidth;
        if (BreadCrumbsUtil.shouldRedraw(this._options.items, newOptions.items, this._oldWidth, containerWidth)) {
            this._oldWidth = containerWidth;
            _private.calculateItems(this, newOptions, containerWidth);
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
    },

    _onHomeClick: function () {
        this._notify('itemClick', [this._getRootModel(this._options.root, this._options.keyProperty)]);
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

export default BreadCrumbsPath;
