/**
 * toggle library
 * @library Controls/toggle
 * @includes Button Controls/_toggle/Button
 * @includes Switch Controls/_toggle/Switch
 * @includes DoubleSwitch Controls/_toggle/DoubleSwitch
 * @includes RadioGroup Controls/_toggle/RadioGroup
 * @includes Checkbox Controls/_toggle/Checkbox
 * @includes Separator Controls/_toggle/Separator
 * @includes BigSeparator Controls/_toggle/BigSeparator
 * @includes BigSeparatorStyles Controls/_toggle/BigSeparator/BigSeparatorStyles
 * @includes ButtonStyles Controls/_toggle/Button/Styles
 * @includes CheckboxStyles Controls/_toggle/Checkbox/CheckboxStyles
 * @includes ICheckable Controls/_toggle/interface/ICheckable
 * @includes RadioGroupStyles Controls/_toggle/RadioGroup/RadioGroupStyles
 * @includes SeparatorStyles Controls/_toggle/Separator/SeparatorStyles
 * @includes SwitchStyles Controls/_toggle/Switch/SwitchStyles
 * @includes SwitchCircleStyles Controls/_toggle/resources/SwitchCircle/SwitchCircleStyles
 * @public
 * @author Kraynov D.
 */

import {default as Button} from 'Controls/_toggle/Button';
import {default as Switch} from 'Controls/_toggle/Switch';
import {default as DoubleSwitch} from 'Controls/_toggle/DoubleSwitch';
import RadioGroup = require('Controls/_toggle/RadioGroup');
import {default as CheckboxGroup} from 'Controls/_toggle/CheckboxGroup';
import {default as Checkbox} from 'Controls/_toggle/Checkbox';
import {default as Separator} from 'Controls/_toggle/Separator';
import {default as BigSeparator} from 'Controls/_toggle/BigSeparator';
import ItemTemplate = require('wml!Controls/_toggle/RadioGroup/resources/ItemTemplate');
import switchCircleTemplate = require('wml!Controls/_toggle/resources/SwitchCircle/SwitchCircle');

export {
   Button,
   Switch,
   DoubleSwitch,
   RadioGroup,
   Checkbox,
   CheckboxGroup,
   Separator,
   BigSeparator,
   ItemTemplate,
   switchCircleTemplate
};
