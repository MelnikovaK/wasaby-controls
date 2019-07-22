import {descriptor} from 'Types/entity';
import dateControlsUtils from './../Utils';

/**
 * mixin Controls/_dateRange/interfaces/ILinkView
 * @public
 */
var EMPTY_CAPTIONS = {
    NOT_SPECIFIED: rk('Не указан'),
    NOT_SELECTED: rk('Не выбран'),
    WITHOUT_DUE_DATE: rk('Бессрочно', 'ShortForm'),
    ALL_TIME: rk('Весь период')
};

export default {
    getDefaultOptions: function () {
        return {

            /**
             * @name Controls/_dateRange/interfaces/ILinkView#style
             * @cfg {String} Display style of control.
             * @variant default Control display as default style.
             * @variant linkMain Control display as main link style.
             * @variant linkMain2 Control display as first nonaccent link style.
             * @variant linkAdditional Control display as third nonaccent link style.
             * @deprecated Вместо этого используйте опции {@link viewMode} и {@link styleMode}.
             */

            /*
             * @name Controls/_dateRange/interfaces/ILinkView#style
             * @cfg {String} Display style of control.
             * @variant default Control display as default style.
             * @variant linkMain Control display as main link style.
             * @variant linkMain2 Control display as first nonaccent link style.
             * @variant linkAdditional Control display as third nonaccent link style.
             * @deprecated Use options {@link viewMode} and {@link styleMode} instead.
             */
            style: undefined,

            /**
             * @name Controls/_dateRange/interfaces/ILinkView#viewMode
             * @cfg {String} Режим отображения контрола.
             * @variant selector Стиль отображения по умолчанию.
             * @variant link Отображение контрола в виде кнопки-ссылки.
             * @variant label Отображение контрола в виде метки.
             */

            /*
             * @name Controls/_dateRange/interfaces/ILinkView#viewMode
             * @cfg {String} Display view of control.
             * @variant selector Control display as default style.
             * @variant link Control display as link button.
             * @variant label Control display as lable.
             */
            viewMode: 'selector',

            /**
             * @name Controls/_dateRange/interfaces/ILinkView#styleMode
             * @cfg {String} Стиль отображения контрола. Различные режимы просмотра поддерживают различные стили. 
             * @variant secondary Стиль по умолчанию для режима просмотра селектора и ссылки. Стиль отображения "secondary".
             * @variant info Стиль по умолчанию для режима просмотра селектора и ссылки. Стиль отображения "info".
             */

            /*
             * @name Controls/_dateRange/interfaces/ILinkView#styleMode
             * @cfg {String} Display style of control. Different view modes support different styles.
             * @variant secondary Default style for selector and link view mode. Control display as secondry style.
             * @variant info Style for selector and link view mode. Control display as info style.
             */
            styleMode: undefined,

            linkClickable: true,

            /**
             * @name Controls/_dateRange/interfaces/ILinkView#showNextArrow
             * @cfg {Boolean} Display the control arrow to switch to the next period
             * @deprecated Вместо этого используйте опцию {@link nextArrowVisibility}.
             */

            /*
             * @name Controls/_dateRange/interfaces/ILinkView#showNextArrow
             * @cfg {Boolean} Display the control arrow to switch to the next period
             * @deprecated Use options {@link nextArrowVisibility} instead.
             */
            showNextArrow: false,

            /**
             * @name Controls/_dateRange/interfaces/ILinkView#showPrevArrow
             * @cfg {Boolean} Display the control arrow to switch to the previous period
             * @deprecated Вместо этого используйте опцию {@link prevArrowVisibility}.
             */

            /*
             * @name Controls/_dateRange/interfaces/ILinkView#showPrevArrow
             * @cfg {Boolean} Display the control arrow to switch to the previous period
             * @deprecated Use options {@link prevArrowVisibility} instead.
             */             
            showPrevArrow: false,

            /**
             * @name Controls/_dateRange/interfaces/ILinkView#nextArrowVisibility
             * @cfg {Boolean} Отображает стрелку перехода к следующему периоду.
             */

            /*
             * @name Controls/_dateRange/interfaces/ILinkView#nextArrowVisibility
             * @cfg {Boolean} Display the control arrow to switch to the next period
             */
            nextArrowVisibility: false,

            /**
             * @name Controls/_dateRange/interfaces/ILinkView#prevArrowVisibility
             * @cfg {Boolean} Отображает стрелку перехода к предыдущему периоду.
             */

            /*
             * @name Controls/_dateRange/interfaces/ILinkView#prevArrowVisibility
             * @cfg {Boolean} Display the control arrow to switch to the previous period
             */
            prevArrowVisibility: false,

            /**
             * @name Controls/_dateRange/interfaces/ILinkView#showDeleteButton
             * @cfg {Boolean} Включает/отключает отображение кнопки очистки периода. 
             */

            /*
             * @name Controls/_dateRange/interfaces/ILinkView#showDeleteButton
             * @cfg {Boolean} Enables or disables the display of the period clear button.
             */
            showDeleteButton: true,

            /**
             * @name Controls/_dateRange/interfaces/ILinkView#emptyCaption
             * @cfg {String} Текст, который используется, если период не выбран.
             */

            /*
             * @name Controls/_dateRange/interfaces/ILinkView#emptyCaption
             * @cfg {String} Text that is used if the period is not selected.
             */
            emptyCaption: EMPTY_CAPTIONS.NOT_SPECIFIED,

            /**
             * @name Controls/_dateRange/interfaces/ILinkView#captionFormatter
             * @cfg {Function} Функция форматирования заголовка.
             */

            /*
             * @name Controls/_dateRange/interfaces/ILinkView#captionFormatter
             * @cfg {Function} Caption formatting function.
             */
            captionFormatter: dateControlsUtils.formatDateRangeCaption
        };
    },

    EMPTY_CAPTIONS: EMPTY_CAPTIONS,

    getOptionTypes: function () {
        return {
            style: descriptor(String).oneOf([
                'default',
                'linkMain',
                'linkMain2',
                'linkAdditional',
                'secondary'
            ]),
            viewMode: descriptor(String).oneOf([
               'selector',
               'link',
               'label'
            ]),
            styleMode: descriptor(String).oneOf([
               'secondary',
               'info'
            ]),
            showNextArrow: descriptor(Boolean),
            showPrevArrow: descriptor(Boolean),
            nextArrowVisibility: descriptor(Boolean),
            prevArrowVisibility: descriptor(Boolean),
            showDeleteButton: descriptor(Boolean),
            emptyCaption: descriptor(String),
            captionFormatter: descriptor(Function)
        };
    }
};
