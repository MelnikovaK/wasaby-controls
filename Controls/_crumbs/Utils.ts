import ItemsUtil = require('Controls/List/resources/utils/ItemsUtil');
import getWidthUtil = require('Controls/Utils/getWidth');
import applyHighlighter = require('Controls/Utils/applyHighlighter');
import itemsTemplate = require('wml!Controls/_crumbs/View/resources/itemsTemplate');
import itemTemplate = require('wml!Controls/_crumbs/View/resources/itemTemplate');

var
    ARROW_WIDTH = 0,
    BREAD_CRUMB_MIN_WIDTH = 0,
    DOTS_WIDTH = 0,
    initialized;

var _private = {
    initializeConstants: function () {
        if (initialized) {
            return;
        }
        if (window) {
            ARROW_WIDTH = getWidthUtil.getWidth('<span class="controls-BreadCrumbsView__arrow icon-size icon-DayForward"></span>');
            BREAD_CRUMB_MIN_WIDTH = getWidthUtil.getWidth('<div class="controls-BreadCrumbsView__title_min"></div>') + ARROW_WIDTH;
            DOTS_WIDTH = getWidthUtil.getWidth(itemTemplate({
                itemData: {
                    getPropValue: ItemsUtil.getPropertyValue,
                    item: {
                        title: '...'
                    },
                    isDots: true,
                    hasArrow: true
                },
                displayProperty: 'title'
            }));
        }
        initialized = true;
    },

    getItemData: function (index, items, withOverflow = false) {
        var
            currentItem = items[index],
            count = items.length;
        return {
            getPropValue: ItemsUtil.getPropertyValue,
            item: currentItem,
            hasArrow: count > 1 && index !== 0,
            withOverflow: withOverflow
        };
    },

    getItemsSizes: function (items, displayProperty) {
        var
            measurer = document.createElement('div'),
            itemsSizes = [];

        measurer.innerHTML = itemsTemplate({
            itemTemplate: itemTemplate,
            displayProperty: displayProperty,
            applyHighlighter: applyHighlighter,
            items: items.map(function (item, index) {
                return _private.getItemData(index, items);
            })
        });
        measurer.classList.add('controls-BreadCrumbsView__measurer');
        document.body.appendChild(measurer);
        [].forEach.call(measurer.getElementsByClassName('controls-BreadCrumbsView__crumb'), function (item) {
            itemsSizes.push(item.clientWidth);
        });
        document.body.removeChild(measurer);

        return itemsSizes;
    },

    canShrink: function (itemWidth, currentWidth, availableWidth) {
        return itemWidth > BREAD_CRUMB_MIN_WIDTH && currentWidth - itemWidth + BREAD_CRUMB_MIN_WIDTH < availableWidth;
    }
};

export default {
    calculateBreadCrumbsToDraw: function (self, items, availableWidth) {
        _private.initializeConstants();

        var
            itemsSizes = _private.getItemsSizes(items, self._options.displayProperty),
            length = items.length,
            currentWidth,
            shrinkedItemIndex;
        self._visibleItems = [];

        currentWidth = itemsSizes.reduce(function (acc, width) {
            return acc + width;
        }, 0);

        if (currentWidth > availableWidth) {
            if (length > 2) {
                // Сначала пробуем замылить предпоследний элемент
                if (_private.canShrink(itemsSizes[length - 2], currentWidth, availableWidth)) {
                    for (var j = 0; j < length; j++) {
                        self._visibleItems.push(_private.getItemData(j, items, j === length - 2));
                    }
                } else {
                    // Если замылить не получилось, то добавляем точки
                    currentWidth += DOTS_WIDTH;

                    for (var i = length - 2; i > 0; i--) {
                        if (currentWidth <= availableWidth) {
                            break;
                        } else if (_private.canShrink(itemsSizes[i], currentWidth, availableWidth)) {
                            shrinkedItemIndex = i;
                            currentWidth -= itemsSizes[i] - BREAD_CRUMB_MIN_WIDTH;
                            break;
                        } else {
                            currentWidth -= itemsSizes[i];
                        }
                    }

                    // Если осталось всего 2 крошки, но места все равно не хватает, то пытаемся обрезать первый элемент.
                    if (i === 0 && currentWidth > availableWidth && itemsSizes[0] > BREAD_CRUMB_MIN_WIDTH) {
                        shrinkedItemIndex = 0;
                        currentWidth -= itemsSizes[0] - BREAD_CRUMB_MIN_WIDTH;
                    }

                    for (var j = 0; j <= i; j++) {
                        self._visibleItems.push(_private.getItemData(j, items, j === shrinkedItemIndex));
                    }

                   let dotsItem = {};
                   dotsItem[self._options.displayProperty] = '...';

                   self._visibleItems.push({
                        getPropValue: ItemsUtil.getPropertyValue,
                        item: dotsItem,
                        isDots: true,
                        hasArrow: true
                    });

                    self._visibleItems.push(_private.getItemData(length - 1, items, i === 0 && currentWidth > availableWidth && itemsSizes[length - 1] - ARROW_WIDTH > BREAD_CRUMB_MIN_WIDTH));
                }
            } else {
                self._visibleItems = items.map(function (item, index, items) {
                    var
                        hasArrow = index !== 0,
                        withOverflow = itemsSizes[index] - (hasArrow ? ARROW_WIDTH : 0) > BREAD_CRUMB_MIN_WIDTH;
                    return _private.getItemData(index, items, withOverflow);
                });
            }
        } else {
            self._visibleItems = items.map(function (item, index, items) {
                return _private.getItemData(index, items);
            });
        }
    },

    getMaxCrumbsWidth: function (items, displayProperty) {
        _private.initializeConstants();

        return _private.getItemsSizes(items, displayProperty).reduce(function (acc, width) {
            return acc + width;
        }, 0);
    },

    shouldRedraw: function (currentItems, newItems, oldWidth, availableWidth) {
        return currentItems !== newItems || oldWidth !== availableWidth;
    }
};
