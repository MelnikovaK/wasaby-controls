import Env = require('Env/Env');
import Base = require('Controls/_input/Base');
import entity = require('Types/entity');
import ViewModel = require('Controls/_input/Number/ViewModel');


/**
 * Controls that allows user to enter single-line number.
 * <a href="/materials/demo-ws4-input">Demo example.</a>.
 *
 * @class Controls/_input/Number
 * @extends Controls/_input/Base
 *
 * @mixes Controls/interface/IInputBase
 * @mixes Controls/interface/IOnlyPositive
 * @mixes Controls/interface/IInputNumber
 * @mixes Controls/_interface/INumberFormat
 *
 * @public
 * @demo Controls-demo/Input/Number/NumberPG
 *
 * @author Красильников А.С.
 */

/**
 * @name Controls/_input/Number#precision
 * @cfg {Number} Number of characters in decimal part.
 * @remark
 * If the fractional part is not fully filled, the missing signs will be replaced by 0.
 * When the value is not set, the number of signs is unlimited.
 * @example
 * In this example you the _inputValue state of the control will store a number with a fractional part of equal 2 signs.
 * <pre>
 *    <Controls._input.Number bind:value="_inputValue" precision="{{2}}"/>
 * </pre>
 */

/**
 * @name Controls/_input/Number#integersLength
 * @cfg {Number} Maximum integer part length.
 * @remark
 * When the value is not set, the integer part length is unlimited.
 * @example
 * In this example you the _inputValue in the control state will store a number with a integer part of no more than 10 signs.
 * <pre>
 *    <Controls._input.Number bind:value="_inputValue" integersLength="{{10}}"/>
 * </pre>
 */

var _private = {
    validateOptions: function (options) {
        if (options.integersLength <= 0) {
            Env.IoC.resolve('ILogger').error('Number', 'Incorrect integers length: ' + options.integersLength + '. Integers length must be greater than 0.');
        }
    },
    convertToNumber: function (value) {
        return value === null ? void 0 : value;
    }
};

var NumberInput = Base.extend({
    _getViewModelOptions: function (options) {
        _private.validateOptions(options);

        return {
            precision: _private.convertToNumber(options.precision),
            useGrouping: options.useGrouping,
            onlyPositive: options.onlyPositive,
            integersLength: _private.convertToNumber(options.integersLength),
            showEmptyDecimals: options.showEmptyDecimals,
            useAdditionToMaxPrecision: options.showEmptyDecimals
        };
    },

    _getViewModelConstructor: function () {
        return ViewModel;
    },

    _changeHandler: function () {
        if (this._viewModel.trimTrailingZeros(true)) {
            this._notifyValueChanged();
        }

        NumberInput.superclass._changeHandler.apply(this, arguments);
    },

    _focusInHandler: function () {
        if (this._viewModel.addTrailingZero()) {
            this._notifyValueChanged();
        }

        NumberInput.superclass._focusInHandler.apply(this, arguments);
    },

    _focusOutHandler: function () {
        if (this._viewModel.trimTrailingZeros(false)) {
            this._notifyValueChanged();
        }

        NumberInput.superclass._focusOutHandler.apply(this, arguments);
    }
});

NumberInput.getDefaultOptions = function () {
    var defaultOptions = Base.getDefaultOptions();

    defaultOptions.value = 0;
    defaultOptions.useGrouping = true;
    defaultOptions.onlyPositive = false;
    defaultOptions.showEmptyDecimals = false;

    return defaultOptions;
};

NumberInput.getOptionTypes = function () {
    const optionTypes = Base.getOptionTypes();

    optionTypes.value = entity.descriptor(Number, null);
    optionTypes.precision = entity.descriptor(Number, null);
    optionTypes.integersLength = entity.descriptor(Number, null);
    optionTypes.useGrouping = entity.descriptor(Boolean);
    optionTypes.onlyPositive = entity.descriptor(Boolean);
    optionTypes.showEmptyDecimals = entity.descriptor(Boolean);

    return optionTypes;
};

export = NumberInput;
   
