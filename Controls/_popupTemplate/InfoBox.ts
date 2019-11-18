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
        if (stickyPosition.direction.horizontal === 'left' && stickyPosition.targetPoint.horizontal === 'left') {
            this._arrowSide = 'right';
            this._arrowPosition = this._getArrowPosition(stickyPosition.direction.vertical);
        } else if (stickyPosition.direction.horizontal === 'right' && stickyPosition.targetPoint.horizontal === 'right') {
            this._arrowSide = 'left';
            this._arrowPosition = this._getArrowPosition(stickyPosition.direction.vertical);
        } else if (stickyPosition.direction.vertical === 'top' && stickyPosition.targetPoint.vertical === 'top') {
            this._arrowSide = 'bottom';
            this._arrowPosition = this._getArrowPosition(stickyPosition.direction.horizontal);
        } else if (stickyPosition.direction.vertical === 'bottom' && stickyPosition.targetPoint.vertical === 'bottom') {
            this._arrowSide = 'top';
            this._arrowPosition = this._getArrowPosition(stickyPosition.direction.horizontal);
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
 * @cfg {StickyPosition} Конфигурация позиционирования вызывающего окна.
 */
/**
 * @typedef {Object} StickyPosition
 * @description Конфигурация позиционирования вызывающего окна
 * @property {Object} targetPoint Точка позиционирования.
 * @property {String} targetPoint.vertical
 * Доступные значения: top, center, bottom.
 * @property {String} targetPoint.horizontal
 * Доступные значения: right, left.
 * @property {String} verticalAlign.side
 * Доступные значения: right, left.
 * @property {String} horizontalAlign.side
 * Доступные значения: right, left.
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
