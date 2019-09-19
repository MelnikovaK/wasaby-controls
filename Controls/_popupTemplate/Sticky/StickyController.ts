import BaseController = require('Controls/_popupTemplate/BaseController');
import StickyStrategy = require('Controls/_popupTemplate/Sticky/StickyStrategy');
import cMerge = require('Core/core-merge');
import cClone = require('Core/core-clone');
import Env = require('Env/Env');
import TargetCoords = require('Controls/_popupTemplate/TargetCoords');
import StickyContent = require('wml!Controls/_popupTemplate/Sticky/StickyContent');
import 'css!theme?Controls/popupTemplate';

const DEFAULT_OPTIONS = {
    horizontalAlign: {
        side: 'right',
        offset: 0
    },
    verticalAlign: {
        side: 'bottom',
        offset: 0
    },
    corner: {
        vertical: 'top',
        horizontal: 'left'
    }
};

const _private = {
    prepareOriginPoint(config) {
        const newCfg = cClone(config);
        newCfg.verticalAlign = newCfg.verticalAlign || {};
        newCfg.horizontalAlign = newCfg.horizontalAlign || {};
        if (config.direction && typeof (config.direction) === 'object') {
            if ('horizontal' in config.direction) {
                newCfg.horizontalAlign.side = config.direction.horizontal;
            }
            if ('vertical' in config.direction) {
                newCfg.verticalAlign.side = config.direction.vertical;
            }
        }
        if (config.offset) {
            if ('horizontal' in config.offset) {
                newCfg.horizontalAlign.offset = config.offset.horizontal;
            }
            if ('vertical' in config.offset) {
                newCfg.verticalAlign.offset = config.offset.vertical;
            }
        }
        if (config.targetPoint) {
            newCfg.corner = newCfg.corner || {};
            if ('vertical' in config.targetPoint) {
                newCfg.corner = {
                    vertical: config.targetPoint.vertical
                };
            }
            if ('horizontal' in config.targetPoint) {
                newCfg.corner.horizontal = config.targetPoint.horizontal;
            }

        }
        return newCfg;
    },
    prepareConfig(self, cfg, sizes) {
        cfg.popupOptions = _private.prepareOriginPoint(cfg.popupOptions);
        const popupCfg = self._getPopupConfig(cfg, sizes);

        cfg.position = StickyStrategy.getPosition(popupCfg, _private._getTargetCoords(cfg, sizes));

        cfg.popupOptions.stickyPosition = this.prepareStickyPosition(popupCfg);

        cfg.positionConfig = popupCfg;
        _private.updateClasses(cfg, popupCfg);
    },

    updateClasses(cfg, popupCfg) {
        // Remove the previous classes of direction and add new ones
        _private.removeOrientationClasses(cfg);
        cfg.popupOptions.className = (cfg.popupOptions.className || '') + ' ' + _private.getOrientationClasses(popupCfg);
    },

    getOrientationClasses(cfg) {
        let className = 'controls-Popup-corner-vertical-' + cfg.corner.vertical;
        className += ' controls-Popup-corner-horizontal-' + cfg.corner.horizontal;
        className += ' controls-Popup-align-horizontal-' + cfg.align.horizontal.side;
        className += ' controls-Popup-align-vertical-' + cfg.align.vertical.side;
        className += ' controls-Sticky__reset-margins';
        return className;
    },

    removeOrientationClasses(cfg) {
        if (cfg.popupOptions.className) {
            cfg.popupOptions.className = cfg.popupOptions.className.replace(/controls-Popup-corner\S*|controls-Popup-align\S*|controls-Sticky__reset-margins/g, '').trim();
        }
    },

    _getTargetCoords(cfg, sizes) {
        if (cfg.popupOptions.nativeEvent) {
            const top = cfg.popupOptions.nativeEvent.clientY;
            const left = cfg.popupOptions.nativeEvent.clientX;
            const size = 1;
            const positionCfg = {
                verticalAlign: {
                    side: 'bottom'
                },
                horizontalAlign: {
                    side: 'right'
                }
            };
            cMerge(cfg.popupOptions, positionCfg);
            sizes.margins = {top: 0, left: 0};
            return {
                width: size,
                height: size,
                top,
                left,
                bottom: top + size,
                right: left + size,
                topScroll: 0,
                leftScroll: 0
            };
        }

        if (!document) {
            return {
                width: 0,
                height: 0,
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                topScroll: 0,
                leftScroll: 0
            };
        }

        return TargetCoords.get(cfg.popupOptions.target ? cfg.popupOptions.target : document.body);
    },

    isTargetVisible(item) {
        const targetCoords = _private._getTargetCoords(item, {});
        return !!targetCoords.width;
    },

    prepareStickyPosition(cfg) {
        return {
            horizontalAlign: cfg.align.horizontal,
            verticalAlign: cfg.align.vertical,
            corner: cfg.corner
        };
    },

    getWindowWidth() {
        return window && window.innerWidth;
    },
    setStickyContent(item) {
        item.popupOptions.content = StickyContent;
    }
};

