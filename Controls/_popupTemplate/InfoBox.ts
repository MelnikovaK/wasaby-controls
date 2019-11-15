import Control = require('Core/Control');
import template = require('wml!Controls/_popupTemplate/InfoBox/InfoBox');
import Env = require('Env/Env');
import 'css!theme?Controls/popupTemplate';

/**
 * Базовый шаблон {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/controls/openers/infobox/ всплывающей подсказки}.
 * @class Controls/_popupTemplate/InfoBox
 * @extends Core/Control
 * @control
 * @public
 * @author Красильников А.С.
 */
var InfoBoxTemplate = Control.extend({
    _template: template,

    _beforeMount: function(newOptions) {
        this._setPositionSide(newOptions.stickyPosition);
    },

    _beforeUpdate: function(newOptions) {
        this._setPositionSide(newOptions.stickyPosition);
    },

    _setPositionSide: function(stickyPosition) {
        if (stickyPosition.horizontalAlign.side === 'left' && stickyPosition.targetPoint.horizontal === 'left') {
            this._arrowSide = 'right';
            this._arrowPosition = this._getArrowPosition(stickyPosition.verticalAlign.side);
        } else if (stickyPosition.horizontalAlign.side === 'right' && stickyPosition.targetPoint.horizontal === 'right') {
            this._arrowSide = 'left';
            this._arrowPosition = this._getArrowPosition(stickyPosition.verticalAlign.side);
        } else if (stickyPosition.verticalAlign.side === 'top' && stickyPosition.targetPoint.vertical === 'top') {
            this._arrowSide = 'bottom';
            this._arrowPosition = this._getArrowPosition(stickyPosition.horizontalAlign.side);
        } else if (stickyPosition.verticalAlign.side === 'bottom' && stickyPosition.targetPoint.vertical === 'bottom') {
            this._arrowSide = 'top';
            this._arrowPosition = this._getArrowPosition(stickyPosition.horizontalAlign.side);
        }
    },

    _getArrowPosition: function(side) {
        if (side === 'left' || side === 'top') {
            return 'end';
        }
        if (side === 'right' || side === 'bottom') {
            return 'start'
        }
        return 'center';
    },

    _close: function() {
       this._notify('close', [], { bubbling: true });
    }
});
/**
 * @name Controls/_popupTemplate/InfoBox#closeButtonVisibility
 * @cfg {Boolean} Устанавливает видимость кнопки, закрывающей окно.
 * @default true
 */
/**
 * @name Controls/_popupTemplate/InfoBox#style
 * @cfg {String} Устанавливает стиль отображения окна уведомления.
 * @default secondary
 * @variant warning
 * @variant secondary
 * @variant success
 * @variant danger
 * @default secondary
 */
/**
 * @name Controls/_popupTemplate/InfoBox#stickyPosition
 * @cfg {StickyPosition} Конфигурация позиционирования окна.
 */
/**
 * @typedef {Object} StickyPosition
 * @property {Object} targetPoint
 * @property {String} targetPoint.vertical
 * * top
 * * bottom
 * @property {String} targetPoint.horizontal
 * * right
 * * left
 * @property {String} verticalAlign.side
 * * right
 * * left
 * @property {String} horizontalAlign.side
 * * right
 * * left
 * 
 */
InfoBoxTemplate.getDefaultOptions = function() {
    return {
        closeButtonVisibility: true,
        styleType: 'marker',
        style: 'default'
    };
};

export = InfoBoxTemplate;
