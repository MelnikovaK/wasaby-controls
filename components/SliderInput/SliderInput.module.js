/**
 * Created by ps.borisov on 08.09.2016.
 */

define('js!SBIS3.CONTROLS.SliderInput',
   [
      'js!SBIS3.CONTROLS.Slider',
      'html!SBIS3.CONTROLS.SliderInput',
      'js!SBIS3.CONTROLS.NumberTextBox'
   ], function(Slider, dotTplFn) {
      'use strict';
      var
         SliderInput = Slider.extend(/** @lends SBIS3.CONTROLS.SliderInput.prototype */{
            _dotTplFn : dotTplFn,
            $protected: {
               _options: {
                  startLabel: '',
                  middleLabel: '',
                  endLabel: ''
               },
               _endTextBox: undefined,
               _startTextBox: undefined
            },

            init: function() {
               SliderInput.superclass.init.call(this);
               this._textBoxStartChange = this._textBoxStartChange.debounce(300)
               this._textBoxEndChange = this._textBoxEndChange.debounce(300)
               this._endTextBox = this.getChildControlByName('EndTextBox');
               this._startTextBox = this.getChildControlByName('StartTextBox');
               this._startTextBox.subscribe('onTextChange', this._textBoxStartChange.bind(this));
               this._endTextBox.subscribe('onTextChange', this._textBoxEndChange.bind(this));
               this.subscribe('onDrawValueChange', this._sliderDrawChange.bind(this));
            },

            setStartValue: function(value) {
               SliderInput.superclass.setStartValue.apply(this, [value]);
               this._startTextBox.setText(value);
            },

            setEndValue: function(value) {
               SliderInput.superclass.setEndValue.apply(this, [value]);
               this._endTextBox.setText(value);
            },

            _textBoxStartChange: function () {
               if (this._startTextBox._textChanged) {
                  this._setPreparedStartVale(this._startTextBox.getNumericValue());
                  this._pointsContainers.right.removeClass('lastActivePoint');
                  this._pointsContainers.left.addClass('lastActivePoint');
               }
            },

            _textBoxEndChange: function () {
               if (this._endTextBox._textChanged) {
                  this._setPreparedEndVale(this._endTextBox.getNumericValue());
                  this._pointsContainers.left.removeClass('lastActivePoint');
                  this._pointsContainers.right.addClass('lastActivePoint');
               }
            },

            _sliderDrawChange: function(event, start, end) {
               if (!(!this._options.startValue && start == this._options.minValue)) { //если стартовая величина не задана, и start стоит на maxValue => левую часть фильтра не трогали
                  this._startTextBox.setText(start);
               }
               if (!(!this._options.endValue && end == this._options.maxValue)) { //если конечная величина не задана, и end стоит на endValue => правую часть фильтра не трогали
                  this._endTextBox.setText(end);
               }
            },

            _setPreparedStartVale : function(value){
               value = value || value === 0 ? this._prepareValue(value, 'left') : value;
               this.setStartValue(value);
            },

            _setPreparedEndVale : function(value){
               value = value || value === 0 ? this._prepareValue(value, 'right') : value
               this.setEndValue(value);
            }
         });
      return SliderInput;
   });
