import {Control, IControlOptions, TemplateFunction} from 'UI/Base';
import {IoC} from 'Env/Env';
import {descriptor as EntityDescriptor} from 'Types/entity';
import SliderTemplate = require('wml!Controls/_slider/sliderTemplate');
import {IScaleData, ILineData, IPointDataList, default as Utils} from './Utils';
import { SyntheticEvent } from 'Vdom/Vdom';

export interface ISliderBaseOptions extends IControlOptions {
   size?: string;
   borderVisible?: boolean;
   minValue: number;
   maxValue: number;
   scaleStep?: number;
   value: number;
   precision: number;
}

const maxPercentValue = 100;

/**
 * Базовый слайдер с одним подвижным ползунком для выбора значения.
 *
 * <a href="/materials/demo-ws4-sliderbase">Демо-пример</a>.
 * @public
 * @extends Core/Control
 * @class Controls/_slider/Base
 * @author Колесов В.А.
 * @demo Controls-demo/Slider/Base/SliderBaseDemo
 */

/*
 * Basic slider with single movable point for choosing value.
 *
 * <a href="/materials/demo-ws4-sliderbase">Demo-example</a>.
 * @public
 * @extends Core/Control
 * @class Controls/_slider/Base
 * @author Колесов В.А.
 * @demo Controls-demo/Slider/Base/SliderBaseDemo
 */

/**
 * @name Controls/_slider/Base#size
 * @cfg {String} Устанавливает размер ползунка слайдера.
 * @variant s
 * @variant m
 * @default m
 * @example
 * Слайдер с диаметром ползунка = 12px
 * <pre class="brush:html">
 *   <Controls.slider:Base size="s"/>
 * </pre>
 */

/*
 * @name Controls/_slider/Base#size
 * @cfg {String} sets the size of slider point
 * @example
 * Slider with diameter of point = 12px
 * <pre class="brush:html">
 *   <Controls.slider:Base size="s"/>
 * </pre>
 */

/**
 * @name Controls/_slider/Base#borderVisible
 * @cfg {Boolean} Устанавливает границу вокруг контрола.
 * @example
 * Слайдер с границей:
 * <pre class="brush:html">
 *   <Controls.slider:Base borderVisible="{{true}}"/>
 * </pre>
 */

/*
 * @name Controls/_slider/Base#borderVisible
 * @cfg {Boolean} sets the stroke around control
 * @example
 * Slider with border
 * <pre class="brush:html">
 *   <Controls.slider:Base borderVisible="{{true}}"/>
 * </pre>
 */

/**
 * @name Controls/_slider/Base#minValue
 * @cfg {Number} Устанавливает минимальное значение слайдера.
 * @remark Должно быть меньше, чем {@link maxValue}.
 * @example
 * Слайдер с границей:
 * <pre class="brush:html">
 *   <Controls.slider:Base minValue="{{10}}"/>
 * </pre>
 * @see maxValue
 */

/*
 * @name Controls/_slider/Base#minValue
 * @cfg {Number} sets the minimum value of slider
 * @remark must be less than maxValue
 * @example
 * Slider with border
 * <pre class="brush:html">
 *   <Controls.slider:Base minValue="{{10}}"/>
 * </pre>
 * @see maxValue
 */

/**
 * @name Controls/_slider/Base#maxValue
 * @cfg {Number} Устанавливает максимальное значение слайдера.
 * @remark Должно быть больше, чем {@link minValue}.
 * @example
 * Слайдер с границей:
 * <pre class="brush:html">
 *   <Controls.slider:Base maxValue="{{100}}"/>
 * </pre>
 * @see minValue
 */

/*
 * @name Controls/_slider/Base#maxValue
 * @cfg {Number} sets the maximum value of slider
 * @remark must be greater than minValue
 * @example
 * Slider with border
 * <pre class="brush:html">
 *   <Controls.slider:Base maxValue="{{100}}"/>
 * </pre>
 * @see minValue
 */

/**
 * @name Controls/_slider/Base#scaleStep
 * @cfg {Number} Параметр scaleStep определяет шаг шкалы, расположенной под слайдером.
 * @remark Шкала отображается, когда опция {@link borderVisible} установлена в значения false, а параметр scaleStep положительный.
 * @example
 * Слайдер со шкалой с шагом 20.
 * <pre class="brush:html">
 *   <Controls.slider:Base scaleStep="{{20}}"/>
 * </pre>
 */

/*
 * @name Controls/_slider/Base#scaleStep
 * @cfg {Number} The scaleStep option determines the step in the scale grid under the slider
 * @remark Scale displayed only if borderVisible is false and scaleStep is positive.
 * @example
 * Slider with scale step of 20
 * <pre class="brush:html">
 *   <Controls.slider:Base scaleStep="{{20}}"/>
 * </pre>
 */

/**
 * @name Controls/_slider/Base#value
 * @cfg {Number} Устанавливает текущее значение слайдера.
 * @remark Должно находиться в диапазоне [minValue..maxValue]
 * @example
 * Слайдер с ползунком, установленным в положение 40.
 * <pre class="brush:html">
 *   <Controls.slider:Base value="{{40}}"/>
 * </pre>
 */

/*
 * @name Controls/_slider/Base#value
 * @cfg {Number} sets the current value of slider
 * @remark Must be in range of [minValue..maxValue]
 * @example
 * Slider with the point placed at position 40;
 * <pre class="brush:html">
 *   <Controls.slider:Base value="{{40}}"/>
 * </pre>
 */

