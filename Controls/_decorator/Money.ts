import Env = require('Env/Env');
import Control = require('Core/Control');
import entity = require('Types/entity');
import splitIntoTriads = require('Controls/Utils/splitIntoTriads');
import template = require('wml!Controls/_decorator/Money/Money');

/**
 * Converts a number to money.
 *
 * @class Controls/_decorator/Money
 * @extends Core/Control
 *
 * @mixes Controls/_decorator/Money/Styles
 * @mixes Controls/_interface/INumberFormat
 *
 * @public
 * @demo Controls-demo/Decorators/Money/Money
 *
 * @author Krasilnikov A.S.
 */

/**
 * @name Controls/_decorator/Money#number
 * @cfg {Number} Number to convert.
 * @deprecated Use option {@link value}
 */

/**
 * @name Controls/_decorator/Money#value
 * @cfg {String|Number} Value in number format to convert.
 */

/**
 * @name Controls/_decorator/Money#delimiters
 * @cfg {Boolean} Determines whether the number should be split into triads.
 * @default false
 * @remark
 * true - the number split into triads.
 * false - does not do anything.
 * @deprecated Use option {@link Controls/input:Number#useGrouping}
 */


/**
 * @name Controls/_decorator/Money#style
 * @cfg {String} The type with which you want to display money.
 * @variant accentResults
 * @variant noAccentResults
 * @variant group
 * @variant basicRegistry
 * @variant noBasicRegistry
 * @variant accentRegistry
 * @variant noAccentRegistry
 * @variant error
 * @variant default
 * @default default
 */

var _private = {
   searchPaths: /(-?[0-9]*?)(\.[0-9]{2})/,

   parseNumber: function (value, delimiters) {
      var exec = this.searchPaths.exec(parseFloat(value).toFixed(2));

      if (!exec) {
         Env.IoC.resolve('ILogger').error('Controls/_decorator/Money', 'That is not a valid option value: ' + value + '.');
         exec = ['0.00', '0', '.00'];
      }

      var integer = delimiters ? splitIntoTriads(exec[1]) : exec[1];
      var fraction = exec[2];

      return {
         integer: integer,
         fraction: fraction,
         number: integer + fraction
      };
   },

   isUseGrouping: function (options, useLogging) {
      if ('delimiters' in options) {
         if (useLogging) {
            Env.IoC.resolve('ILogger').warn('Controls/_decorator/Money', 'Опция delimiters устарела, используйте useGrouping.');
         }

         return options.delimiters;
      }

      return options.useGrouping;
   },

   getValue: function (options, useLogging) {
      if ('number' in options) {
         if (useLogging) {
            Env.IoC.resolve('ILogger').warn('Controls/_decorator/Money', 'Опция number устарела, используйте value.');
         }

         return options.number.toString();
      }

      return options.value;
   }
};

var Money = Control.extend({
   _template: template,

   _parsedNumber: null,

   _beforeMount: function (options) {
      this._parsedNumber = _private.parseNumber(
         _private.getValue(options, true),
         _private.isUseGrouping(options, true)
      );
   },

   _beforeUpdate: function (newOptions) {
      var newUseGrouping = _private.isUseGrouping(newOptions, false);
      var oldUseGrouping = _private.isUseGrouping(this._options, false);
      var newValue = _private.getValue(newOptions, false);
      var oldValue = _private.getValue(this._options, false);

      if (newValue !== oldValue || newUseGrouping !== oldUseGrouping) {
         this._parsedNumber = _private.parseNumber(newValue, newUseGrouping);
      }
   },

   _isDisplayFractionPath: function(value, showEmptyDecimals) {
      return showEmptyDecimals || value !== '.00';
   }
});

Money.getDefaultOptions = function () {
   return {
      style: 'default',
      useGrouping: true,
      showEmptyDecimals: true
   };
};

Money.getOptionTypes = function () {
   return {
      style: entity.descriptor(String),
      useGrouping: entity.descriptor(Boolean),
      value: entity.descriptor(String, Number)
   };
};

Money._theme = ['Controls/decorator'];

Money._private = _private;

export = Money;
