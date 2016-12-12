/**
 * Created by ps.borisov on 08.09.2016.
 */

define('js!SBIS3.CONTROLS.Slider',
   [
      'js!SBIS3.CORE.CompoundControl',
      'html!SBIS3.CONTROLS.Slider',
      'js!SBIS3.CONTROLS.DragNDropMixin',
      'js!SBIS3.CONTROLS.RangeMixin',
      'Core/IoC'
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
          * @class SBIS3.CONTROLS.Slider
          * @extends SBIS3.CORE.CompoundControl
          *
          * @mixes SBIS3.CONTROLS.DragNDropMixinNew
          * @mixes SBIS3.CONTROLS.RangeMixin
          *
          * @author Борисов Петр Сергеевич
          *
          * @css controls-Slider__withBorder Устанавливает отображение границы вокруг слайдера.
          *
          * @demo SBIS3.CONTROLS.Demo.SliderDemo
          */
         Slider = CompoundControl.extend([DragNDropMixinNew, RangeMixin],/** @lends SBIS3.CONTROLS.Slider.prototype */{
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
                  bigPoint: false//TODO:setter/getter
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
               this._endValue = this._prepareValue(this._options.endValue ? this._options.endValue : this._options.maxValue, 'right');
               this._startValue = this._prepareValue(this._options.startValue, 'left');
               this._pointsContainers = {
                  left: this._container.find('.controls-Slider__point__left'),
                  right: this._container.find('.controls-Slider__point__right')
               };
               this._pointsContainers.left.on('mousedown', this._initDrag.bind(this));
               this._pointsContainers.right.on('mousedown', this._initDrag.bind(this));
               //если заданы начальные и конечные значения то необходимо их отрисовать и нотифицировать об этом
               //если значения не заданы то точки встанут в начало и конец а start/endValue будут пустыми
               if (this._options.startValue || this._options.endValue) {
                  this._redraw();
               }
            },
             /**
              * Устанавливает значение, в котором находится левый ползунок слайдера.
              * @param {Number} value
              * @see startValue
              */
            setStartValue: function(value) {
               this._drawStartValue(value);
               Slider.superclass.setStartValue.apply(this, [value]);
            },
             /**
              * Устанавливает значение, в котором находится правый ползунок слайдера.
              * @param {Number} value
              * @see endValue
              */
            setEndValue: function(value) {
               this._drawEndValue(value);
               Slider.superclass.setEndValue.apply(this, [value]);
            },
             /**
              * Устанавливает минимальное значение слайдера.
              * @param {Number} minValue
              * @see getMinValue
              * @see minValue
              */
            setMinValue: function(minValue){
               if (minValue >= this._options.maxValue) {
                  IoC.resolve('ILogger').error('CONTROLS.Slider', 'Попытка установить некорректное минимальное значение');
               } else {
                  this._options.minValue = minValue;
                  this._drawStartValue(this._options._startValue);
                  this._drawEndValue(this._options._endValue);
               }
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
            setMaxValue: function(maxValue) {
               if (maxValue <= this._options.minValue) {
                  IoC.resolve('ILogger').error('CONTROLS.Slider', 'Попытка установить некорректное максимальное значение');
               } else {
                  this._options.maxValue = maxValue;
                  this._drawStartValue(this._options._startValue);
                  this._drawEndValue(this._options._endValue);
               }
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

            _prepareValue: function(value, side) {
               value = value || value === 0 ? value : side === 'left'? this._options.minValue : this._options.maxValue;
               if (value > this._options.maxValue) {
                  value = this._options.maxValue;
               }
               if (value < this._options.minValue ) {
                  value = this._options.minValue;
               }
               if (side === 'left' && value > this._endValue) {
                  value = this._endValue;
               }
               if (side === 'right' && value < this._startValue) {
                  value = this._startValue;
               }
               value = +value;
               return +value.toFixed(this._options.decimals);
            },

            _redraw: function() {
               var
                  rangeLength = this._options.maxValue - this._options.minValue,
                  left = (this._startValue - this._options.minValue) / rangeLength * 100,
                  right = (this._endValue - this._options.minValue) / rangeLength * 100,
                  width = right - left;
               this._pointsContainers.right.css('left', right  + '%');
               this._pointsContainers.left.css('left', left + '%');
               this._fullLine.css('left',  left + '%');
               this._fullLine.css('width', width + '%');
            },

            _drawStartValue: function(value){
               value = this._prepareValue(value, 'left');
               this._startValue = value;
               this._redraw();
            },

            _drawEndValue: function(value){
               value = this._prepareValue(value, 'right');
               this._endValue = value;
               this._redraw();
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
               this._dragInProcess = true;
               this._container.find('.controls-Slider__point').removeClass('lastActivePoint');
               $(event.target).addClass('lastActivePoint');
               DragObject.setOwner(this);
               DragObject.setTarget(event.target);
               this._shift =  event.pageX - event.target.getBoundingClientRect().left - pageXOffset;
            },

            _onDragHandler: function(DragObject, event) {
               if (DragObject.getOwner() === this) {
                  var
                     width = this._container.width(),
                     instance = DragObject.getOwner(),
                     rangeLength = instance._options.maxValue - instance._options.minValue,
                     side = $(DragObject.getTarget()).hasClass('controls-Slider__point__left') ? 'left' : 'right',
                     percent = (event.pageX - instance._shift - instance._wrapper[0].getBoundingClientRect().left - pageXOffset) / (width - constants.pointWidth[instance._options.bigPoint ? 'big' : 'small']), //дробная часть от того что надо выделить
                     value = instance._options.minValue + percent * rangeLength;
                  if (instance._dragInProcess && instance.isEnabled()) {
                     instance[side === 'left' ? '_drawStartValue' : '_drawEndValue'](value);
                     this._notify('onDrawValueChange', this._startValue, this._endValue)
                  }
               }
            },

            _endDragHandler: function(DragObject, event) {
               var
                  instance = DragObject.getOwner();
               if (instance.isEnabled()) {
                  if ($(DragObject.getTarget()).hasClass('controls-Slider__point__left')) {
                     instance.setStartValue(instance._startValue);
                  } else {
                     instance.setEndValue(instance._endValue);
                  }
               }
               instance._dragInProcess = false;
            }
         });
      return Slider;
   });
