/**
 * Created by ps.borisov on 08.09.2016.
 */

define('SBIS3.CONTROLS/Slider',
   [
      'Lib/Control/CompoundControl/CompoundControl',
      'tmpl!SBIS3.CONTROLS/Slider/Slider',
      'SBIS3.CONTROLS/Mixins/DragNDropMixin',
      'SBIS3.CONTROLS/Mixins/RangeMixin',
      'Core/IoC',
      'css!SBIS3.CONTROLS/Slider/Slider'
   ], function(CompoundControl, dotTplFn, DragNDropMixinNew, RangeMixin, IoC) {
      'use strict';
      //TODO: documentation
      ///controls-Slider__withBorder
      var
         constants = {
            pointWidth: {
               big: 20,
               small: 12
            }
         },
         /**
          * Класс контрола "Слайдер".
          *
          * @class SBIS3.CONTROLS/Slider
          * @extends Lib/Control/CompoundControl/CompoundControl
          * @public
          * @control
          *
          * @mixes SBIS3.CONTROLS/Mixins/DragNDropMixin
          * @mixes SBIS3.CONTROLS/Mixins/RangeMixin
          *
          * @author Борисов П.С.
          *
          * @ignoreEvents onAfterLoad onChange onStateChange
          * @ignoreEvents onDragStop onDragIn onDragOut onDragStart
          *
          * @css controls-Slider__withBorder Устанавливает отображение границы вокруг слайдера.
          *
          * @demo SBIS3.CONTROLS.Demo.SliderDemo
          */
         Slider = CompoundControl.extend([DragNDropMixinNew, RangeMixin],/** @lends SBIS3.CONTROLS/Slider.prototype */{
             /**
              * @event onDrawValueChange Происходит при отрисовке нового положения ползунка слайдера.
              * @param {Number} startValue Положение левого ползунка слайдера.
              * @param {Number} endValue Положение правого ползунка слайдера.
              */
            _dotTplFn : dotTplFn,
            $protected: {
               _options: {
                   /**
                    * @cfg {Number} Устанавливает минимальное значение слайдера.
                    * @remark
                    * Когда опция не задана, минимальное значение устанавливается по {@link startValue}.
                    * Значение опции можно получить/изменить с помощью методов {@link getMinValue} и {@link setMinValue}.
                    * @see maxValue
                    * @see getMinValue
                    * @see setMinValue
                    */
                  minValue: undefined,
                   /**
                    * @cfg {Number} Устанавливает максимальное значение слайдера.
                    * @remark
                    * Когда опция не задана, максимальное значение устанавливается по {@link endValue}.
                    * Значение опции можно получить/изменить с помощью методов {@link getMaxValue} и {@link setMaxValue}.
                    * @see minValue
                    * @see getMaxValue
                    * @see setMaxValue
                    */
                  maxValue: undefined,
                   /**
                    * @cfg {Number} Устанавливает значение, в котором находится левый ползунок слайдера.
                    * @remark
                    * Значение опции можно изменить с помощью метода {@link setStartValue}.
                    * @see setStartValue
                    */
                  startValue: undefined,
                   /**
                    * @cfg {Number} Устанавливает значение, в котором находится правый ползунок слайдера.
                    * @remark
                    * Значение опции можно изменить с помощью метода {@link setEndValue}.
                    * @see setEndValue
                    */
                  endValue: undefined,
                   /**
                    * @cfg {Number} Устанавливает число знаков после запятой для значения слайдера.
                    */
                  decimals: 0,//TODO:setter/getter
                   /**
                    * @cfg {Boolean} Устанавливает отображение только одного ползунка.
                    * @remark
                    * В значении true опция {@link startValue} будет установлена по значению опции {@link minValue}.
                    */
                  single: false,//TODO:setter/getter
                   /**
                    * @cfg {String} Устанавливает подпись слева.
                    * @see endLabel
                    */
                  startLabel: undefined,//TODO:setter/getter
                   /**
                    * @cfg {String} Устанавливает подпись справа.
                    * @see startLabel
                    */
                  endLabel: undefined,//TODO:setter/getter
                   /**
                    * @cfg {Boolean} Устанавливает отображение больших ползунков слайдера.
                    */
                  bigPoint: false,//TODO:setter/getter,
                  /**
                   * @cfg {array} шкала под слайдером
                   */
                  scale: false
               },
               _endValue: 0,
               _startValue: 0,
               _shift : 0,
               _fullLine: undefined,
               _dragInProcess: false,
               _wrapper: undefined
            },

            _modifyOptions: function(options) {
               options = Slider.superclass._modifyOptions.apply(this, arguments);
               if (options.single) {
                  options.startValue  = options.minValue;
               }
               if (options.minValue === undefined) {
                  options.minValue = options.startValue;
               }
               if (options.maxValue === undefined) {
                  options.maxValue = options.endValue;
               }
               return options;
            },

            $constructor: function() {
               this._publish('onDrawValueChange');
               this._fullLine = this._container.find('.controls-Slider__line__full');
               this._wrapper = this._container.find('.controls-Slider__wrapper');
               this._endValue = this._prepareValue(this._options.endValue, 'end');
               this._startValue = this._prepareValue(this._options.startValue, 'start');
               this._pointsContainers = {
                  start: this._container.find('.controls-Slider__point__start'),
                  end: this._container.find('.controls-Slider__point__end')
               };
               this._pointsContainers.start.on('mousedown touchstart', this._initDrag.bind(this));
               this._pointsContainers.end.on('mousedown touchstart', this._initDrag.bind(this));
               //если заданы начальные и конечные значения то необходимо их отрисовать и нотифицировать об этом
               //если значения не заданы то точки встанут в начало и конец а start/endValue будут пустыми
               if (this._options.startValue !== this._options.minValue || this._options.endValue !== this._options.maxValue) {
                  this._redraw();
               }
               this._container.find('.controls-Slider__line__wrapper').on('click', this._lineClick.bind(this));
            },
             /**
              * Устанавливает значение, в котором находится левый ползунок слайдера.
              * @param {Number} value
              * @see startValue
              */
            setStartValue: function(value) {
               this._drawValue(value, 'start');
               Slider.superclass.setStartValue.apply(this, [value]);
            },
             /**
              * Устанавливает значение, в котором находится правый ползунок слайдера.
              * @param {Number} value
              * @see endValue
              */
            setEndValue: function(value) {
               this._drawValue(value, 'end');
               Slider.superclass.setEndValue.apply(this, [value]);
            },
            /**
             * Устанавливает минимальное значение слайдера.
             * @param {Number} minValue
             * @see getMinValue
             * @see minValue
             */
            setMinValue: function(value){
               this._setMinMaxValue(value, 'min');
            },
             /**
              * Возвращает минимальное значение слайдера.
              * @returns {Number}
              * @see setMinValue
              * @see minValue
              */
            getMinValue: function(){
               return this._options.minValue;
            },
            /**
             * Устанавливает максимальное значение слайдера.
             * @param {Number} maxValue
             * @see maxValue
             * @see getMaxValue
             */
            setMaxValue: function(value) {
               this._setMinMaxValue(value, 'max');
            },
             /**
              * Возвращает максимальное значение слайдера.
              * @returns {Number}
              * @see maxValue
              * @see setMaxValue
              */
            getMaxValue: function(){
               return this._options.maxValue;
            },

            setMinMaxValue: function(min, max) {
               this._options.minValue = min;
               this._options.maxValue = max;
               this.setMinValue(min);
               this.setMaxValue(max);
               this._redrawValues();
            },

            _prepareValue: function(value, side) {
               value = value || value === 0 ? value : side === 'start'? this._options.minValue : this._options.maxValue;
               if (value > this._options.maxValue) {
                  value = this._options.maxValue;
               }
               if (value < this._options.minValue ) {
                  value = this._options.minValue;
               }
               if (side === 'start' && value > this._endValue) {
                  value = this._endValue;
               }
               if (side === 'end' && value < this._startValue) {
                  value = this._startValue;
               }
               value = + value;
               return + value.toFixed(this._options.decimals);
            },

            _redraw: function() {
               var
                  rangeLength = this._options.maxValue - this._options.minValue,
                  left = (this._startValue - this._options.minValue) / rangeLength * 100,
                  right = (this._endValue - this._options.minValue) / rangeLength * 100,
                  width = right - left;
               this._pointsContainers.end.css('left', right  + '%');
               this._pointsContainers.start.css('left', left + '%');
               this._fullLine.css('left',  left + '%');
               this._fullLine.css('width', width + '%');
            },

            _drawValue: function(value, side){
               value = this._prepareValue(value, side);
               side === 'start' ? this._startValue = value : this._endValue = value;
               this._redraw();
            },

            _setMinMaxValue: function(value, side){
               var
                  validation = side === 'min' ? value >= this._options.maxValue : value <= this._options.minValue;
               if (validation) {
                  IoC.resolve('ILogger').error('CONTROLS.Slider', 'Попытка установить некорректное конечное значение');
               } else {
                  this._updateMinMaxValue(value, side);
               }
            },

            _updateMinMaxValue: function(value, side){
               var
                  optionName = side === 'min' ? 'minValue' : 'maxValue';
               if (this._options[optionName] != value) {
                  this._options[optionName] = value;
                  this._redrawValues();
               }
            },

            _redrawValues: function(){
               this._drawValue(this._options.startValue, 'start');
               this._drawValue(this._options.endValue, 'end');
            },
            //DragNDropMixin методы
            _initDrag: function(event) {
               event.preventDefault();
               Slider.superclass._initDrag.apply(this, arguments);
            },

            _findDragDropContainer: function(){
               return  $(document);
            },

            _beginDragHandler: function(DragObject, event) {
               var
                  dotSizes = event.target.getBoundingClientRect();
               this._dragInProcess = true;
               this._container.find('.controls-Slider__point').removeClass('lastActivePoint');
               $(event.target).addClass('lastActivePoint');
               DragObject.setOwner(this);
               DragObject.setTarget(event.target);
               this._shift =  event.pageX - dotSizes.left - dotSizes.width / 2 - pageXOffset;
            },

            _onDragHandler: function(DragObject, event) {
               if (DragObject.getOwner() === this) {
                  var
                     instance = DragObject.getOwner(),
                     side = $(DragObject.getTarget()).hasClass('controls-Slider__point__start') ? 'start' : 'end',
                     value = instance._calcValue(event.pageX);
                  if (instance._dragInProcess && instance.isEnabled()) {
                     instance._drawValue(value, side);
                     this._notify('onDrawValueChange', this._startValue, this._endValue)
                  }
               }
            },

            _endDragHandler: function(DragObject) {
               if (DragObject.getOwner() === this) {
                  var
                     instance = DragObject.getOwner();
                  if (instance.isEnabled()) {
                     if ($(DragObject.getTarget()).hasClass('controls-Slider__point__start')) {
                        instance.setStartValue(instance._startValue);
                     } else {
                        instance.setEndValue(instance._endValue);
                     }
                  }
                  instance._dragInProcess = false;
               }
            },
            _calcValue: function(pageX) {
                var
                  width = this._container.width(),
                  rangeLength = this._options.maxValue - this._options.minValue,
                  percent = (pageX - this._shift - this._wrapper[0].getBoundingClientRect().left - pageXOffset) / width; //дробная часть от того что надо выделить
                return this._options.minValue + percent * rangeLength;
            },

            _calcSide: function(value) {
               var
                  side ='end';
               if (this._options.single) {
                  side = "end";
               } else if (value < this._startValue) {
                  side = "start";
               } else if (value > this._endValue) {
                  side = "end";
               } else {
                  side = (this._endValue - this._startValue) / 2 + this._startValue > value ? "start" : 'end';
               }
               return side;
            },
            _lineClick: function(event){
               this._shift = 0;
               var
                  value = this._calcValue(event.pageX),
                  side = this._calcSide(value);
               value = this._prepareValue(value, side);
               if (this.isEnabled()) {
                  if (side === 'start') {
                     this.setStartValue(value);
                  } else {
                     this.setEndValue(value);
                  }
                  this._notify('onDrawValueChange', this._startValue, this._endValue)
               }
            }
         });
      return Slider;
   });