/**
 * @name Controls/_slider/Base#precision
 * @cfg {Number} Количество символов в десятичной части.
 * @remark Должно быть неотрицательным.
 * @example
 * Слайдер с целым значением:
 * <pre class="brush:html">
 *   <Controls.slider:Base precision="{{0}}"/>
 * </pre>
 */

/*
 * @name Controls/_slider/Base#precision
 * @cfg {Number} Number of characters in decimal part.
 * @remark Must be non-negative
 * @example
 * Slider with integer values;
 * <pre class="brush:html">
 *   <Controls.slider:Base precision="{{0}}"/>
 * </pre>
 */
class Base extends Control<ISliderBaseOptions> {
   protected _template: TemplateFunction = SliderTemplate;
   private _value: number = undefined;
   private _lineData: ILineData = undefined;
   private _pointData: IPointDataList = undefined;
   private _scaleData: IScaleData[] = undefined;

   private _tooltipValue: number | null = null;
   private _isDrag: boolean = false;

   private _render(minValue: number, maxValue: number, value: number): void {
      const rangeLength = maxValue - minValue;
      const right =  Math.min(Math.max((value - minValue), 0), rangeLength) / rangeLength * maxPercentValue;
      this._pointData[0].position = right;
      this._lineData.width = right;
   }

    private _renderTooltip(minValue: number, maxValue: number, value: number): void {
       const rangeLength = maxValue - minValue;
       this._pointData[1].position =
           Math.min(Math.max(value - minValue, 0), rangeLength) / rangeLength * maxPercentValue;
    }

   private _needUpdate(oldOpts: ISliderBaseOptions, newOpts: ISliderBaseOptions): boolean {
      return (oldOpts.scaleStep !== newOpts.scaleStep ||
         oldOpts.minValue !== newOpts.minValue ||
         oldOpts.maxValue !== newOpts.maxValue ||
         oldOpts.value !== newOpts.value);
   }

   private _checkOptions(opts: ISliderBaseOptions): void {
      Utils.checkOptions(opts);
      if (opts.value < opts.minValue || opts.value > opts.maxValue) {
         IoC.resolve('ILogger').error('Slider', 'value must be in the range [minValue..maxValue].');
      }
   }

   private _getValue(event: SyntheticEvent<MouseEvent | TouchEvent>): number {
      let targetX = event.type === 'mousedown' || event.type === 'touchstart'
          ? Utils.getNativeEventPageX(event) : event.nativeEvent.pageX;
      const box = this._children.area.getBoundingClientRect();
      const ratio = Utils.getRatio(targetX, box.left + window.pageXOffset, box.width);
      return Utils.calcValue(this._options.minValue, this._options.maxValue, ratio, this._options.precision);
   };

   private _setValue(val: number): void {
      this._notify('valueChanged', [val]);
   }

   protected _beforeMount(options: ISliderBaseOptions): void {
      this._checkOptions(options);
      this._scaleData = Utils.getScaleData(options.minValue, options.maxValue, options.scaleStep);
      this._value = options.value === undefined ? options.maxValue : options.value;
      this._pointData = [{name: 'point', position: 100}, {name: 'tooltip', position: 0}];
      this._lineData = {position: 0, width: 100};
      this._render(options.minValue, options.maxValue, this._value);
   }

   protected _beforeUpdate(options: ISliderBaseOptions): void {
      if (this._needUpdate(this._options, options)) {
         this._checkOptions(options);
         this._scaleData = Utils.getScaleData(options.minValue, options.maxValue, options.scaleStep);
      }
      this._render(options.minValue, options.maxValue, options.value);
      this._renderTooltip(options.minValue, options.maxValue, this._tooltipValue);
   }

   private _mouseDownAndTouchStartHandler(event: SyntheticEvent<MouseEvent | TouchEvent>): void {
      if (!this._options.readOnly) {
         this._isDrag = true;
         this._value = this._getValue(event);
         this._setValue(this._value);
         this._children.dragNDrop.startDragNDrop(this._children.point, event);
      }
   }

   private _onMouseMove(event: SyntheticEvent<MouseEvent>): void {
      if (!this._options.readOnly) {
         this._isDrag = false;
         this._tooltipValue = this._getValue(event);
      }
   }

   private _onMouseOut(event: SyntheticEvent<MouseEvent>): void {
      if (!this._options.readOnly && !this._isDrag) {
         this._tooltipValue = null;
      }
   }

   private _onDragNDropHandler(e: SyntheticEvent<Event>, dragObject) {
      if (!this._options.readOnly) {
         const box = this._children.area.getBoundingClientRect();
         const ratio = Utils.getRatio(dragObject.position.x, box.left + window.pageXOffset, box.width);
         this._value = Utils.calcValue(this._options.minValue, this._options.maxValue, ratio, this._options.precision);
         this._setValue(this._value);
      }
   }

   static _theme: string[] = ['Controls/slider'];

   static getDefaultOptions(): object {
      return {
         theme: 'default',
         size: 'm',
         borderVisible: false,
         minValue: undefined,
         maxValue: undefined,
         scaleStep: undefined,
         value: undefined,
         precision: 0
      };
   }

   static getOptionTypes(): object {
      return {
         size: EntityDescriptor(String).oneOf([
            's',
            'm'
         ]),
         borderVisible: EntityDescriptor(Boolean),
         minValue: EntityDescriptor(Number).required,
         maxValue: EntityDescriptor(Number).required,
         scaleStep: EntityDescriptor(Number),
         value: EntityDescriptor(Number),
         precision: EntityDescriptor(Number)
      };
   }
}

export default Base;