/**
 * Sticky Popup Controller
 * @class Controls/_popupTemplate/Sticky/StickyController
 * @control
 * @private
 * @category Popup
 */
const StickyController = BaseController.extend({

    elementCreated(item, container) {
        if (_private.isTargetVisible(item)) {
            _private.setStickyContent(item);
            item.position.position = undefined;
            this.prepareConfig(item, container);
        } else {
            require('Controls/popup').Controller.remove(item.id);
        }
    },

    elementUpdated(item, container) {
        _private.setStickyContent(item);
        item.popupOptions.stickyPosition = _private.prepareStickyPosition(item.positionConfig);
        if (_private.isTargetVisible(item)) {
            _private.updateClasses(item, item.positionConfig);
            item.position = StickyStrategy.getPosition(item.positionConfig, _private._getTargetCoords(item, item.positionConfig.sizes));

            // In landscape orientation, the height of the screen is low when the keyboard is opened.
            // Open Windows are not placed in the workspace and chrome scrollit body.
            if (Env.detection.isMobileAndroid) {
                const height = item.position.height || container.clientHeight;
                if (height > document.body.clientHeight) {
                    item.position.height = document.body.clientHeight;
                    item.position.top = 0;
                } else if (item.position.height + item.position.top > document.body.clientHeight) {
                    // opening the keyboard reduces the height of the body. If popup was positioned at the bottom of
                    // the window, he did not have time to change his top coordinate => a scroll appeared on the body
                    const dif = item.position.height + item.position.top - document.body.clientHeight;
                    item.position.top -= dif;
                }
            }
        } else {
            require('Controls/popup').Controller.remove(item.id);
        }
    },

    elementAfterUpdated(item, container) {
        /* start: We remove the set values that affect the size and positioning to get the real size of the content */
        const width = container.style.width;
        const height = container.style.height;
        container.style.width = 'auto';
        container.style.height = 'auto';

        /* end: We remove the set values that affect the size and positioning to get the real size of the content */

        this.prepareConfig(item, container);

        /* start: Return all values to the node. Need for vdom synchronizer */
        container.style.width = width;
        container.style.height = height;

        /* end: Return all values to the node. Need for vdom synchronizer */
        return true;
    },

    popupResize(item, container): Boolean {
        return this.elementAfterUpdated(item, container);
    },

    getDefaultConfig(item) {
        _private.setStickyContent(item);
        item.popupOptions = _private.prepareOriginPoint(item.popupOptions);
        const popupCfg = this._getPopupConfig(item);
        item.popupOptions.stickyPosition = _private.prepareStickyPosition(popupCfg);
        item.position = {
            top: -10000,
            left: -10000,
            maxWidth: item.popupOptions.maxWidth || _private.getWindowWidth(),

            // Error on ios when position: absolute container is created outside the screen and stretches the page
            // which leads to incorrect positioning due to incorrect coordinates. + on page scroll event firing
            // Treated position:fixed when positioning pop-up outside the screen
            position: 'fixed'
        };
    },

    prepareConfig(item, container) {
        _private.removeOrientationClasses(item);
        const sizes = this._getPopupSizes(item, container);
        _private.prepareConfig(this, item, sizes);
    },

    needRecalcOnKeyboardShow() {
        return true;
    },
    _getPopupConfig(cfg, sizes) {
        return {
            corner: cMerge(cClone(DEFAULT_OPTIONS.corner), cfg.popupOptions.corner || {}),
            align: {
                horizontal: cMerge(cClone(DEFAULT_OPTIONS.horizontalAlign), cfg.popupOptions.horizontalAlign || {}),
                vertical: cMerge(cClone(DEFAULT_OPTIONS.verticalAlign), cfg.popupOptions.verticalAlign || {})
            },
            config: {
                width: cfg.popupOptions.width,
                height: cfg.popupOptions.height,
                minWidth: cfg.popupOptions.minWidth,
                minHeight: cfg.popupOptions.minHeight,
                maxWidth: cfg.popupOptions.maxWidth,
                maxHeight: cfg.popupOptions.maxHeight
            },
            sizes,
            fittingMode: cfg.popupOptions.fittingMode
        };
    },
    TYPE: 'Sticky',
    _private
});

export = new StickyController();

