/**
 * List library
 * @library Controls/input
 * @includes Base Controls/_input/Base
 * @includes Area Controls/_input/Area
 * @includes Number Controls/_input/Number
 * @includes Text Controls/_input/Text
 * @includes Label Controls/_input/Label
 * @includes Mask Controls/_input/Mask
 * @includes Phone Controls/_input/Phone
 * @includes Password Controls/_input/Password
 * @includes DateBase Controls/_input/DateTime
 * @includes Date Controls/_input/Date/Picker
 * @includes Time Controls/_input/Time/Picker
 * @includes DateTimeModel Controls/_input/DateTime/Model
 * @includes TimeInterval Controls/_input/TimeInterval
 * @includes Money Controls/_input/Money
 * @includes Render Controls/_input/Render
 *
 * @includes BaseStyles Controls/_input/Base/Styles
 * @includes RenderStyles Controls/_input/Render/Styles
 * @includes PasswordStyles Controls/_input/Password/PasswordStyles
 * @includes InputRenderStyles Controls/_input/resources/InputRender/InputRenderStyles
 *
 * @public
 * @author Kraynov D.
 */

import Base = require('Controls/_input/Base');
import Area = require('Controls/_input/Area');
import Number = require('Controls/_input/Number');
import Text = require('Controls/_input/Text');
import {default as Label} from 'Controls/_input/Label';
import Mask = require('Controls/_input/Mask');
import Phone = require('Controls/_input/Phone');
import Password = require('Controls/_input/Password');
import DateBase = require('Controls/_input/DateTime');
import Date = require('Controls/_input/Date/Picker');
import {default as Render} from 'Controls/_input/Render';
import TimeInterval from 'Controls/_input/TimeInterval';
import Money from 'Controls/_input/Money';
import * as ActualAPI from 'Controls/_input/ActualAPI';

import BaseViewModel = require('Controls/_input/Base/ViewModel');
import TextViewModel = require('Controls/_input/Text/ViewModel');
import MaskFormatBuilder = require('Controls/_input/Mask/FormatBuilder');
import MaskInputProcessor = require('Controls/_input/Mask/InputProcessor');
import StringValueConverter = require('Controls/_input/DateTime/StringValueConverter');
import InputRender = require('Controls/_input/resources/InputRender/InputRender');
import inputTemplate = require('wml!Controls/_input/resources/input');

import lengthConstraint from 'Controls/_input/InputCallback/lengthConstraint';

import INewLineKey from 'Controls/_input/interface/INewLineKey';

const InputCallback = {
    lengthConstraint
};

export {
    Base,
    Area,
    Number,
    Text,
    Label,
    Mask,
    Phone,
    Password,
    DateBase,
    Date,
    Render,
    TimeInterval,
    Money,
    BaseViewModel,
    TextViewModel,
    MaskFormatBuilder,
    MaskInputProcessor,
    StringValueConverter,
    InputRender,
    inputTemplate,
    InputCallback,
    INewLineKey,
    Render,
    ActualAPI
};
